import { readFile } from 'fs/promises';

import { TiffTag } from '../index.js';
import { Tiff } from '../tiff.js';
import { SourceMemory } from './source.memory.js';

Tiff.DefaultReadSize = 64 * 1024
// console.log = console.trace;
/** Read a tile from every image inside of a tiff 300 tiles read */
async function main(): Promise<void> {
  const buf = await readFile(process.argv[process.argv.length - 1]);
  const source = new SourceMemory(buf);
  for (let i = 0; i < 5_000; i++) {
    performance.mark('tiff:init');
    const tiff = new Tiff(source);
    await tiff.init();
    performance.mark('tiff:init:done');

    // 6 images
    for (const img of tiff.images) await img.getTile(0, 0);

    const img = tiff.images[0];
    // Force loading all the byte arrays in which benchmarks the bulk array loading
    await img.fetch(TiffTag.TileByteCounts);
    await img.fetch(TiffTag.TileOffsets);
  }
}

void main();
