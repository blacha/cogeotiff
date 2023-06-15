import { fsa } from '@chunkd/fs';
import { CogTiff } from '@cogeotiff/core';
import { log } from '@linzjs/tracing';
import { command, number, option, optional, restPositionals } from 'cmd-ts';
import { promises as fs } from 'node:fs';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import pLimit from 'p-limit';
import { DefaultArgs, Url } from '../common.js';
import { setupLogger, sourceCache } from '../log.js';
import { writeTile } from '../util.tile.js';

// const Rad2Deg = 180 / Math.PI;
// const A = 6378137.0; // 900913 properties.
// function toLatLng(x: number, y: number): [number, number] {
//   return [(x * Rad2Deg) / A, (Math.PI * 0.5 - 2.0 * Math.atan(Math.exp(-y / A))) * Rad2Deg];
// }

const TileQueue = pLimit(1);

export interface GeoJsonPolygon {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: [[[number, number], [number, number], [number, number], [number, number], [number, number]]];
  };
  properties: Record<string, unknown>;
}

// function makePolygon(xMin: number, yMin: number, xMax: number, yMax: number): GeoJsonPolygon {
//   const [lngMin, latMin] = toLatLng(xMin, yMin);
//   const [lngMax, latMax] = toLatLng(xMax, yMax);

//   return {
//     type: 'Feature',
//     properties: {},
//     geometry: {
//       type: 'Polygon',
//       coordinates: [
//         [
//           [lngMin, latMin],
//           [lngMin, latMax],
//           [lngMax, latMax],
//           [lngMax, latMin],
//           [lngMin, latMin],
//         ],
//       ],
//     },
//   };
// }

export const commandDump = command({
  name: 'dump',
  args: {
    ...DefaultArgs,
    path: option({ short: 'f', long: 'file', type: optional(Url) }),
    image: option({ short: 'i', long: 'image', description: 'Image Id to dump (starting from 0)', type: number }),
    output: option({ short: 'o', long: 'output', type: optional(Url) }),
    paths: restPositionals({ type: Url, description: 'Files to process' }),
  },

  async handler(args) {
    const cwd = pathToFileURL(process.cwd() + '/');
    const logger = setupLogger(args);
    for (const path of args.paths) {
      const source = fsa.source(path);
      const tiff = await new CogTiff(source).init();
      const img = tiff.images[args.image];
      if (!img.isTiled()) throw Error(`Tiff: ${path.href} file is not tiled.`);
      const output = new URL(`${basename(path.href)}-i${args.image}/`, args.output ?? cwd);
      await fs.mkdir(output, { recursive: true });

      await dumpTiles(tiff, output, args.image, logger);
      //   await this.dumpIndex(tif, output, index);
      //   await this.dumpBounds(tif, this.output.value, index);
    }

    console.log(sourceCache);
  },
});

async function dumpTiles(tiff: CogTiff, target: URL, index: number, logger: typeof log): Promise<number> {
  const promises: Promise<void>[] = [];
  const img = tiff.images[index];
  if (!img.isTiled()) return 0;

  logger.info('Tiff:Info', { source: tiff.source.url, ...img.tileSize, ...img.tileCount });
  const tileCount = img.tileCount;

  for (let x = 0; x < tileCount.x; x++) {
    for (let y = 0; y < tileCount.y; y++) {
      const promise = TileQueue(() => writeTile(tiff, x, y, index, target, logger));
      promises.push(promise);
    }
  }

  await Promise.all(promises);
  return promises.length;
}
