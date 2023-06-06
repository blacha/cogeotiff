import { flag } from 'cmd-ts';

export const verbose = flag({ long: 'verbose', description: 'Verbose logging', short: 'v' });
export const extraVerbose = flag({ long: 'extra-verbose', description: 'Extra verbose logging', short: 'V' });

export const DefaultArgs = {
  verbose,
  extraVerbose,
};
