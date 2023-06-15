// Ensure connection reuse is enabled
process.env['AWS_NODEJS_CONNECTION_REUSE_ENABLED'] = '1';

import { run } from 'cmd-ts';
import { cmd } from './index.js';
import { logger } from './log.js';

run(cmd, process.argv.slice(2)).catch((err) => {
  logger.fatal('Command:Failed', { err });
  logger.pino.flush();
  // Give the log some time to flush before exiting
  setTimeout(() => process.exit(1), 25);
});
