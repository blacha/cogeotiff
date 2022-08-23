/**
 * MimeType conversion for common tif image types
 */
export enum TiffMimeType {
    NONE = 'application/octet-stream',
    JPEG = 'image/jpeg',
    JP2 = 'image/jp2',
    JPEGXL = 'image/jpegxl',
    WEBP = 'image/webp',
    ZSTD = 'application/zstd',
    LZW = 'application/lzw',
    DEFLATE = 'application/deflate',
    LZERC = 'application/lerc',
    LZMA = 'application/x-lzma',
}

export const TiffCompression: { [key: number]: TiffMimeType } = {
    1: TiffMimeType.NONE,
    5: TiffMimeType.LZW,
    6: TiffMimeType.JPEG,
    7: TiffMimeType.JPEG,
    8: TiffMimeType.DEFLATE,
    34887: TiffMimeType.LZERC,
    34925: TiffMimeType.LZMA,
    34712: TiffMimeType.JP2,
    50000: TiffMimeType.ZSTD,
    50001: TiffMimeType.WEBP,
    50002: TiffMimeType.JPEGXL,
};
