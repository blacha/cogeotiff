import { CogTiff, TiffMimeType } from '@cogeotiff/core';
import { promises as fs } from 'fs';
import * as path from 'path';
import type pino from 'pino';

const FileExtension: Record<string, string> = {
    [TiffMimeType.Jpeg]: 'jpeg',
    [TiffMimeType.Jp2]: 'jp2',
    [TiffMimeType.Webp]: 'webp',
    [TiffMimeType.Lzw]: 'lzw',
    [TiffMimeType.Deflate]: 'deflate',
    [TiffMimeType.None]: 'bin',
    [TiffMimeType.JpegXl]: 'jpeg',
    [TiffMimeType.Zstd]: 'zstd',
    [TiffMimeType.Lerc]: 'lerc',
    [TiffMimeType.Lzma]: 'lzma',
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
    const fileExt = FileExtension[mimeType] ?? 'unknown';
    return `${xS}_${yS}_${index}.${fileExt}`;
}

export async function writeTile(
    tif: CogTiff,
    x: number,
    y: number,
    index: number,
    outputPath: string,
    logger: pino.Logger,
): Promise<void> {
    const tile = await tif.images[index].getTile(x, y);
    if (tile == null) {
        logger.debug({ index, x, y }, 'TileEmpty');
        return;
    }
    const fileName = getTileName(tile.mimeType, index, x, y);
    await fs.writeFile(path.join(outputPath, fileName), Buffer.from(tile.bytes));
    logger.debug({ index, x, y, fileName, bytes: tile.bytes.byteLength }, 'TileWrite');
}
