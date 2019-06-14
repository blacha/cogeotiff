import chalk from 'chalk';
import { promises as fs } from 'fs';
import { Cli } from "./util/util.cli";
import * as path from 'path';
import { Logger } from './util/util.log';

const helpMessage = chalk`
  {bold USAGE}

      {dim $} {bold cog-dump} [--help] --file {underline COG File} --zoom {underline zoom}

  {bold OPTIONS}
      --zoom                      Zoom level to dump
      --out                       Path to output
`;

const ARGS = {
    '--zoom': Number,
    '--output': String,

    '-z': '--zoom',
    '-o': '--output'
}

function getTileName(zoom: number, x: number, y: number) {
    const xS = `${x}`.padStart(3, '0')
    const yS = `${y}`.padStart(3, '0')
    return `${xS}_${yS}_z${zoom}.webp`
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
    const tileCount = img.tileCount;

    const output = path.join(outputPath, `z${zoom}`);
    Logger.info({ ...img.tileInfo, ...img.tileCount }, 'TileInfo')
    await fs.mkdir(output, { recursive: true });

    for (let x = 0; x < tileCount.nx; x++) {
        for (let y = 0; y < tileCount.ny; y++) {
            const tile = await tif.getTileRaw(x, y, zoom);
            const fileName = getTileName(zoom, x, y)
            fs.writeFile(path.join(output, fileName), tile.bytes)
            Logger.debug({ fileName }, 'WriteFile')
        }
    }
}

run().catch(e => console.error(e));

