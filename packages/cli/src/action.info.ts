import { ChunkSourceBase } from '@chunkd/core';
import { CogTiffImage, TiffTag, TiffTagGeo, TiffVersion } from '@cogeotiff/core';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import c from 'ansi-colors';
import { ActionUtil, CliResultMap } from './action.util.js';
import { CliTable } from './cli.table.js';
import { toByteSizeString } from './util.bytes.js';

function formatTag(tagId: TiffTag | TiffTagGeo, tagName: string, tagValue: any): { key: string; value: string } {
    const key = `${String(tagId).padEnd(7, ' ')} ${String(tagName).padEnd(20)}`;

    if (Array.isArray(tagValue)) {
        return { key, value: tagValue.slice(0, 250).join(', ') };
    }
    return { key, value: String(tagValue).substr(0, 1024) };
}

function round(num: number): number {
    const opt = 10 ** 4;
    return Math.floor(num * opt) / opt;
}

const TiffImageInfoTable = new CliTable<CogTiffImage>();
TiffImageInfoTable.add({ name: 'Id', width: 4, get: (i, index) => String(index) });
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
    get: (i) => `${i.tags.get(TiffTag.StripOffsets)?.dataCount}`,
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
        i.tif.images.forEach((f) => formats.add(f.compression));
        return formats.size > 1;
    },
});

/**
 * Parse out the GDAL Metadata to be more friendly to read
 *
 * TODO using a XML Parser will make this even better
 * @param img
 */
function parseGdalMetadata(img: CogTiffImage): string[] | null {
    const metadata = img.value(TiffTag.GDAL_METADATA);
    if (typeof metadata !== 'string') return null;
    if (!metadata.startsWith('<GDALMetadata>')) return null;
    return metadata
        .replace('<GDALMetadata>', '')
        .replace('</GDALMetadata>', '')
        .split('\n')
        .map((c) => c.trim());
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

        await firstImage.loadGeoTiffTags();

        const isCogOptimized = tif.options.isCogOptimized;
        const source = tif.source as ChunkSourceBase;
        const chunkIds = [...(source.chunks as Map<unknown, unknown>).values()];

        const imageInfo = '\n' + TiffImageInfoTable.print(tif.images, '\t\t').join('\n');

        const gdalMetadata = parseGdalMetadata(firstImage);

        const isGeoLocated = firstImage.isGeoLocated;

        const result: CliResultMap[] = [
            {
                keys: [
                    { key: 'Tiff type', value: `${TiffVersion[tif.version]} (v${String(tif.version)})` },
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
                    isGeoLocated ? { key: 'Origin', value: firstImage.origin.map(round).join(', ') } : null,
                    isGeoLocated ? { key: 'Resolution', value: firstImage.resolution.map(round).join(', ') } : null,
                    isGeoLocated ? { key: 'BoundingBox', value: firstImage.bbox.map(round).join(', ') } : null,
                    firstImage.epsg
                        ? { key: 'EPSG', value: `EPSG:${firstImage.epsg} (https://epsg.io/${firstImage.epsg})` }
                        : null,
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
                    gdalMetadata ? { key: 'Metadata', value: gdalMetadata.map((c) => `\t\t${c}`).join('\n') } : null,
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

        const msg = ActionUtil.formatResult(`${c.bold('COG File Info')} - ${c.bold(tif.source.uri)}`, result);
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
