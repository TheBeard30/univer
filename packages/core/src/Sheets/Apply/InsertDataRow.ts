import { ICellData } from '../../Types/Interfaces';
import { ObjectMatrix, ObjectMatrixPrimitiveType } from '../../Shared/ObjectMatrix';
import { CommandModel } from '../../Command';
import { IInsertRowDataActionData } from '../../Types/Interfaces/IActionModel';

/**
 *
 * @param rowIndex
 * @param addData
 * @param cellData
 *
 * @internal
 */
export function InsertDataRow(rowIndex: number, rowData: ObjectMatrixPrimitiveType<ICellData>, primitiveData: ObjectMatrixPrimitiveType<ICellData>) {
    const wrapper = new ObjectMatrix(primitiveData);
    wrapper.insertRows(rowIndex, new ObjectMatrix(rowData));
}

export function InsertDataRowApply(unit: CommandModel, data: IInsertRowDataActionData) {
    const worksheet = unit.WorkBookUnit!.getSheetBySheetId(data.sheetId);
    const primitiveData = worksheet!.getCellMatrix().toJSON();

    const wrapper = new ObjectMatrix(primitiveData);
    wrapper.insertRows(data.rowIndex, new ObjectMatrix(data.rowData));
}
