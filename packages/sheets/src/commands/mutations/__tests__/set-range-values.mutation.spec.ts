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

import { describe, expect, it } from 'vitest';
import { CellValueType } from '@univerjs/core';
import { checkCellValueType, extractBooleanValue } from '../set-range-values.mutation';

describe('test "SetRangeValuesMutation" ', () => {
    describe('test type related utils', () => {
        it('should be able to get the correct type of cell value from "checkCellValueType"', () => {
            expect(checkCellValueType('string', CellValueType.BOOLEAN)).toBe(CellValueType.STRING);
            expect(checkCellValueType('string', CellValueType.NUMBER)).toBe(CellValueType.STRING);
            expect(checkCellValueType('string', CellValueType.STRING)).toBe(CellValueType.STRING);

            expect(checkCellValueType(123, CellValueType.STRING)).toBe(CellValueType.NUMBER);
            expect(checkCellValueType(123, CellValueType.BOOLEAN)).toBe(CellValueType.NUMBER); // not a valid boolean number, casted to number
            expect(checkCellValueType(123, CellValueType.NUMBER)).toBe(CellValueType.NUMBER);
            expect(checkCellValueType(1, CellValueType.NUMBER)).toBe(CellValueType.NUMBER);
            expect(checkCellValueType(0, CellValueType.NUMBER)).toBe(CellValueType.NUMBER);

            expect(checkCellValueType(1, CellValueType.BOOLEAN)).toBe(CellValueType.BOOLEAN); // it is valid boolean value
            expect(checkCellValueType(0, CellValueType.BOOLEAN)).toBe(CellValueType.BOOLEAN); // it is valid boolean value
        });

        it('should be able to cast values that can be casted to boolean', () => {
            expect(extractBooleanValue(1)).toBe(true);
            expect(extractBooleanValue(0)).toBe(false);
            expect(extractBooleanValue(-123)).toBe(null);
            expect(extractBooleanValue('1')).toBe(true);
            expect(extractBooleanValue('0')).toBe(false);
            expect(extractBooleanValue('89757')).toBe(null);
            expect(extractBooleanValue('true')).toBe(true);
            expect(extractBooleanValue('false')).toBe(false);
            expect(extractBooleanValue('Michael Jackson')).toBe(null);
        });
    });
});
