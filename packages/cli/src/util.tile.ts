import { CogTiff, TiffMimeType } from '@cogeotiff/core';
import { log } from '@linzjs/tracing';
import { promises as fs } from 'node:fs';

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
  tiff: CogTiff,
  x: number,
  y: number,
  index: number,
  outputPath: URL,
  logger: typeof log,
): Promise<void> {
  const tile = await tiff.images[index].getTile(x, y);
  console.log(tile, x, y);
  if (tile == null) {
    logger.debug('Tile:Empty', { source: tiff.source.url.href, index, x, y });
    return;
  }
  const fileName = getTileName(tile.mimeType, index, x, y);
  await fs.writeFile(new URL(fileName, outputPath), Buffer.from(tile.bytes));
  logger.debug('Tile:Write', { source: tiff.source.url.href, index, x, y, fileName, bytes: tile.bytes.byteLength });
}
