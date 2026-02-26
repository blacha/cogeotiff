import { Compression } from './tiff.tag.id.js';

/**
 * MimeType conversion for common tif image compresson types
 */
export enum TiffMimeType {
  None = 'application/octet-stream',
  Jbig = 'image/jbig',
  Dcs = 'image/x-kodak-dcs',
  PackBits = 'application/packbits',
  Jpeg = 'image/jpeg',
  Jp2000 = 'image/jp2',
  JpegXl = 'image/jpegxl',
  Webp = 'image/webp',
  Zstd = 'application/zstd',
  Lzw = 'application/lzw',
  Deflate = 'application/deflate',
  Lerc = 'application/lerc',
  Lzma = 'application/x-lzma',
}

export const TiffCompressionMimeType: Record<Compression, TiffMimeType> = {
  [Compression.None]: TiffMimeType.None,
  [Compression.Lzw]: TiffMimeType.Lzw,
  [Compression.Jpeg6]: TiffMimeType.Jpeg,
  [Compression.Jpeg]: TiffMimeType.Jpeg,
  [Compression.DeflateOther]: TiffMimeType.Deflate,
  [Compression.Deflate]: TiffMimeType.Deflate,
  [Compression.Lerc]: TiffMimeType.Lerc,
  [Compression.Lzma]: TiffMimeType.Lzma,
  [Compression.Jp2000]: TiffMimeType.Jp2000,
  [Compression.Zstd]: TiffMimeType.Zstd,
  [Compression.Webp]: TiffMimeType.Webp,
  [Compression.JpegXl]: TiffMimeType.JpegXl,
  [Compression.Ccittrle]: TiffMimeType.None,
  [Compression.CcittT4]: TiffMimeType.None,
  [Compression.CcittT6]: TiffMimeType.None,
  [Compression.T85]: TiffMimeType.Jbig,
  [Compression.T43]: TiffMimeType.Jbig,
  [Compression.Next]: TiffMimeType.None,
  [Compression.Ccittrlew]: TiffMimeType.None,
  [Compression.PackBits]: TiffMimeType.PackBits,
  [Compression.ThunderScan]: TiffMimeType.None,
  [Compression.It8ctpad]: TiffMimeType.None,
  [Compression.It8lw]: TiffMimeType.None,
  [Compression.It8mp]: TiffMimeType.None,
  [Compression.It8bl]: TiffMimeType.None,
  [Compression.PixarFilm]: TiffMimeType.None,
  [Compression.PixarLog]: TiffMimeType.None,
  [Compression.Dcs]: TiffMimeType.Dcs,
  [Compression.Jbig]: TiffMimeType.Jbig,
  [Compression.SgiLog]: TiffMimeType.None,
  [Compression.SgiLog24]: TiffMimeType.None,
  [Compression.JpegXlDng17]: TiffMimeType.JpegXl,
};

/**
 * Lookup the related mimetype for a compression id
 *
 * @param c Compression id
 * @returns mime type for compression
 */
export function getCompressionMimeType(c: Compression | null): TiffMimeType | null {
  if (c == null) return null;
  return TiffCompressionMimeType[c];
}
