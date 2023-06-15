import { subcommands } from 'cmd-ts';
import { commandInfo } from './commands/info.js';
import { commandDump } from './commands/dump.js';

export const cmd = subcommands({
  name: 'cogeotiff',
  description: 'COG utilities',
  cmds: {
    info: commandInfo,
    dump: commandDump,
  },
});
