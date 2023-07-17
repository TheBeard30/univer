import { Workbook, ColorBuilder, Worksheet } from '../Sheets/Domain';
import { IWorkbookConfig } from '../Interfaces';
import { BasePlugin, Plugin } from '../Plugin';
import { IOHttp, IOHttpConfig, Logger } from '../Shared';
import { SheetContext } from './SheetContext';
import { VersionCode, VersionEnv } from './Version';
import { Dependency, Injector, Inject, Ctor } from '../DI';

interface IComposedConfig {
    [key: string]: any;

    workbookConfig: IWorkbookConfig;
}

/**
 * Externally provided UniverSheet root instance
 */
export class UniverSheet {
    private readonly _sheetInjector: Injector;

    univerSheetConfig: Partial<IWorkbookConfig>;

    /** @deprecated */
    private _context: SheetContext;

    constructor(
        univerSheetData: Partial<IWorkbookConfig> = {},
        @Inject(Injector) parentInjector?: Injector,
    ) {
        this.univerSheetConfig = univerSheetData;
        this._context = new SheetContext(univerSheetData);

        this._sheetInjector = this.initInjector(parentInjector);
    }

    /**
     * get SheetContext
     *
     * @deprecated
     */
    get context() {
        return this._context;
    }

    static newInstance(univerSheetData: Partial<IWorkbookConfig> = {}): UniverSheet {
        Logger.capsule(VersionEnv, VersionCode, 'powered by :: universheet :: ');
        return new UniverSheet(univerSheetData);
    }

    /**
     *
     * Request data
     *
     * @example
     * Get data for all tables, including core and plugin data
     *
     * @param config
     */
    static get<T = void>(config: Omit<IOHttpConfig, 'type'>): Promise<T> {
        return IOHttp({ ...config, type: 'GET' });
    }

    /**
     * Submit data
     * @param config
     */
    static post<T = void>(config: Omit<IOHttpConfig, 'type'>): Promise<T> {
        return IOHttp({ ...config, type: 'POST' });
    }

    /**
     * Load data
     *
     * @example
     * UniverSheet.get gets all the core and plug-in data, UniverSheet.load(univerSheetInstance,data) internally calls the load API of each plug-in to centrally load the core and plug-in data
     *
     * @param sheet
     * @param data
     */
    static load<T extends IComposedConfig>(sheet: UniverSheet, data: T) {
        sheet.getWorkBook().load(data.workbookConfig);
        sheet.context
            .getPluginManager()
            .getPlugins()
            .forEach((plugin: BasePlugin) => {
                plugin.load(data[`${plugin.getPluginName()}Config`]);
            });
    }

    static newColor(): ColorBuilder {
        return new ColorBuilder();
    }

    /**
     * Save data
     *
     * @example
     * get all the core and plug-in data
     *
     * @param univerSheet
     */
    static toJson(univerSheet: UniverSheet): IComposedConfig {
        const workbookConfig = univerSheet.getWorkBook().save();
        const pluginConfig: Partial<IComposedConfig> = {};
        univerSheet.context
            .getPluginManager()
            .getPlugins()
            .forEach((plugin: BasePlugin) => {
                pluginConfig[`${plugin.getPluginName()}Config`] = plugin.save();
            });

        return { workbookConfig, ...pluginConfig };
    }

    /**
     * get unit id
     */
    getUnitId(): string {
        return this.getWorkBook().getUnitId();
    }

    /**
     * install plugin
     *
     * @param plugin - install plugin
     * @deprecated use `installPluginCtor` instead
     */
    installPlugin(plugin: Plugin): void {
        this._context.getPluginManager().install(plugin);
    }

    installPluginCtor<T>(pluginCtor: Ctor<T>): T {
        const plugin = this._sheetInjector.createInstance(pluginCtor);

        this._context.getPluginManager().install(plugin); // this line would be removed in the future

        // TODO: we should provide a register method such as `registerPlugin` because users have to manually decide instantiation process using this API
        this._sheetInjector.add(pluginCtor, plugin);

        return plugin;
    }

    /**
     * uninstall plugin
     *
     * @param name - plugin name
     */
    uninstallPlugin(name: string): void {
        this._context.getPluginManager().uninstall(name);
    }

    /**
     * get WorkBook
     *
     * @returns Workbook
     */
    getWorkBook(): Workbook {
        return this._context.getWorkBook();
    }

    refreshWorkbook(univerSheetData: Partial<IWorkbookConfig> = {}) {
        this._context.refreshWorkbook(univerSheetData);
    }

    /**
     * Create worksheet level injector
     */
    private initInjector(parentInjector?: Injector): Injector {
        const univerSheetDependencies: Dependency[] = [
            [WorkbookManager, { useFactory: () => new WorkbookManager(this._context.getWorkBook()) }],
        ];

        return parentInjector?.createChild(univerSheetDependencies) || new Injector(univerSheetDependencies);
    }
}

/**
 * Get current workbook and others
 */
export class WorkbookManager {
    constructor(private readonly _workbook: Workbook) {

    }

    getWorkbook(): Workbook {
        return this._workbook;
    }

    getActiveWorksheet(): Worksheet {
        return this._workbook.getActiveSheet();
    }
}