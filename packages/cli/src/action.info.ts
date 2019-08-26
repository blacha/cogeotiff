import { TiffVersion, toByteSizeString } from '@coginfo/core';
import { CommandLineAction, CommandLineStringParameter } from '@microsoft/ts-command-line';
import chalk from 'chalk';
import { ActionUtil, CliResultMap } from './action.util';

export class ActionCogInfo extends CommandLineAction {
    private file: CommandLineStringParameter | null = null;

    public constructor() {
        super({
            actionName: 'info',
            summary: 'Shows info about a COG',
            documentation: '',
        });
    }

    async onExecute(): Promise<void> {
        // abstract
        const { tif } = await ActionUtil.getCogSource(this.file);
        // tif.options.options.clear()
        const [firstImage] = tif.images;

        // return;
        const isCogOptimized = tif.options.isCogOptimized;
        const chunkIds = Object.keys(tif.source.chunks).filter(f => tif.source.chunk(parseInt(f, 10)).isReady());

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
                                if (!i.isTiled()) {
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

        const msg = ActionUtil.formatResult(chalk`{bold COG File Info} - {bold ${tif.source.name}}`, result);
        console.log(msg.join('\n'));
    }

    protected onDefineParameters(): void {
        // abstract
        this.file = this.defineStringParameter({
            argumentName: 'FILE',
            parameterLongName: '--file',
            parameterShortName: '-f',
            description: 'cog file to access',
            required: true,
        });
    }
}
