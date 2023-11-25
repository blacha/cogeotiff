import { SourceCache, SourceChunk } from '@chunkd/middleware';
import { SourceCallback, SourceMiddleware, SourceRequest, SourceView } from '@chunkd/source';
import { SourceHttp } from '@chunkd/source-http';
import { CogTiff } from '@cogeotiff/core';

import { loadSingleTile } from './example.single.tile';

// Cache all requests to cogs
const cache = new SourceCache({ size: 16 * 1024 * 1024 }); // 16MB Cache
const chunk = new SourceChunk({ size: 16 * 1024 }); // Chunk requests into 16KB fetches
const fetchLog: SourceMiddleware = {
  name: 'fetch:log',
  fetch(req: SourceRequest, next: SourceCallback) {
    this.fetches.push(req);
    this.bytesRead += req.length ?? 0;
    console.log('Tiff:fetch', { href: req.source.url.href, offset: req.offset, length: req.length });
    return next(req);
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  const tiffSource = new SourceView(new SourceHttp('https://blayne.chard.com/world.webp.google.cog.tiff'), [
    chunk,
    cache,
    fetchLog,
  ]);
  const tiff = await CogTiff.create(tiffSource);

  const mainEl = document.createElement('div');
  console.log('Loaded: ', tiff.source.url, '\nImages:', tiff.images.length);
  document.body.appendChild(mainEl);

  const nodes = await Promise.all([loadSingleTile(tiff)]);
  for (const n of nodes) mainEl.appendChild(n);
});
