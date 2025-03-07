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

import { Range } from '@univerjs/core';
import type { ICellData, IUnitRangeName, IUniverInstanceService, Nullable } from '@univerjs/core';
import { getCellValueOrigin } from '../utils/get-cell-data-origin';

export function getSheetRangeValueSet(grid: IUnitRangeName, univerInstanceService: IUniverInstanceService, currUnitId: string, currSubUnitId: string) {
    const set = new Set<string>();
    const unitId = grid.unitId || currUnitId;
    const workbook = univerInstanceService.getUniverSheetInstance(unitId) ?? univerInstanceService.getCurrentUniverSheetInstance();
    const worksheet = workbook.getSheetBySheetName(grid.sheetName) ?? workbook.getSheetBySheetId(currSubUnitId) ?? workbook.getActiveSheet();
    Range.foreach(grid.range, (row, col) => {
        const data = worksheet.getCellRaw(row, col);
        if (!data) {
            return;
        }

        const cellValue = getCellValueOrigin(data);

        if (cellValue === undefined || cellValue === null || cellValue === '') {
            return;
        }

        const list = deserializeListOptions(`${cellValue}`);

        list.forEach((item) => {
            if (item) {
                set.add(`${cellValue}`);
            }
        });
    });

    return Array.from(set);
}

export function serializeListOptions(options: string[]) {
    return options.filter(Boolean).join(',');
}

export function deserializeListOptions(optionsStr: string) {
    return optionsStr.split(',').filter(Boolean);
}

export function getDataValidationCellValue(cellData: Nullable<ICellData>) {
    const cellValue = getCellValueOrigin(cellData);
    if (cellValue === undefined || cellValue === null) {
        return '';
    }

    return cellValue.toString();
}
