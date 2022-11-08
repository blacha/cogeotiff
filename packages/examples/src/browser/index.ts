import { SourceHttp } from '@chunkd/source-http';
import { CogTiff } from '@cogeotiff/core';
import { loadSingleTile } from './example.single.tile';

// Trace all fetch requests
SourceHttp.fetch = async (input, init): Promise<Response> => {
    const startTime = performance.now();
    const res = await fetch(input, init);
    const duration = performance.now() - startTime;
    console.log(`Fetch: ${input} status: ${res.status} duration: ${Number(duration.toFixed(4))}ms`);
    return res;
};

document.addEventListener('DOMContentLoaded', async () => {
    const tiffSource = new SourceHttp('https://blayne.chard.com/world.webp.google.cog.tiff');
    const tiff = await CogTiff.create(tiffSource);

    const mainEl = document.createElement('div');
    console.log('Loaded: ', tiff.source.uri, '\nImages:', tiff.images.length);
    document.body.appendChild(mainEl);

    const nodes = await Promise.all([loadSingleTile(tiff)]);
    for (const n of nodes) mainEl.appendChild(n);
});
