import { subcommands } from 'cmd-ts';

import { commandDump } from './commands/dump.js';
import { commandFetchTile } from './commands/fetch-tile.js';
import { commandInfo } from './commands/info.js';

export const cmd = subcommands({
  name: 'cogeotiff',
  description: 'COG utilities',
  cmds: {
    info: commandInfo,
    dump: commandDump,
    'fetch-tile': commandFetchTile,
  },
});
