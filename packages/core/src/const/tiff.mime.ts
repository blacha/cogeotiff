/**
 * MimeType conversion for common tif image types
 */
export enum TiffMimeType {
  None = 'application/octet-stream',
  Jpeg = 'image/jpeg',
  Jp2 = 'image/jp2',
  JpegXl = 'image/jpegxl',
  Webp = 'image/webp',
  Zstd = 'application/zstd',
  Lzw = 'application/lzw',
  Deflate = 'application/deflate',
  Lerc = 'application/lerc',
  Lzma = 'application/x-lzma',
}

export const TiffCompression: { [key: number]: TiffMimeType } = {
  1: TiffMimeType.None,
  5: TiffMimeType.Lzw,
  6: TiffMimeType.Jpeg,
  7: TiffMimeType.Jpeg,
  8: TiffMimeType.Deflate,
  34887: TiffMimeType.Lerc,
  34925: TiffMimeType.Lzma,
  34712: TiffMimeType.Jp2,
  50000: TiffMimeType.Zstd,
  50001: TiffMimeType.Webp,
  50002: TiffMimeType.JpegXl,
};
