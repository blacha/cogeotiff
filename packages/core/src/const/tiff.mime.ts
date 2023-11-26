import { Compression } from './tiff.tag.id.js';

/**
 * MimeType conversion for common tif image compresson types
 */
export enum TiffMimeType {
  None = 'application/octet-stream',
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

export const TiffCompression: Record<Compression, TiffMimeType> = {
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
};
