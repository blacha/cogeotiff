import { SourceHttp } from '@chunkd/source-http';
import { CogTiff } from '../index.js';

async function main(): Promise<void> {
  const source = new SourceHttp('https://example.com/cog.tif');
  const tiff = await CogTiff.create(source);

  /** Load a specific tile from a specific image */
  const tile = await tiff.images[5].getTile(2, 2);
  if (tile != null) {
    tile.bytes; // Raw image buffer or null if tile doesn't exist
  }

  /** Load the 5th image in the Tiff */
  const img = tiff.images[5];
  if (img.isTiled()) {
    /** Load tile x:10 y:10 */
    const tile = await img.getTile(10, 10);
    if (tile != null) {
      tile.mimeType; // image/jpeg
      tile.bytes; // Raw image buffer
    }
  }

  /** Get the origin point of the tiff */
  img.origin;
  /** Bounding box of the tiff */
  img.bbox;
}

main();
