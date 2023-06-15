import { FsHttp, fsa } from '@chunkd/fs';
// import '@chunkd/fs-aws';
import { SourceCache, SourceChunk } from '@chunkd/view';
import { log } from '@linzjs/tracing';
import { FetchLog } from './fs.js';
// import { S3Client } from '@aws-sdk/client-s3';

// Cache the last 10MB of chunks for reuse
export const sourceCache = new SourceCache({ size: 10 * 1024 * 1024 });
export const sourceChunk = new SourceChunk({ size: 32 * 1024, splitRequests: true });

export function setupLogger(cfg: { verbose?: boolean; extraVerbose?: boolean }): typeof log {
  if (cfg.verbose) {
    log.level = 'debug';
  } else if (cfg.extraVerbose) {
    log.level = 'trace';
  } else {
    log.level = 'warn';
  }

  // new S3Client({});
  // FIXME loading AWS SDK adds 300ms to the cli time
  // fsa.register('s3://', new FsAwsS3(new S3Client({}) as any));
  fsa.register('http://', new FsHttp());
  fsa.register('https://', new FsHttp());

  // Chunk all requests into 32KB chunks
  fsa.sources.use(sourceChunk);
  // Cache the last 10MB of chunks for reuse
  fsa.sources.use(sourceCache);

  fsa.sources.use(FetchLog);

  return log;
}

export const logger = log;
