import { IUniverData } from '../Interfaces/IUniverData';
import { Locale } from '../Shared/Locale';
import { Tools } from '../Shared/Tools';
import { ContextBase } from './ContextBase';

/**
 * univer context
 *
 * @deprecated this should be removed finally
 */
export class Context extends ContextBase {
    protected _locale: Locale;

    private _univerId: string;

    constructor(univerData: Partial<IUniverData> = {}) {
        super();

        this._locale = new Locale();

        // Initialize internationalization
        this._locale.initialize(univerData.locale);

        if (univerData.id == null || univerData.id.length === 0) {
            this._univerId = Tools.generateRandomId(10);
        } else {
            this._univerId = univerData.id;
        }
    }

    getLocale(): Locale {
        return this._locale;
    }

    getUniverId() {
        return this._univerId;
    }

    protected _setObserver(): void {}
}