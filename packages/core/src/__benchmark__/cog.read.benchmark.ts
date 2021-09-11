import { CogTiff } from '../cog.tiff.js';
import { SourceFile } from '@chunkd/source-file';

/** Read a tile from every image inside of a tiff 300 tiles read */
async function main(): Promise<void> {
    for (let i = 0; i < 50; i++) {
        const tiff = new CogTiff(new SourceFile(process.argv[process.argv.length - 1]));
        await tiff.init();

        // 6 images
        for (const img of tiff.images) await img.getTile(0, 0);
        await tiff.close();
    }
}

main();
