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

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ICommand, IRange, IWorkbookData, Nullable } from '@univerjs/core';
import { ICommandService, ILogService, IUniverInstanceService, LocaleType, LogLevel, Plugin, PluginType, Univer } from '@univerjs/core';
import type { Dependency } from '@wendellhu/redi';
import { Inject, Injector } from '@wendellhu/redi';

import { RefRangeService } from '../ref-range.service';
import { SelectionManagerService } from '../../selection-manager.service';
import { InsertColMutation } from '../../../commands/mutations/insert-row-col.mutation';
import type { IInsertColMutationParams } from '../../../basics';
import { SheetInterceptorService } from '../../sheet-interceptor/sheet-interceptor.service';

const TEST_WORKBOOK_DATA: IWorkbookData = {
    id: 'test',
    appVersion: '3.0.0-alpha',
    sheets: {
        sheet1: {
            id: 'sheet1',
            cellData: {
                0: {
                    0: {
                        v: 'A1',
                    },
                    1: {
                        v: 'A2',
                    },
                },
            },
            rowCount: 10,
            columnCount: 10,
        },
        sheet2: {
            id: 'sheet2',
        },
    },
    locale: LocaleType.ZH_CN,
    name: '',
    sheetOrder: [],
    styles: {},
};

export function createRefRangeTestBed() {
    const univer = new Univer();
    const injector = univer.__getInjector();
    const get = injector.get.bind(injector);

    class TestPlugin extends Plugin {
        static override type = PluginType.Sheet;

        constructor(
            _config: undefined,
            @Inject(Injector) override readonly _injector: Injector
        ) {
            super('test-plugin');
        }
    }

    ([
        [RefRangeService],
        [SelectionManagerService],
        [SheetInterceptorService],
    ] as Dependency[]).forEach((d) => injector.add(d));

    const commandService = get(ICommandService);

    ([
        InsertColMutation,
    ] as ICommand[]).forEach((command) => commandService.registerCommand(command));

    univer.registerPlugin(TestPlugin);
    const sheet = univer.createUniverSheet(TEST_WORKBOOK_DATA);

    const univerInstanceService = get(IUniverInstanceService);
    univerInstanceService.focusUniverInstance('test');

    const logService = get(ILogService);
    logService.setLogLevel(LogLevel.SILENT);

    return {
        univer,
        get,
        sheet,
    };
}

describe('test "RefRangeService"', () => {
    let univer: Univer;
    let refRangeService: RefRangeService;
    let commandService: ICommandService;

    describe('test "watchRange"', () => {
        beforeEach(() => {
            const bed = createRefRangeTestBed();

            univer = bed.univer;
            refRangeService = bed.get(RefRangeService);
            commandService = bed.get(ICommandService);
        });

        afterEach(() => {
            univer.dispose();
        });

        it('should emit updated range when a mutation happens', () => {
            let beforeRange: Nullable<IRange> = null;
            let afterRange: Nullable<IRange> = null;

            const watchedRange: IRange = { startRow: 0, startColumn: 1, endColumn: 3, endRow: 0 };
            refRangeService.watchRange('test', 'sheet1', watchedRange, (before, after) => {
                beforeRange = before;
                afterRange = after;
            });

            expect(commandService.syncExecuteCommand(InsertColMutation.id, {
                unitId: 'test',
                subUnitId: 'sheet1',
                range: { startRow: 0, endRow: 9, startColumn: 2, endColumn: 2 },
            } as IInsertColMutationParams)).toBeTruthy();
            expect(beforeRange).toEqual(watchedRange);
            expect(afterRange).toEqual({ startRow: 0, startColumn: 1, endColumn: 4, endRow: 0 });
        });

        it('should not emit when mutation not related to the watched range', () => {
            let beforeRange: Nullable<IRange> = null;
            let afterRange: Nullable<IRange> = null;

            const watchedRange: IRange = { startRow: 0, startColumn: 1, endColumn: 3, endRow: 0 };
            refRangeService.watchRange('test', 'sheet1', watchedRange, (before, after) => {
                beforeRange = before;
                afterRange = after;
            });

            // On another sheet.
            expect(commandService.syncExecuteCommand(InsertColMutation.id, {
                unitId: 'test',
                subUnitId: 'sheet2',
                range: { startRow: 0, endRow: 9, startColumn: 2, endColumn: 2 },
            } as IInsertColMutationParams)).toBeTruthy();
            expect(beforeRange).toBeNull();
            expect(afterRange).toBeNull();

            // On a not relevant range.
            expect(commandService.syncExecuteCommand(InsertColMutation.id, {
                unitId: 'test',
                subUnitId: 'sheet1',
                range: { startRow: 0, endRow: 9, startColumn: 5, endColumn: 5 },
            } as IInsertColMutationParams)).toBeTruthy();
            expect(beforeRange).toBeNull();
            expect(afterRange).toBeNull();
        });
    });
});
