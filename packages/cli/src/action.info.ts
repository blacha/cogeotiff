import { TiffVersion, TiffTag } from '@cogeotiff/core';
import { CommandLineAction, CommandLineStringParameter, CommandLineFlagParameter } from '@microsoft/ts-command-line';
import * as chalk from 'chalk';
import { ActionUtil, CliResultMap } from './action.util';
import { toByteSizeString } from './util.bytes';

export class ActionCogInfo extends CommandLineAction {
    private file?: CommandLineStringParameter;
    private tags?: CommandLineFlagParameter;
    private tagsAll?: CommandLineFlagParameter;

    public constructor() {
        super({
            actionName: 'info',
            summary: 'Shows info about a COG',
            documentation: '',
        });
    }

    async onExecute(): Promise<void> {
        const { tif } = await ActionUtil.getCogSource(this.file);
        const [firstImage] = tif.images;

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
                                const tc = i.tileCount;
                                return `${tc.x}x${tc.y} (${tc.x * tc.y})`;
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

        if (this.tags?.value || this.tagsAll?.value) {
            for (const img of tif.images) {
                const tiffTags = [...img.tags.keys()];
                result.push({
                    title: `Image: ${img.id} - Tiff tags`,
                    keys: [
                        ...tiffTags.map(tagId => {
                            const key = `${String(tagId).padEnd(7, ' ')} ${TiffTag[tagId].padEnd(20)}`;
                            const value = img.value(tagId);
                            if (Array.isArray(value)) {
                                return { key, value: value.slice(0, 250).join(', ') };
                            }
                            return { key, value: String(value).substr(0, 1024) };
                        }),
                    ],
                });
                if (!this.tagsAll?.value) {
                    break;
                }
            }
        }

        const msg = ActionUtil.formatResult(chalk`{bold COG File Info} - {bold ${tif.source.name}}`, result);
        console.log(msg.join('\n'));
    }

    protected onDefineParameters(): void {
        this.file = this.defineStringParameter({
            argumentName: 'FILE',
            parameterLongName: '--file',
            parameterShortName: '-f',
            description: 'cog file to access',
            required: true,
        });

        this.tags = this.defineFlagParameter({
            parameterLongName: '--tags',
            parameterShortName: '-t',
            description: 'Dump tiff tags',
            required: false,
        });

        this.tagsAll = this.defineFlagParameter({
            parameterLongName: '--tags-all',
            parameterShortName: '-T',
            description: 'Dump tiff tags for all images',
            required: false,
        });
    }
}
