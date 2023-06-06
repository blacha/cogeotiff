import pino from 'pino';
import { PrettyTransform } from 'pretty-json-log';

export const logger = process.stdout.isTTY ? pino.default(PrettyTransform.stream()) : pino.default();

export function setupLogger(cfg: { verbose?: boolean; extraVerbose?: boolean }): typeof logger {
  if (cfg.verbose) {
    logger.level = 'debug';
  } else if (cfg.extraVerbose) {
    logger.level = 'trace';
  } else {
    logger.level = 'warn';
  }

  return logger;
}
