import 'source-map-support/register';

import * as arg from 'arg';
import chalk from 'chalk';
import { CogTif } from "./cog.tif";
import { CogSourceFile } from "./source/cog.source.file";
import { toByteSizeString } from './util/util.bytes';
import { TiffVersion, TiffCompression } from './read/tif';
import { LoggerConfig } from './util/util.log';
import { Log } from 'bblog';

const helpMessage = chalk`
  {bold USAGE}

      {dim $} {bold cog-info} [--help] --file {underline COG File}

  {bold OPTIONS}
      --help                           Shows this help message
      --file {underline COG File}      File to process
      --bs {underline bytes}           Chunk size (KB) default: 64KB
      --v|vv|vvv                       Increase logging verbosity
`;

const args = arg({
    '--help': Boolean,
    '--file': String,
    '--v': Boolean,
    '--vv': Boolean,
    '--vvv': Boolean,
    '--bs': Number,

    '-f': '--file',
    '-h': '--help',
    '-v': '--v'
})

interface ResultMap {
    title?: string;
    keys: { key: string, value: any }[]
}

async function run() {
    if (args['--help']) {
        console.log(helpMessage)
        process.exit(2);
    }

    const fileName = args['--file'];
    if (fileName == null) {
        console.log(helpMessage)
        process.exit(2);
    }

    if (args['--v']) {
        LoggerConfig.level = Log.INFO
    } else if (args['--vv']) {
        LoggerConfig.level = Log.DEBUG
    } else if (args['--vvv']) {
        LoggerConfig.level = Log.TRACE
    } else {
        LoggerConfig.level = Log.ERROR
    }

    const bs = args['--bs']
    const source = new CogSourceFile(fileName);
    source.chunkSize = isNaN(bs) ? 64 * 1024 : bs * 1024;

    const tif = new CogTif(source);

    await tif.init();

    const chunkIds = Object.keys(source._chunks).filter(f => source.chunk(parseInt(f, 10)).isReady)
    const [firstImage] = tif.images;

    const result: ResultMap[] = [{
        keys: [
            { key: 'Tiff type', value: `${TiffVersion[source.version]} (v${String(source.version)})` },
            { key: 'Chunk size', value: toByteSizeString(source.chunkSize) },
            { key: 'Bytes read', value: `${toByteSizeString(chunkIds.length * source.chunkSize)} (${chunkIds.length} Chunk${chunkIds.length === 1 ? '' : 's'})` },
        ]
    }, {
        title: 'Images',
        keys: [
            { key: 'Count', value: tif.images.length },
            { key: 'Compression', value: firstImage.compression },
            { key: 'Origin', value: firstImage.origin },
            { key: 'Sizes', value: tif.images.map(c => `${c.size.width}x${c.size.height}`).join(' ') },
            { key: 'Tiles', value: tif.images.map(c => `${c.tileInfo.width}x${c.tileInfo.height}`).join(' ') },
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

    const msg = [chalk`{bold COG File Info} - {bold ${fileName}}`];
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

