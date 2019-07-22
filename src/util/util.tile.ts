import { promises as fs } from 'fs';
import * as path from 'path';
import { MimeType } from '../read/tif';
import { CogTif } from '../cog.tif';
import { Logger } from './util.log';

const FileExtension: { [key: string]: string } = {
    [MimeType.JPEG]: 'jpeg',
    [MimeType.JP2]: 'jp2',
    [MimeType.WEBP]: 'webp',
};

function getTileName(mimeType: string, zoom: number, x: number, y: number) {
    const xS = `${x}`.padStart(3, '0');
    const yS = `${y}`.padStart(3, '0');

    const fileExt: string = FileExtension[mimeType];
    if (fileExt == null) {
        throw new Error(`Unable to process tile type:${mimeType}`);
    }

    return `${xS}_${yS}_z${zoom}.${fileExt}`;
}

async function writeTile(tif: CogTif, x: number, y: number, zoom: number, outputPath: string) {
    const tile = await tif.getTileRaw(x, y, zoom);
    if (tile == null) {
        Logger.error('Unable to write file, missing data..');
        return;
    }
    const fileName = getTileName(tile.mimeType, zoom, x, y);
    fs.writeFile(path.join(outputPath, fileName), tile.bytes);
    Logger.debug({ fileName }, 'WriteFile');
}

export const TileUtil = {
    name: getTileName,
    write: writeTile,
};
