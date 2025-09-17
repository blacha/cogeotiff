import { promises as fs } from 'node:fs';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';

import { fsa } from '@chunkd/fs';
import { Tiff, TiffMimeType } from '@cogeotiff/core';
import type { log } from '@linzjs/tracing';
import { command, number, option, optional, restPositionals } from 'cmd-ts';
import pLimit from 'p-limit';

import { DefaultArgs, Url } from '../common.js';
import { ensureS3fs, setupLogger } from '../log.js';
import { getTileName, writeTile } from '../util.tile.js';

const TileQueue = pLimit(5);

export interface GeoJsonPolygon {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: [[[number, number], [number, number], [number, number], [number, number], [number, number]]];
  };
  properties: Record<string, unknown>;
}

function makePolygon(xMin: number, yMin: number, xMax: number, yMax: number): GeoJsonPolygon {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [xMin, yMin],
          [xMin, yMax],
          [xMax, yMax],
          [xMax, yMin],
          [xMin, yMin],
        ],
      ],
    },
  };
}

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
    for (const path of [args.path, ...args.paths]) {
      if (path == null) continue;
      if (path.protocol === 's3:') await ensureS3fs();
      const source = fsa.source(path);
      const tiff = await new Tiff(source).init();
      const img = tiff.images[args.image];
      if (!img.isTiled()) throw Error(`Tiff: ${path.href} file is not tiled.`);
      const output = new URL(`${basename(path.href)}-i${args.image}/`, args.output ?? cwd);
      await fs.mkdir(output, { recursive: true });

      await dumpTiles(tiff, output, args.image, logger);
      await dumpBounds(tiff, output, args.image);
    }
  },
});

async function dumpBounds(tiff: Tiff, target: URL, index: number): Promise<void> {
  const img = tiff.images[index];
  if (!img.isTiled() || !img.isGeoLocated) return;

  const features: GeoJsonPolygon[] = [];
  const featureCollection: Record<string, unknown> = {
    type: 'FeatureCollection',
    features,
  };

  const tileCount = img.tileCount;
  const tileInfo = img.tileSize;
  const tileSize = img.size;

  const firstImage = tiff.images[0];
  if (firstImage.epsg !== 4326) {
    featureCollection['crs'] = {
      type: 'name',
      properties: { name: `epsg:${firstImage.epsg}` },
    };
  }
  firstImage.compression;
  const firstTileSize = firstImage.size;
  const origin = firstImage.origin;
  const resolution = firstImage.resolution;

  const xScale = (resolution[0] * firstTileSize.width) / tileSize.width;
  const yScale = (resolution[1] * firstTileSize.height) / tileSize.height;

  for (let y = 0; y < tileCount.y; y++) {
    const yMax = origin[1] + y * tileInfo.height * yScale;
    const yMin = yMax + tileInfo.height * yScale;
    for (let x = 0; x < tileCount.x; x++) {
      const xMin = origin[0] + x * tileInfo.width * xScale;
      const xMax = xMin + tileInfo.width * xScale;
      const poly = makePolygon(xMin, yMin, xMax, yMax);
      poly.properties = { tile: getTileName(firstImage.compression ?? TiffMimeType.None, index, x, y) };
      features.push(poly);
    }
  }

  await fs.writeFile(new URL(`i${index}.bounds.geojson`, target), JSON.stringify(featureCollection, null, 2));
}

async function dumpTiles(tiff: Tiff, target: URL, index: number, logger: typeof log): Promise<number> {
  const promises: Promise<string | null>[] = [];
  const img = tiff.images[index];
  if (!img.isTiled()) return 0;

  logger.info('Tiff:Info', { source: tiff.source.url, ...img.tileSize, ...img.tileCount });
  const { tileCount, tileSize } = img;

  const html = [
    '<html>',
    '<head>',
    `\t<style>.c { min-width: ${tileSize.width}px; min-height: ${tileSize.height}px; outline: 1px #ff00fff0 }</style>`,
    '</head>',
    '<body>',
  ];

  for (let y = 0; y < tileCount.y; y++) {
    for (let x = 0; x < tileCount.x; x++) {
      const promise = TileQueue(() => writeTile(tiff, x, y, index, target, logger));
      promises.push(promise);
    }
  }

  const result = await Promise.all(promises);
  let i = 0;
  for (let y = 0; y < tileCount.y; y++) {
    html.push('\t<div style="display:flex;">');

    for (let x = 0; x < tileCount.x; x++) {
      const fileName = result[i];
      i++;

      if (fileName == null) {
        html.push(`\t\t<div class="c"></div>`);
        continue;
      }
      html.push(`\t\t<img class="c" src="./${fileName}" >`);
    }
    html.push('\t</div>');
  }

  html.push('</body>');
  html.push('</html>');
  await fs.writeFile(new URL('index.html', target), html.join('\n'));

  return promises.length;
}
