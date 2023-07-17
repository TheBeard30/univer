import { UniverSheet, Univer, LocaleType } from '@univerjs/core';
import { RenderEngine } from '@univerjs/base-render';
import { SheetPlugin } from '@univerjs/base-sheets';
import { SheetUIPlugin } from '@univerjs/ui-plugin-sheets';
import { DEFAULT_WORKBOOK_DATA_DEMO } from '@univerjs/common-plugin-data';
import { OperationPlugin } from '@univerjs/sheets-plugin-operation';
import { ImportXlsxPlugin } from '@univerjs/sheets-plugin-import-xlsx';
import { OverGridImagePlugin } from '@univerjs/sheets-plugin-image';
import { FindPlugin } from '@univerjs/sheets-plugin-find';
import { DEFAULT_FORMULA_DATA_DEMO, FormulaPlugin } from '@univerjs/sheets-plugin-formula';
import { NumfmtPlugin } from '@univerjs/sheets-plugin-numfmt';

// univer
const univer = new Univer({
    locale: LocaleType.EN,
});

// base-render
univer.installPluginCtor(RenderEngine);

// universheet instance
const universheet = univer.createUniverSheet(DEFAULT_WORKBOOK_DATA_DEMO);

// base-sheet
universheet.installPluginCtor(SheetPlugin);

// ui-plugin-sheets
univer.install(
    new SheetUIPlugin({
        container: 'universheet',
        layout: {
            sheetContainerConfig: {
                infoBar: true,
                formulaBar: true,
                toolbar: true,
                sheetBar: true,
                countBar: true,
                rightMenu: true,
            },
        },
    })
);

FormulaPlugin.create(DEFAULT_FORMULA_DATA_DEMO).installTo(universheet);
FindPlugin.create().installTo(universheet);

universheet.installPluginCtor(OperationPlugin);
universheet.installPluginCtor(ImportXlsxPlugin);
universheet.installPluginCtor(OverGridImagePlugin);
universheet.installPluginCtor(NumfmtPlugin);

// use for console test
declare global {
    interface Window {
        univer?: any;
    }
}

window.univer = univer;