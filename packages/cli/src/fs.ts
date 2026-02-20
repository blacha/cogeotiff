import type { SourceCallback, SourceMiddleware, SourceRequest } from '@chunkd/source';

import { logger } from './log.js';

export const FetchLog: SourceMiddleware & { reset(): void; fetches: SourceRequest[]; bytesRead: number } = {
  name: 'source:log',
  fetch(req: SourceRequest, next: SourceCallback) {
    this.fetches.push(req);
    this.bytesRead += req.length ?? 0;
    logger.debug('Tiff:fetch', { href: req.source.url.href, offset: req.offset, length: req.length });
    return next(req);
  },
  reset() {
    this.fetches = [];
    this.bytesRead = 0;
  },
  fetches: [],
  bytesRead: 0,
};
