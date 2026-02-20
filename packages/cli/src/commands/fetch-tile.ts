import { fsa } from '@chunkd/fs';
import { TagOffset, Tiff, TiffTag } from '@cogeotiff/core';
import { command, number, option, optional, positional, string } from 'cmd-ts';

import { DefaultArgs, Url } from '../common.js';
import { FetchLog } from '../fs.js';
import { setupLogger } from '../log.js';

export const commandFetchTile = command({
  name: 'fetch-tile',
  args: {
    ...DefaultArgs,
    tile: option({
      short: 't',
      long: 'tile',
      description: 'tile to process "z-x-y" multiple tiles can be fetched by comma separating them "z-x-y,z-x-y"',
      type: string,
      defaultValue: () => '0-0-0',
    }),
    output: option({ short: 'o', long: 'output', type: optional(Url) }),
    readSize: option({
      long: 'read-size',
      description: 'Size of bytes to read for the tile, default is to read the whole tile in KB',
      type: number,
      defaultValue: () => 16,
    }),
    path: positional({ type: Url, description: 'File to process' }),
  },

  async handler(args) {
    const logger = setupLogger(args);
    if (logger.level === 'warn') logger.level = 'info';
    fsa.middleware = [FetchLog]; // reset middleware so we don't cache or chunk requests

    const tiles = args.tile.split(',').map((t) => t.split('-').map((s) => parseInt(s, 10)));
    for (const t of tiles) {
      if (isNaN(t[0]) || isNaN(t[1]) || isNaN(t[2])) {
        logger.error('Invalid tile format, expected {z-x-y}', { tile: args.tile });
        return;
      }
    }

    const tiff = new Tiff(fsa.source(args.path));
    tiff.defaultReadSize = args.readSize * 1024;

    logger.debug('Tiff:load', { path: args.path.href });
    const loadStart = performance.now();
    await tiff.init();
    const loadEnd = performance.now();
    logger.info('Tiff:loaded', {
      path: args.path.href,
      fetches: FetchLog.fetches.length,
      bytesRead: FetchLog.bytesRead,
      duration: loadEnd - loadStart,
    });

    for (const i of tiff.images) {
      const byteCount = i.tags.get(TiffTag.TileByteCounts) as TagOffset | undefined;
      const tileOffsets = i.tags.get(TiffTag.TileOffsets) as TagOffset | undefined;
      logger.debug('Image:TileInfo', {
        image: i.id,
        toLoaded: tileOffsets?.isLoaded,
        bcLoaded: byteCount?.isLoaded,
        bcOffset: byteCount?.dataOffset,
        toOffset: tileOffsets?.dataOffset,
        count: byteCount?.count,
      });
    }

    for (const t of tiles) {
      const [z, x, y] = t;

      if (tiff.images.length < z || z < 0) {
        logger.error('Invalid tile z level', { z, max: tiff.images.length });
        return;
      }

      const image = tiff.images[z];
      const tile = await image.getTile(x, y);
      if (tile == null) {
        logger.error('Failed to fetch tile', { z, x, y });
        return;
      }

      logger.info('Tile:fetched', {
        z,
        x,
        y,
        bytes: tile.bytes.byteLength,
        fetches: FetchLog.fetches.length,
        bytesRead: FetchLog.bytesRead,
      });
    }
  },
});
