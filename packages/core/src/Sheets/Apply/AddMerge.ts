import { Merge } from '../Domain/Merge';
import { IRangeData } from '../../Types/Interfaces';
import { CommandModel } from '../../Command';
import { IAddMergeActionData } from '../../Types/Interfaces/IActionModel';

/**
 *
 * @param merges
 * @param rectangles
 * @returns
 *
 * @internal
 */
export function addMerge(merges: Merge, rectangles: IRangeData[]): IRangeData[] {
    let remove: IRangeData[] = [];
    for (let i = 0; i < rectangles.length; i++) {
        merges.add(rectangles[i]);
        // remove = remove.concat(merges.add(rectangles[i]));
    }
    return remove;
}

export function addMergeApply(unit: CommandModel, data: IAddMergeActionData): IRangeData[] {
    let worksheet = unit?.WorkBookUnit?.getSheetBySheetId(data.sheetId);
    if (worksheet) {
        let config = worksheet.getConfig();
        let mergeConfigData = config.mergeData;
        let mergeAppendData = data.rectangles;
        for (let i = 0; i < mergeAppendData.length; i++) {
            mergeConfigData.push(mergeAppendData[i]);
        }
        return mergeAppendData;
    }
    return [];
}
