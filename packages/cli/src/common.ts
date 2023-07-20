import { Type, flag } from 'cmd-ts';
import { pathToFileURL } from 'url';

export const verbose = flag({ long: 'verbose', description: 'Verbose logging', short: 'v' });
export const extraVerbose = flag({ long: 'extra-verbose', description: 'Extra verbose logging', short: 'V' });

export const DefaultArgs = {
  verbose,
  extraVerbose,
};

export const Url: Type<string, URL> = {
  async from(s: string): Promise<URL> {
    try {
      return new URL(s);
    } catch (e) {
      return pathToFileURL(s);
    }
  },
};
