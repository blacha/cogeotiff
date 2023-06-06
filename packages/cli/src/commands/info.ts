import { Type, command, flag, option, optional, restPositionals } from 'cmd-ts';
import { fileURLToPath, pathToFileURL } from 'url';
import { DefaultArgs } from '../common.js';
import { setupLogger } from '../log.js';
import { fsa } from '@chunkd/fs';
import { CogTiff, TiffTag, TiffVersion } from '@cogeotiff/core';
import { toByteSizeString } from '../util.bytes.js';
import { CogTiffImage } from '@cogeotiff/core/src/cog.tiff.image.js';
import { CliTable } from '../cli.table.js';

const Url: Type<string, URL> = {
  async from(s: string): Promise<URL> {
    try {
      return new URL(s);
    } catch (e) {
      return pathToFileURL(s);
    }
  },
};
function urlToString(u: URL): string {
  if (u.protocol === 'file:') return fileURLToPath(u);
  return u.href;
}

function round(num: number): number {
  const opt = 10 ** 4;
  return Math.floor(num * opt) / opt;
}

export const commandInfo = command({
  name: 'info',
  args: {
    ...DefaultArgs,
    json: flag({ long: 'json', description: 'Output result as NDJSON' }),
    path: option({ short: 'f', long: '--file', type: optional(Url) }),
    paths: restPositionals({ type: Url, description: 'Files to process' }),
  },
  async handler(args) {
    const logger = setupLogger(args);
    console.log(args);
    const paths = [...args.paths, args.path].filter((f) => f != null) as URL[];

    for (const path of paths) {
      logger.debug({ path: path?.href }, 'Tiff:load');

      const source = fsa.source(urlToString(path));

      let bytesRead = 0;
      const fetches = [];
      const oldFetch = source.fetchBytes;
      source.fetchBytes = (offset, length): Promise<ArrayBuffer> => {
        fetches.push({ offset, length });
        bytesRead += length ?? 0;
        logger.debug({ href: path.href, offset: offset, length: length }, 'Tiff:fetch');
        return oldFetch.apply(source, [offset, length]);
      };
      const tiff = new CogTiff(source);
      await tiff.init();

      const header = [
        { key: 'Tiff type', value: `${TiffVersion[tiff.version]} (v${String(tiff.version)})` },
        {
          key: 'Bytes read',
          value: `${toByteSizeString(bytesRead)} (${fetches.length} Chunk${fetches.length === 1 ? '' : 's'})`,
        },
      ];

      const firstImage = tiff.images[0];
      const isGeoLocated = firstImage.isGeoLocated;
      const images = [
        { key: 'Compression', value: firstImage.compression },
        isGeoLocated ? { key: 'Origin', value: firstImage.origin.map(round).join(', ') } : null,
        isGeoLocated ? { key: 'Resolution', value: firstImage.resolution.map(round).join(', ') } : null,
        isGeoLocated ? { key: 'BoundingBox', value: firstImage.bbox.map(round).join(', ') } : null,
        firstImage.epsg ? { key: 'EPSG', value: `EPSG:${firstImage.epsg} (https://epsg.io/${firstImage.epsg})` } : null,
        { key: 'Info', value: TiffImageInfoTable.print(tiff.images, '\t\t').join('\n') },
      ];

      console.log(header, images);
      // const { tif } = await ActionUtil.getCogSource(path);

      // const [firstImage] = tif.images;
    }
  },
});

const TiffImageInfoTable = new CliTable<CogTiffImage>();
TiffImageInfoTable.add({ name: 'Id', width: 4, get: (_i, index) => String(index) });
TiffImageInfoTable.add({ name: 'Size', width: 20, get: (i) => `${i.size.width}x${i.size.height}` });
TiffImageInfoTable.add({
  name: 'Tile Size',
  width: 20,
  get: (i) => `${i.tileCount.x}x${i.tileCount.y}`,
  enabled: (i) => i.isTiled(),
});
TiffImageInfoTable.add({
  name: 'Tile Count',
  width: 20,
  get: (i) => `${i.tileCount.x * i.tileCount.y}`,
  enabled: (i) => i.isTiled(),
});
TiffImageInfoTable.add({
  name: 'Strip Count',
  width: 20,
  get: (i) => `${i.tags.get(TiffTag.StripOffsets)?.count}`,
  enabled: (i) => !i.isTiled(),
});
TiffImageInfoTable.add({
  name: 'Resolution',
  width: 20,
  get: (i) => `${round(i.resolution[0])}`,
  enabled: (i) => i.isGeoLocated,
});

// Show compression only if it varies between images
TiffImageInfoTable.add({
  name: 'Compression',
  width: 20,
  get: (i) => i.compression,
  enabled: (i) => {
    const formats = new Set();
    i.tiff.images.forEach((f) => formats.add(f.compression));
    return formats.size > 1;
  },
});
