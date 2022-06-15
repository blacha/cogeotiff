import { SourceMemory } from '@chunkd/core';
import { readFile } from 'fs/promises';
import { CogTiff } from '../cog.tiff.js';

/** Read a tile from every image inside of a tiff 300 tiles read */
async function main(): Promise<void> {
    const buf = await readFile(process.argv[process.argv.length - 1]);
    const source = new SourceMemory('buf', buf);
    for (let i = 0; i < 5_000; i++) {
        const tiff = new CogTiff(source);
        await tiff.init();

        // 6 images
        for (const img of tiff.images) await img.getTile(0, 0);
        await tiff.close();
    }
}

main();
