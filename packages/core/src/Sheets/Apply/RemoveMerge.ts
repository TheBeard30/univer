import { IRangeData } from '../../Types/Interfaces';
import { CommandModel } from '../../Command';
import { Rectangle } from '../../Shared';
import { IRemoveMergeActionData } from '../../Types/Interfaces/IActionModel';

export function RemoveMergeApply(unit: CommandModel, data: IRemoveMergeActionData): IRangeData[] {
    let worksheet = unit.WorkBookUnit!.getSheetBySheetId(data.sheetId);
    if (worksheet) {
        let config = worksheet.getConfig();
        let remove: IRangeData[] = [];
        let mergeConfigData = config.mergeData;
        let mergeRemoveData = data.rectangles;
        for (let j = 0; j < mergeRemoveData.length; j++) {
            for (let i = mergeConfigData.length - 1; i >= 0; i--) {
                let configMerge = mergeConfigData[i];
                let removeMerge = mergeRemoveData[j];
                if (Rectangle.intersects(configMerge, removeMerge)) {
                    remove.push(mergeConfigData.splice(i, 1)[0]);
                }
            }
        }
        return remove;
    }
    return [];
}
