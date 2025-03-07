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

import type { ICellData, Nullable, Univer } from '@univerjs/core';
import { ICommandService, IUniverInstanceService, ObjectMatrix } from '@univerjs/core';
import { LexerTreeBuilder } from '@univerjs/engine-formula';
import { type ISetRangeValuesMutationParams, SetRangeValuesMutation } from '@univerjs/sheets';
import type { ICellDataWithSpanInfo } from '@univerjs/sheets-ui';
import { COPY_TYPE, ISelectionRenderService, SelectionRenderService } from '@univerjs/sheets-ui';
import type { Injector } from '@wendellhu/redi';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getSetCellFormulaMutations } from '../formula-clipboard.controller';
import { createCommandTestBed } from './create-command-test-bed';

describe('Test paste with formula', () => {
    let univer: Univer;
    let get: Injector['get'];
    let commandService: ICommandService;
    let lexerTreeBuilder: LexerTreeBuilder;
    let getValues: (
        startRow: number,
        startColumn: number,
        endRow: number,
        endColumn: number
    ) => Array<Array<Nullable<ICellData>>> | undefined;

    beforeEach(() => {
        const testBed = createCommandTestBed(undefined, [
            [ISelectionRenderService, { useClass: SelectionRenderService }],
        ]);
        univer = testBed.univer;
        get = testBed.get;
        commandService = get(ICommandService);
        lexerTreeBuilder = get(LexerTreeBuilder);

        getValues = (
            startRow: number,
            startColumn: number,
            endRow: number,
            endColumn: number
        ): Array<Array<Nullable<ICellData>>> | undefined =>
            get(IUniverInstanceService)
                .getUniverSheetInstance('test')
                ?.getSheetBySheetId('sheet1')
                ?.getRange(startRow, startColumn, endRow, endColumn)
                .getValues();
    });

    afterEach(() => {
        univer.dispose();
    });

    describe('correct situations', () => {
        it('Copy two cells, one of which is the formula', async () => {
            const unitId = 'test';
            const subUnitId = 'sheet1';
            const range = {
                startRow: 12,
                startColumn: 2,
                endRow: 12,
                endColumn: 3,
                rangeType: 0,
            };
            const matrix = new ObjectMatrix<ICellDataWithSpanInfo>({
                0: {
                    0: {
                        v: 3,
                    },
                    1: {
                        v: 2,
                        f: '=SUM(A1)',
                        si: '3e4r5t',
                    },
                },
            });

            const accessor = {
                get,
            };

            const copyInfo = {
                copyRange: {
                    startRow: 0,
                    startColumn: 2,
                    endRow: 0,
                    endColumn: 3,
                    rangeType: 0,
                },
                copyType: COPY_TYPE.COPY,
            };

            const result = {
                undos: [
                    {
                        id: SetRangeValuesMutation.id,
                        params: {
                            unitId,
                            subUnitId,
                            cellValue: {
                                12: {
                                    2: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    3: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                },
                            },
                            options: {},
                        },
                    },
                ],
                redos: [
                    {
                        id: SetRangeValuesMutation.id,
                        params: {
                            unitId,
                            subUnitId,
                            cellValue: {
                                12: {
                                    2: {},
                                    3: {
                                        f: null,
                                        si: '3e4r5t',
                                        v: null,
                                        p: null,
                                    },
                                },
                            },
                        },
                    },
                ],
            };

            const redoUndoList = getSetCellFormulaMutations(
                unitId,
                subUnitId,
                range,
                matrix,
                accessor,
                copyInfo,
                lexerTreeBuilder
            );

            expect(redoUndoList).toStrictEqual(result);
        });

        it('Copy range with formulas', async () => {
            const unitId = 'test';
            const subUnitId = 'sheet1';
            const range = {
                startRow: 5,
                startColumn: 5,
                endRow: 8,
                endColumn: 8,
                rangeType: 0,
            };
            const matrix = new ObjectMatrix<ICellDataWithSpanInfo>({
                0: {
                    0: {
                        p: null,
                        v: 1,
                        s: null,
                        f: '=SUM(A1)',
                        si: null,
                        t: 2,
                    },
                    1: {
                        p: null,
                        v: 2,
                        s: null,
                        f: '=SUM(B1)',
                        si: 'OENnXU',
                        t: 2,
                    },
                    2: {
                        p: null,
                        v: 3,
                        s: null,
                        f: null,
                        si: 'OENnXU',
                        t: 2,
                    },
                    3: {
                        p: null,
                        v: 4,
                        s: null,
                        f: null,
                        si: 'OENnXU',
                        t: 2,
                    },
                },
                1: {
                    0: {
                        p: null,
                        v: 2,
                        s: null,
                        f: '=SUM(A2)',
                        si: 'jcozeE',
                        t: 2,
                    },
                    1: {
                        p: null,
                        v: 3,
                        s: null,
                        f: null,
                        si: 'OENnXU',
                        t: 2,
                    },
                    2: {
                        p: null,
                        v: 4,
                        s: null,
                        f: null,
                        si: 'OENnXU',
                        t: 2,
                    },
                    3: {
                        p: null,
                        v: 5,
                        s: null,
                        f: null,
                        si: 'OENnXU',
                        t: 2,
                    },
                },
                2: {
                    0: {
                        p: null,
                        v: 3,
                        s: null,
                        f: null,
                        si: 'jcozeE',
                        t: 2,
                    },
                    1: {
                        p: null,
                        v: 4,
                        s: null,
                        f: null,
                        si: 'OENnXU',
                        t: 2,
                    },
                    2: {
                        p: null,
                        v: 5,
                        s: null,
                        f: null,
                        si: 'OENnXU',
                        t: 2,
                    },
                    3: {
                        p: null,
                        v: 6,
                        s: null,
                        f: null,
                        si: 'OENnXU',
                        t: 2,
                    },
                },
                3: {
                    0: {
                        p: null,
                        v: 4,
                        s: null,
                        f: null,
                        si: 'jcozeE',
                        t: 2,
                    },
                    1: {
                        p: null,
                        v: 5,
                        s: null,
                        f: null,
                        si: 'OENnXU',
                        t: 2,
                    },
                    2: {
                        p: null,
                        v: 6,
                        s: null,
                        f: null,
                        si: 'OENnXU',
                        t: 2,
                    },
                    3: {
                        p: null,
                        v: 7,
                        s: null,
                        f: null,
                        si: 'OENnXU',
                        t: 2,
                    },
                },
            });

            const accessor = {
                get,
            };

            const copyInfo = {
                copyType: COPY_TYPE.COPY,
                copyRange: {
                    startRow: 0,
                    startColumn: 5,
                    endRow: 3,
                    endColumn: 8,
                    rangeType: 0,
                },
            };

            const result = {
                undos: [
                    {
                        id: 'sheet.mutation.set-range-values',
                        params: {
                            unitId,
                            subUnitId,
                            cellValue: {
                                5: {
                                    5: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    6: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    7: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    8: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                },
                                6: {
                                    5: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    6: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    7: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    8: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                },
                                7: {
                                    5: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    6: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    7: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    8: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                },
                                8: {
                                    5: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    6: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    7: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                    8: {
                                        s: null,
                                        f: null,
                                        si: null,
                                        p: null,
                                        v: null,
                                        t: null,
                                    },
                                },
                            },
                            options: {},
                        },
                    },
                ],
                redos: [
                    {
                        id: 'sheet.mutation.set-range-values',
                        params: {
                            unitId,
                            subUnitId,
                            cellValue: {
                                5: {
                                    5: {
                                        si: 'bBSIMi',
                                        f: '=SUM(A6)',
                                        v: null,
                                        p: null,
                                    },
                                    6: {
                                        si: 'OENnXU',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                    7: {
                                        si: 'OENnXU',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                    8: {
                                        si: 'OENnXU',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                },
                                6: {
                                    5: {
                                        si: 'jcozeE',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                    6: {
                                        si: 'OENnXU',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                    7: {
                                        si: 'OENnXU',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                    8: {
                                        si: 'OENnXU',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                },
                                7: {
                                    5: {
                                        si: 'jcozeE',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                    6: {
                                        si: 'OENnXU',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                    7: {
                                        si: 'OENnXU',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                    8: {
                                        si: 'OENnXU',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                },
                                8: {
                                    5: {
                                        si: 'jcozeE',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                    6: {
                                        si: 'OENnXU',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                    7: {
                                        si: 'OENnXU',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                    8: {
                                        si: 'OENnXU',
                                        f: null,
                                        v: null,
                                        p: null,
                                    },
                                },
                            },
                        },
                    },
                ],
            };

            const redoUndoList = getSetCellFormulaMutations(
                unitId,
                subUnitId,
                range,
                matrix,
                accessor,
                copyInfo,
                lexerTreeBuilder
            );

            // Randomly generated id, no comparison is made
            const resultFormulaId = result.redos[0].params.cellValue['5'][5].si;
            const originRedoParams = redoUndoList.redos[0].params as ISetRangeValuesMutationParams;

            if (!originRedoParams.cellValue || !originRedoParams.cellValue['5'] || !originRedoParams.cellValue['5'][5]) {
                throw new Error('cellValue is undefined');
            }

            originRedoParams.cellValue['5'][5].si = resultFormulaId;

            expect(redoUndoList).toStrictEqual(result);
        });
    });
});
