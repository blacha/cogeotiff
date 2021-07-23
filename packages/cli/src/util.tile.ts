import { LogType } from '@chunkd/core';
import { CogTiff, TiffMimeType } from '@cogeotiff/core';
import { promises as fs } from 'fs';
import * as path from 'path';

const FileExtension: { [key: string]: string } = {
    [TiffMimeType.JPEG]: 'jpeg',
    [TiffMimeType.JP2]: 'jp2',
    [TiffMimeType.WEBP]: 'webp',
    [TiffMimeType.LZW]: 'lzw',
    [TiffMimeType.DEFLATE]: 'deflate',
};

/**
 * Get a human readable tile name
 *
 * @param mimeType image type of tile @see FileExtension
 * @param index Image index
 * @param x Tile X
 * @param y Tile Y
 *
 * @returns tile name eg `001_002_12.png`
 */
export function getTileName(mimeType: string, index: number, x: number, y: number): string {
    const xS = `${x}`.padStart(3, '0');
    const yS = `${y}`.padStart(3, '0');

    const fileExt: string = FileExtension[mimeType];
    if (fileExt == null) {
        throw new Error(`Unable to process tile type:${mimeType}`);
    }

    return `${xS}_${yS}_${index}.${fileExt}`;
}

export async function writeTile(
    tif: CogTiff,
    x: number,
    y: number,
    index: number,
    outputPath: string,
    logger: LogType,
): Promise<void> {
    const tile = await tif.getTile(x, y, index);
    if (tile == null) {
        logger.debug({ index, x, y }, 'TileEmpty');
        return;
    }
    const fileName = getTileName(tile.mimeType, index, x, y);
    await fs.writeFile(path.join(outputPath, fileName), tile.bytes);
    logger.debug({ index, x, y, fileName, bytes: tile.bytes.length }, 'TileWrite');
}
