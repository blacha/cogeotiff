import chalk from 'chalk';
import { promises as fs } from 'fs';
import { Cli, CliResultMap } from "./util/util.cli";
import * as path from 'path';
import { Logger } from './util/util.log';
import { toByteSizeString } from './util/util.bytes';
import { TiffVersion } from './read/tif';
import { CogTif } from './cog.tif';

const helpMessage = chalk`
  {bold USAGE}

      {dim $} {bold cog-dump} [--help] --file {underline COG File} --zoom {underline zoom} --html

  {bold OPTIONS}
      --zoom                      Zoom level to dump
      --output                    Path to output
      --html                      Create a index.html
`;

const ARGS = {
    '--zoom': Number,
    '--output': String,
    '--html': Boolean,

    '-z': '--zoom',
    '-o': '--output'
}

function getTileName(zoom: number, x: number, y: number) {
    const xS = `${x}`.padStart(3, '0')
    const yS = `${y}`.padStart(3, '0')
    return `${xS}_${yS}_z${zoom}.webp`
}
async function writeTile(tif: CogTif, x: number, y: number, zoom: number, output: string) {
    const tile = await tif.getTileRaw(x, y, zoom);
    const fileName = getTileName(zoom, x, y)
    fs.writeFile(path.join(output, fileName), tile.bytes)
    Logger.debug({ fileName }, 'WriteFile')
}

async function run() {
    const { tif, args } = await Cli.process(ARGS, helpMessage);
    const zoom = args['--zoom'];
    if (zoom == null) {
        throw Cli.fail(helpMessage, 'Missing zoom\n');
    }
    const outputPath = args['--output']
    if (outputPath == null) {
        throw Cli.fail(helpMessage, 'Missing output\n');
    }

    const img = tif.getImage(zoom)
    if (img == null) {
        throw Cli.fail(helpMessage, `Zoom too high max:  ${tif.images.length - 1}\n`)
    }
    const tileCount = img.tileCount;

    const output = path.join(outputPath, `z${zoom}`);
    Logger.info({ ...img.tileInfo, ...img.tileCount }, 'TileInfo')
    await fs.mkdir(output, { recursive: true });

    const promises: Promise<any>[] = [];
    let outputCount = 0;
    for (let x = 0; x < tileCount.nx; x++) {
        for (let y = 0; y < tileCount.ny; y++) {
            promises.push(writeTile(tif, x, y, zoom, output))
            outputCount++;
        }
    }

    await Promise.all(promises);

    // This is really nasty but it works!
    if (args['--html']) {
        Logger.info('CreateHtml')

        const html = ['<html>'];
        for (let y = 0; y < tileCount.ny; y++) {
            html.push('\t<div style="display:flex;">')

            for (let x = 0; x < tileCount.nx; x++) {
                html.push(`\t\t<img src="./${getTileName(zoom, x, y)}" >`)
            }

            html.push('\t</div>')
        }
        html.push('</html>')

        await fs.writeFile(path.join(output, 'index.html'), html.join('\n'));
    }

    const chunkIds = Object.keys(tif.source._chunks).filter(f => tif.source.chunk(parseInt(f, 10)).isReady)
    const result: CliResultMap[] = [{
        keys: [
            { key: 'Tiff type', value: `${TiffVersion[tif.source.version]} (v${String(tif.source.version)})` },
            { key: 'Chunk size', value: toByteSizeString(tif.source.chunkSize) },
            { key: 'Bytes read', value: `${toByteSizeString(chunkIds.length * tif.source.chunkSize)} (${chunkIds.length} Chunk${chunkIds.length === 1 ? '' : 's'})` },
        ]
    }, {
        title: 'Output',
        keys: [
            { key: 'Images', value: outputCount },
            args['--html'] ? { key: 'Path', value: path.join(output, 'index.html') } : null
        ]
    }]

    const msg = Cli.formatResult(chalk`{bold COG dumped} - {bold ${tif.source.name}}`, result);
    console.log(msg.join('\n'))
}

run().catch(e => console.error(e));

