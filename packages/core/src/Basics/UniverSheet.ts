import { Ctor, Injector, Optional, Disposable } from '@wendellhu/redi';
import { Workbook, ColorBuilder } from '../Sheets/Domain';
import { IWorkbookConfig } from '../Types/Interfaces';
import { BasePlugin, Plugin } from '../Plugin';
import { IOHttp, IOHttpConfig, Logger } from '../Shared';
import { SheetContext } from './SheetContext';
import { VersionCode, VersionEnv } from './Version';

interface IComposedConfig {
    [key: string]: any;

    workbookConfig: IWorkbookConfig;
}

class PluginStore {
    private readonly plugins: Plugin[] = [];

    addPlugin(plugin: Plugin): void {
        this.plugins.push(plugin);
    }

    removePlugins(): Plugin[] {
        const plugins = this.plugins.slice();
        this.plugins.length = 0;
        return plugins;
    }
}

/**
 * Externally provided UniverSheet root instance
 */
export class UniverSheet implements Disposable {
    univerSheetConfig: Partial<IWorkbookConfig>;

    private readonly _sheetInjector: Injector;

    private readonly _pluginStore = new PluginStore();

    private _context: SheetContext;

    constructor(univerSheetData: Partial<IWorkbookConfig> = {}, @Optional(Injector) parentInjector?: Injector) {
        this.univerSheetConfig = univerSheetData;
        this._context = new SheetContext(univerSheetData);
        this._sheetInjector = this.initializeInjector(parentInjector);
    }

    /**
     * get SheetContext
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

    dispose(): void {}

    /**
     * get unit id
     */
    getUnitId(): string {
        return this.getWorkBook().getUnitId();
    }

    /**
     * Add a plugin into UniverSheet. UniverSheet should add dependencies exposed from this plugin to its DI system.
     * @param plugin constructor of the plugin class
     */
    addPlugin(plugin: typeof Plugin, options: any): void {
        const pluginInstance: Plugin = this._sheetInjector.createInstance(plugin as unknown as Ctor<any>, options);
        pluginInstance.onCreate(this._context); // TODO: remove context passed in here
        this._pluginStore.addPlugin(pluginInstance);
    }

    /**
     * install plugin
     *
     * @param plugin - install plugin
     */
    installPlugin(plugin: Plugin): void {
        this._context.getPluginManager().install(plugin);
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

    private initializeInjector(parentInjector?: Injector): Injector {
        return parentInjector ? parentInjector.createChild() : new Injector();
    }
}
