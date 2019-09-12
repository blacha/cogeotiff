import { CogLogger, CogTiff, TileUtil } from '@cogeotiff/core';
import { promises as fs } from 'fs';
import * as path from 'path';

export async function writeTile(
    tif: CogTiff,
    x: number,
    y: number,
    zoom: number,
    outputPath: string,
    logger: CogLogger,
) {
    const tile = await tif.getTileRaw(x, y, zoom);
    if (tile == null) {
        logger.error('Unable to write file, missing data..');
        return;
    }
    const fileName = TileUtil.name(tile.mimeType, zoom, x, y);
    await fs.writeFile(path.join(outputPath, fileName), tile.bytes);
    logger.debug({ fileName }, 'WriteFile');
}
