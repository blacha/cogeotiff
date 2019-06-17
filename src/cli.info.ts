import 'source-map-support/register';

import chalk from 'chalk';
import { TiffVersion } from './read/tif';
import { toByteSizeString } from './util/util.bytes';
import { Cli } from './util/util.cli';

const helpMessage = chalk`
  {bold USAGE}

      {dim $} {bold cog-info} [--help] --file {underline COG File}

  {bold OPTIONS}
`;

interface ResultMap {
    title?: string;
    keys: { key: string, value: any }[]
}

async function run() {
    const { tif, args } = await Cli.process({}, helpMessage);

    const chunkIds = Object.keys(tif.source._chunks).filter(f => tif.source.chunk(parseInt(f, 10)).isReady)
    const [firstImage] = tif.images;

    const result: ResultMap[] = [{
        keys: [
            { key: 'Tiff type', value: `${TiffVersion[tif.source.version]} (v${String(tif.source.version)})` },
            { key: 'Chunk size', value: toByteSizeString(tif.source.chunkSize) },
            { key: 'Bytes read', value: `${toByteSizeString(chunkIds.length * tif.source.chunkSize)} (${chunkIds.length} Chunk${chunkIds.length === 1 ? '' : 's'})` },
        ]
    }, {
        title: 'Images',
        keys: [
            { key: 'Count', value: tif.images.length },
            { key: 'Compression', value: firstImage.compression },
            { key: 'Origin', value: firstImage.origin },
            { key: 'Resolution', value: firstImage.resolution },
            { key: 'BoundingBox', value: firstImage.bbox },
            { key: 'Sizes', value: tif.images.map(c => `${c.size.width}x${c.size.height}`).join(' ') },
            { key: 'Tiles', value: tif.images.map(c => `${c.tileInfo.width}x${c.tileInfo.height} (${c.tileCount.total})`).join(' ') },
        ]
    }, {
        title: 'GDAL',
        keys: [
            { key: 'COG optimized', value: tif.options.isCogOptimized },
            { key: 'COG broken', value: tif.options.isBroken },
            { key: 'Tile order', value: tif.options.tileOrder },
            { key: 'Tile leader', value: `${tif.options.tileLeader} - ${tif.options.tileLeaderByteSize} Bytes` },
            { key: 'Mask interleaved', value: tif.options.isMaskInterleaved },
        ]
    }]

    const msg = [chalk`{bold COG File Info} - {bold ${args['--file']}}`];
    for (const group of result) {
        msg.push('');
        if (group.title) {
            msg.push(chalk`  {bold ${group.title}}`)
        }
        for (const { key, value } of group.keys) {
            if (value == null || (typeof value === 'string' && value.trim() === '')) {
                continue;
            }
            msg.push(chalk`    ${key.padEnd(14, ' ')}  ${value}`)
        }
    }

    console.log(msg.join('\n'))
}

run().catch(e => console.error(e));

