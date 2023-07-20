import { SetHideRow, SetShowRow } from '../Apply';
import { SheetActionBase } from '../../Command/SheetActionBase';
import { ActionObservers, ActionType, CommandModel } from '../../Command';
import { ISetRowShowActionData } from '../../Types/Interfaces/IActionModel';

/**
 * @internal
 */
export class SetRowShowAction extends SheetActionBase<ISetRowShowActionData> {
    constructor(actionData: ISetRowShowActionData, commandModel: CommandModel, observers: ActionObservers) {
        super(actionData, commandModel, observers);
        this._doActionData = {
            ...actionData,
        };
        this.do();
        this._oldActionData = {
            ...actionData,
        };
        this.validate();
    }

    do(): void {
        const worksheet = this.getWorkSheet();

        SetShowRow(this._doActionData.rowIndex, this._doActionData.rowCount, worksheet.getRowManager());

        this._observers.notifyObservers({
            type: ActionType.REDO,
            data: this._doActionData,
            action: this,
        });
    }

    redo(): void {
        this.do();
    }

    undo(): void {
        const worksheet = this.getWorkSheet();

        SetHideRow(this._oldActionData.rowIndex, this._oldActionData.rowCount, worksheet.getRowManager());

        this._observers.notifyObservers({
            type: ActionType.UNDO,
            data: this._oldActionData,
            action: this,
        });
    }

    validate(): boolean {
        return false;
    }
}
