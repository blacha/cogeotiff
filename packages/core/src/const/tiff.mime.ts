/**
 * MimeType conversion for common tif image types
 */
export enum TiffMimeType {
    NONE = 'application/octet-stream',
    JPEG = 'image/jpeg',
    JP2 = 'image/jp2',
    WEBP = 'image/webp',
    LZW = 'application/lzw',
    DEFLATE = 'application/deflate',
}

export const TiffCompression: { [key: number]: TiffMimeType } = {
    1: TiffMimeType.NONE,
    5: TiffMimeType.LZW,
    6: TiffMimeType.JPEG,
    7: TiffMimeType.JPEG,
    8: TiffMimeType.DEFLATE,
    34712: TiffMimeType.JP2,
    50001: TiffMimeType.WEBP,
};
