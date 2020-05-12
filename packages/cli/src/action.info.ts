import { TiffTag, TiffTagGeo, TiffVersion } from '@cogeotiff/core';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import * as c from 'ansi-colors';
import { ActionUtil, CliResultMap } from './action.util';
import { toByteSizeString } from './util.bytes';

function formatTag(tagId: TiffTag | TiffTagGeo, tagName: string, tagValue: any) {
    const key = `${String(tagId).padEnd(7, ' ')} ${String(tagName).padEnd(20)}`;

    if (Array.isArray(tagValue)) {
        return { key, value: tagValue.slice(0, 250).join(', ') };
    }
    return { key, value: String(tagValue).substr(0, 1024) };
}

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
        const chunkIds = Object.keys(tif.source.chunks).filter((f) => tif.source.chunk(parseInt(f, 10)).isReady());

        const imageInfoHeader =
            '\n\t\t' + ['Id'.padEnd(4), 'Size'.padEnd(20), 'Tile Size'.padEnd(20), 'Tile Count'].join('\t') + '\n';
        const imageInfo =
            imageInfoHeader +
            tif.images
                .map((i, index) => {
                    if (!i.isTiled()) {
                        return '';
                    }
                    const tc = i.tileCount;

                    const imageId = `${index}`.padEnd(4);
                    const imageSize = `${i.size.width}x${i.size.height}`.padEnd(20);
                    const tileSize = `${tc.x}x${tc.y}`.padEnd(20);
                    const tileCount = `${tc.x * tc.y}`;

                    return '\t\t' + [imageId, imageSize, tileSize, tileCount].join('\t');
                })
                .join('\n');

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
                    { key: 'Compression', value: firstImage.compression },
                    { key: 'Origin', value: firstImage.origin },
                    { key: 'Resolution', value: firstImage.resolution },
                    { key: 'BoundingBox', value: firstImage.bbox },
                    { key: 'Info', value: imageInfo },
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
                    keys: tiffTags.map((tagId) => formatTag(tagId, TiffTag[tagId], img.value(tagId))),
                });
                await img.loadGeoTiffTags();
                if (img.tagsGeo) {
                    const tiffTagsGeo = [...img.tagsGeo.keys()];
                    result.push({
                        title: `Image: ${img.id} - Geo Tiff tags`,
                        keys: tiffTagsGeo.map((tagId) => formatTag(tagId, TiffTagGeo[tagId], img.valueGeo(tagId))),
                    });
                }
                if (!this.tagsAll?.value) {
                    break;
                }
            }
        }

        const msg = ActionUtil.formatResult(`${c.bold('COG File Info')} - ${c.bold(tif.source.name)}`, result);
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
