import { readFile } from 'fs/promises';

import { Tiff } from '../tiff.js';
import { TiffTag } from '../index.js';
import { SourceMemory } from './source.memory.js';

// console.log = console.trace;
/** Read a tile from every image inside of a tiff 300 tiles read */
async function main(): Promise<void> {
  const buf = await readFile(process.argv[process.argv.length - 1]);
  const source = new SourceMemory(buf);
  for (let i = 0; i < 5_000; i++) {
    performance.mark('cog:init');
    const tiff = new Tiff(source);
    await tiff.init();
    performance.mark('cog:init:done');

    // 6 images
    for (const img of tiff.images) await img.getTile(0, 0);

    // Force loading all the byte arrays in which benchmarks the bulk array loading
    await tiff.images[0].fetch(TiffTag.TileByteCounts);
    await tiff.images[0].fetch(TiffTag.TileOffsets);
  }
}

main();
