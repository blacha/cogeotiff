import chalk from 'chalk';
import { TiffVersion } from './read/tif';
import { toByteSizeString } from './util/util.bytes';
import { Cli, CliResultMap } from './cli/cli';

const helpMessage = chalk`
  {bold USAGE}

      {dim $} {bold cog-info} [--help] --file {underline COG File}

  {bold OPTIONS}
`;

async function run() {
    const { tif } = await Cli.process({}, helpMessage);

    const chunkIds = Object.keys(tif.source._chunks).filter(f => tif.source.chunk(parseInt(f, 10)).isReady());
    const [firstImage] = tif.images;

    const isCogOptimized = tif.options.isCogOptimized;
    const result: CliResultMap[] = [
        {
            keys: [
                { key: 'Tiff type', value: `${TiffVersion[tif.source.version]} (v${String(tif.source.version)})` },
                { key: 'Chunk size', value: toByteSizeString(tif.source.chunkSize) },
                {
                    key: 'Bytes read',
                    value: `${toByteSizeString(chunkIds.length * tif.source.chunkSize)} (${chunkIds.length} Chunk${
                        chunkIds.length === 1 ? '' : 's'
                    })`,
                },
            ],
        },
        {
            title: 'Images',
            keys: [
                { key: 'Count', value: tif.images.length },
                { key: 'Compression', value: firstImage.compression },
                { key: 'Origin', value: firstImage.origin },
                { key: 'Resolution', value: firstImage.resolution },
                { key: 'BoundingBox', value: firstImage.bbox },
                { key: 'Sizes', value: tif.images.map(c => `${c.size.width}x${c.size.height}`).join(' ') },
                {
                    key: 'Tiles',
                    value: tif.images
                        .map(i => {
                            if (i.tileInfo == null) {
                                return '';
                            }
                            return `${i.tileInfo.width}x${i.tileInfo.height} (${i.tileCount.total})`;
                        })
                        .join(' '),
                },
            ],
        },
        {
            title: 'GDAL',
            keys: [
                { key: 'COG optimized', value: tif.options.isCogOptimized },
                tif.options.isBroken ? { key: 'COG broken', value: tif.options.isBroken } : null,
                isCogOptimized ? { key: 'Tile order', value: tif.options.tileOrder } : null,
                isCogOptimized
                    ? {
                          key: 'Tile leader',
                          value: `${tif.options.tileLeader} - ${tif.options.tileLeaderByteSize} Bytes`,
                      }
                    : null,
                isCogOptimized ? { key: 'Mask interleaved', value: tif.options.isMaskInterleaved } : null,
            ],
        },
    ];

    const msg = Cli.formatResult(chalk`{bold COG File Info} - {bold ${tif.source.name}}`, result);
    console.log(msg.join('\n'));
}

run().catch(e => console.error(e));
