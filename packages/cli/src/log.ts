import { log } from '@linzjs/tracing';

export function setupLogger(cfg: { verbose?: boolean; extraVerbose?: boolean }): typeof log {
  if (cfg.verbose) {
    log.level = 'debug';
  } else if (cfg.extraVerbose) {
    log.level = 'trace';
  } else {
    log.level = 'warn';
  }

  return log;
}

export const logger = log;
