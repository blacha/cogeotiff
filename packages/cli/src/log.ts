import { S3Client } from '@aws-sdk/client-s3';
import { fsa, FsHttp } from '@chunkd/fs';
import { FsAwsS3 } from '@chunkd/fs-aws';
import { SourceCache, SourceChunk } from '@chunkd/view';
// import { FsHttp } from '@chunkd/fs-http';
import { log } from '@linzjs/tracing';
import { FetchLog } from './fs.js';

// Cache the last 10MB of chunks for reuse
export const sourceCache = new SourceCache({ size: 10 * 1024 * 1024 });

export function setupLogger(cfg: { verbose?: boolean; extraVerbose?: boolean }): typeof log {
  if (cfg.verbose) {
    log.level = 'debug';
  } else if (cfg.extraVerbose) {
    log.level = 'trace';
  } else {
    log.level = 'warn';
  }

  fsa.register('s3://', new FsAwsS3(new S3Client({}) as any));
  fsa.register('http://', new FsHttp());
  fsa.register('https://', new FsHttp());

  // Chunk all requests into 32KB chunks
  fsa.sources.use(new SourceChunk({ size: 64 * 1024, splitRequests: true }));
  // Cache the last 10MB of chunks for reuse
  fsa.sources.use(sourceCache);

  fsa.sources.use(FetchLog);

  return log;
}

export const logger = log;
