import { TiffMimeType } from '../const/tiff.mime';

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
 * @param zoom Zoom level
 * @param x Tile X
 * @param y Tile Y
 *
 * @returns tile name eg `001_002_z12.png`
 */
function getTileName(mimeType: string, zoom: number, x: number, y: number) {
    const xS = `${x}`.padStart(3, '0');
    const yS = `${y}`.padStart(3, '0');

    const fileExt: string = FileExtension[mimeType];
    if (fileExt == null) {
        throw new Error(`Unable to process tile type:${mimeType}`);
    }

    return `${xS}_${yS}_z${zoom}.${fileExt}`;
}

export const TileUtil = {
    name: getTileName,
};
