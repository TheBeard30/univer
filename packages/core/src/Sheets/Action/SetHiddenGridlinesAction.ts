import { SetHiddenGridlinesApply } from '../Apply';
import { SheetActionBase } from '../../Command/SheetActionBase';
import { ActionObservers, ActionType, CommandModel } from '../../Command';
import { ISetHiddenGridlinesActionData } from '../../Types/Interfaces/IActionModel';

/**
 * @internal
 */
export class SetHiddenGridlinesAction extends SheetActionBase<ISetHiddenGridlinesActionData> {
    constructor(actionData: ISetHiddenGridlinesActionData, commandModel: CommandModel, observers: ActionObservers) {
        super(actionData, commandModel, observers);
        this._doActionData = {
            ...actionData,
        };

        this._oldActionData = {
            ...actionData,
            hideGridlines: this.do(),
        };
        this.validate();
    }

    do(): boolean {
        const result = SetHiddenGridlinesApply(this.getSpreadsheetModel(), this._doActionData);
        this._observers.notifyObservers({
            type: ActionType.REDO,
            data: this._doActionData,
            action: this,
        });
        return result;
    }

    redo(): void {
        this.do();
    }

    undo(): void {
        SetHiddenGridlinesApply(this.getSpreadsheetModel(), this._oldActionData);
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
