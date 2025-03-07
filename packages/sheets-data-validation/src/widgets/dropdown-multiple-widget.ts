/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HorizontalAlign, ICommandService, VerticalAlign } from '@univerjs/core';
import type { ICellRenderContext } from '@univerjs/core';
import { getFontStyleString, type IMouseEvent, type IPointerEvent, type Spreadsheet, type SpreadsheetSkeleton, type UniverRenderingContext2D } from '@univerjs/engine-render';
import type { IBaseDataValidationWidget } from '@univerjs/data-validation';
import type { ListMultipleValidator } from '../validators/list-multiple-validator';
import { getCellValueOrigin } from '../utils/get-cell-data-origin';
import type { IShowDataValidationDropdownParams } from '../commands/operations/data-validation.operation';
import { ShowDataValidationDropdown } from '../commands/operations/data-validation.operation';
import type { IDropdownInfo } from './dropdown-widget';
import { CELL_PADDING_H, CELL_PADDING_V, Dropdown, ICON_PLACE, layoutDropdowns, MARGIN_V } from './shape';

const downPath = new Path2D('M3.32201 4.84556C3.14417 5.05148 2.85583 5.05148 2.67799 4.84556L0.134292 1.90016C-0.152586 1.56798 0.0505937 1 0.456301 1L5.5437 1C5.94941 1 6.15259 1.56798 5.86571 1.90016L3.32201 4.84556Z');

export class DropdownMultipleWidget implements IBaseDataValidationWidget {
    zIndex?: number | undefined;
    private _dropdownInfoMap: Map<string, Map<string, IDropdownInfo>> = new Map();

    constructor(
        @ICommandService private readonly _commandService: ICommandService
    ) {}

    private _ensureMap(subUnitId: string) {
        let map = this._dropdownInfoMap.get(subUnitId);

        if (!map) {
            map = new Map();
            this._dropdownInfoMap.set(subUnitId, map);
        }
        return map;
    }

    private _generateKey(row: number, col: number) {
        return `${row}.${col}`;
    }

    private _drawDownIcon(ctx: UniverRenderingContext2D, cellBounding: { startX: number;startY: number }, cellWidth: number, cellHeight: number, vt: VerticalAlign) {
        const left = cellWidth - ICON_PLACE + 4;
        let top = 4;

        switch (vt) {
            case VerticalAlign.MIDDLE:
                top = (cellHeight - ICON_PLACE) / 2 + 4;
                break;
            case VerticalAlign.BOTTOM:
                top = (cellHeight - ICON_PLACE) + 4;
                break;
            default:
                break;
        }

        ctx.save();
        ctx.translateWithPrecision(cellBounding.startX + left, cellBounding.startY + top);
        ctx.fillStyle = '#565656';
        ctx.fill(downPath);
        ctx.restore();
    }

    drawWith(ctx: UniverRenderingContext2D, info: ICellRenderContext, skeleton: SpreadsheetSkeleton, spreadsheets: Spreadsheet): void {
        const { primaryWithCoord, row, col, style, data, subUnitId } = info;
        const cellBounding = primaryWithCoord.isMergedMainCell ? primaryWithCoord.mergeInfo : primaryWithCoord;
        const validation = data.dataValidation;
        const cellWidth = cellBounding.endX - cellBounding.startX;
        const cellHeight = cellBounding.endY - cellBounding.startY;

        const map = this._ensureMap(subUnitId);
        const key = this._generateKey(row, col);

        if (!validation) {
            return;
        }
        const { cl } = style || {};
        const color = (typeof cl === 'object' ? cl?.rgb : cl) ?? '#000';
        const fontStyle = getFontStyleString(style ?? undefined);
        const { rule, validator: _validator } = validation;
        const validator = _validator as ListMultipleValidator;
        const { vt: _vt, ht } = style || {};
        const vt = _vt ?? VerticalAlign.MIDDLE;
        const cellValue = getCellValueOrigin(data) ?? '';
        const items = validator.parseCellValue(cellValue, rule);
        const labelColorMap = validator.getListWithColorMap(rule);
        const layout = layoutDropdowns(items, fontStyle, cellWidth, cellHeight);
        this._drawDownIcon(ctx, cellBounding, cellWidth, cellHeight, vt);
        ctx.save();
        ctx.translateWithPrecision(cellBounding.startX, cellBounding.startY);
        ctx.beginPath();
        ctx.rect(0, 0, cellWidth - ICON_PLACE, cellHeight);
        ctx.clip();
        ctx.translateWithPrecision(CELL_PADDING_H, CELL_PADDING_V);
        let top = 0;
        switch (vt) {
            case VerticalAlign.MIDDLE:
                top = (layout.contentHeight - layout.totalHeight) / 2;
                break;
            case VerticalAlign.BOTTOM:
                top = (layout.contentHeight - layout.totalHeight);
                break;
            default:
                break;
        }
        ctx.translateWithPrecision(0, top);
        layout.lines.forEach((line, index) => {
            ctx.save();
            const { width, height, items } = line;
            let left = 0;
            switch (ht) {
                case HorizontalAlign.RIGHT:
                    left = layout.contentWidth - width;
                    break;
                case HorizontalAlign.CENTER:
                    left = (layout.contentWidth - width) / 2;
                    break;
                default:
                    break;
            }
            ctx.translate(left, index * (height + MARGIN_V));
            items.forEach((item) => {
                ctx.save();
                ctx.translateWithPrecision(item.left, 0);
                Dropdown.drawWith(ctx, {
                    ...fontStyle,
                    info: item,
                    color,
                    fill: labelColorMap[item.text],
                });
                ctx.restore();
            });

            ctx.restore();
        });

        ctx.restore();

        map.set(key, {
            left: cellBounding.startX,
            top: cellBounding.startY,
            width: layout.contentWidth + CELL_PADDING_H + ICON_PLACE,
            height: layout.contentHeight + CELL_PADDING_V * 2,
        });
    }

    calcCellAutoHeight(info: ICellRenderContext): number | undefined {
        const { primaryWithCoord, style, data } = info;
        const cellBounding = primaryWithCoord.isMergedMainCell ? primaryWithCoord.mergeInfo : primaryWithCoord;
        const validation = data.dataValidation;
        if (!validation) {
            return undefined;
        }
        const cellWidth = cellBounding.endX - cellBounding.startX;
        const cellHeight = cellBounding.endY - cellBounding.startY;
        const cellValue = getCellValueOrigin(data) ?? '';
        const { rule, validator: _validator } = validation;
        const validator = _validator as ListMultipleValidator;
        const items = validator.parseCellValue(cellValue, rule);
        const fontStyle = getFontStyleString(style ?? undefined);
        const layout = layoutDropdowns(items, fontStyle, cellWidth, cellHeight);
        return layout.cellAutoHeight;
    }

    isHit(position: { x: number; y: number }, info: ICellRenderContext) {
        const { primaryWithCoord } = info;
        const cellBounding = primaryWithCoord.isMergedMainCell ? primaryWithCoord.mergeInfo : primaryWithCoord;
        const { endX } = cellBounding;
        const { x } = position;
        if (x >= endX - ICON_PLACE && x <= endX) {
            return true;
        }
        return false;
    };

    onPointerDown(info: ICellRenderContext, evt: IPointerEvent | IMouseEvent) {
        if (evt.button === 2) {
            return;
        }
        const { unitId, subUnitId, row, col } = info;

        const params: IShowDataValidationDropdownParams = {
            unitId: unitId!,
            subUnitId,
            row,
            column: col,
        };

        this._commandService.executeCommand(ShowDataValidationDropdown.id, params);
    }
}
