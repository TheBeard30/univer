import { Class, Nullable } from '../Shared';
import { IActionData, ActionType, ActionBase, CommandInjector, CommandManager, ActionOperation, CommonParameter } from './index';
import { DocumentModel } from '../Docs/Domain/DocumentModel';
import { SpreadsheetsModel } from '../Sheets/Model/SpreadsheetsModel';

export class CommandModel {
    SpreadsheetsModel?: SpreadsheetsModel;

    DocumentModel?: DocumentModel;
}

/**
 * Execute the undo-redo command
 *
 */
export class Command {
    actionDataList: IActionData[];

    actionList: Array<ActionBase<IActionData>>;

    commandModel: CommandModel;

    private _commonParameter = new CommonParameter();

    constructor(commandModel: CommandModel, ...list: IActionData[]) {
        this.commandModel = commandModel;
        this.actionList = [];
        this.actionDataList = list;
    }

    redo(): void {
        this.actionList.forEach((action) => {
            if (ActionOperation.hasUndo(action.getDoActionData())) {
                action.redo(this._commonParameter.reset());
            }
        });
        CommandManager.getCommandObservers().notifyObservers({
            type: ActionType.REDO,
            actions: this.actionList,
        });
    }

    undo(): void {
        // Reverse is required, such as moving C:E to the back of column A, after copying the data of C:E
        // 1. removeColumn C:E 2.insertColumnData A,
        // when undo, it should be
        // 1. removeColumn A, 2. insertColumnData C:E
        this.actionList.forEach((action) => {
            if (ActionOperation.hasUndo(action.getOldActionData())) {
                action.undo(this._commonParameter.reset());
            }
        });
        CommandManager.getCommandObservers().notifyObservers({
            type: ActionType.UNDO,
            actions: this.actionList,
        });
    }

    invoke(): void {
        this.actionDataList.forEach((data) => {
            const ActionClass = CommandManager.getAction(data.actionName);
            if (!ActionClass) return;
            const observers = CommandManager.getActionObservers();
            const action = new ActionClass(data, this.commandModel, observers, this._commonParameter.reset());
            this.actionList.push(action);
        });

        CommandManager.getCommandInjectorObservers().notifyObservers(this.getInjector());
        CommandManager.getCommandObservers().notifyObservers({
            type: ActionType.REDO,
            actions: this.actionList,
        });
    }

    getOldData(): IActionData[] {
        return this.actionList.map((action) => action.getOldActionData());
    }

    getDoData(): IActionData[] {
        return this.actionList.map((action) => action.getDoActionData());
    }

    getInjector(): CommandInjector {
        const commandThis = this;
        return new (class implements CommandInjector {
            injectAction(action: ActionBase<IActionData, IActionData, void>): void {
                commandThis.actionList.push(action);
            }

            getActions(): Array<ActionBase<IActionData>> {
                return commandThis.actionList.concat([]);
            }

            include<T>(action: Class<T>): Nullable<T> {
                for (let i = 0; i < commandThis.actionList.length; i++) {
                    if (commandThis.actionList[i] instanceof action) {
                        return commandThis.actionList[i] as unknown as Nullable<T>;
                    }
                }
                return null;
            }
        })();
    }
}
