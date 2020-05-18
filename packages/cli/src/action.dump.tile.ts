import { CogLogger, CogTiff, TiffVersion } from '@cogeotiff/core';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import * as c from 'ansi-colors';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ActionUtil, CliResultMap } from './action.util';
import { CliLogger } from './cli.log';
import { toByteSizeString } from './util.bytes';
import { getTileName, writeTile } from './util.tile';
import PLimit from 'p-limit';

const Rad2Deg = 180 / Math.PI;
const A = 6378137.0; // 900913 properties.
function toLatLng(x: number, y: number) {
    return [(x * Rad2Deg) / A, (Math.PI * 0.5 - 2.0 * Math.atan(Math.exp(-y / A))) * Rad2Deg];
}

const TileQueue = PLimit(25);

export interface GeoJsonPolygon {
    type: 'Feature';
    geometry: {
        type: 'Polygon';
        coordinates: [[[number, number], [number, number], [number, number], [number, number], [number, number]]];
    };
    properties: {};
}

function makePolygon(xMin: number, yMin: number, xMax: number, yMax: number): GeoJsonPolygon {
    const [lngMin, latMin] = toLatLng(xMin, yMin);
    const [lngMax, latMax] = toLatLng(xMax, yMax);

    return {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [lngMin, latMin],
                    [lngMin, latMax],
                    [lngMax, latMax],
                    [lngMax, latMin],
                    [lngMin, latMin],
                ],
            ],
        },
    };
}

export class ActionDumpTile extends CommandLineAction {
    private file: CommandLineStringParameter | null = null;
    private imageIndex: CommandLineIntegerParameter | null = null;
    private output: CommandLineStringParameter | null = null;
    private outputCount = 0;
    private logger: CogLogger;

    public constructor() {
        super({
            actionName: 'dump',
            summary: 'Dump tiles from a COG',
            documentation: 'Stuff',
        });
        this.logger = CliLogger.child({ action: 'tile' });
    }

    // TODO this only works for WSG84
    async dumpBounds(tif: CogTiff, output: string, index: number) {
        this.logger.info({ index }, 'CreateTileBounds');
        const img = tif.getImage(index);
        if (!img.isTiled()) {
            return;
        }

        const features: GeoJsonPolygon[] = [];
        const featureCollection = {
            type: 'FeatureCollection',
            features,
        };

        const tileCount = img.tileCount;
        const tileInfo = img.tileSize;
        const tileSize = img.size;

        const firstImage = tif.images[0];
        const firstTileSize = firstImage.size;
        const origin = firstImage.origin;
        const resolution = firstImage.resolution;

        const xScale = (resolution[0] * firstTileSize.width) / tileSize.width;
        const yScale = (resolution[1] * firstTileSize.height) / tileSize.height;

        for (let y = 0; y < tileCount.y; y++) {
            const yMax = origin[1] + y * tileInfo.height * yScale;
            const yMin = yMax + tileInfo.height * yScale;
            for (let x = 0; x < tileCount.x; x++) {
                const xMin = origin[0] + x * tileInfo.width * xScale;
                const xMax = xMin + tileInfo.width * xScale;
                features.push(makePolygon(xMin, yMin, xMax, yMax));
            }
        }

        await fs.writeFile(path.join(output, `i${index}.bounds.geojson`), JSON.stringify(featureCollection, null, 2));
    }

    async dumpIndex(tif: CogTiff, output: string, index: number) {
        this.logger.info({ index }, 'CreateIndexHtml');
        const img = tif.getImage(index);
        if (!img.isTiled()) {
            return;
        }

        const { tileCount, tileSize } = img;

        const styles = `<style>.c { min-width: ${tileSize.width}px; min-height: ${tileSize.height}px }</style>`;

        const html = ['<html>', styles];
        for (let y = 0; y < tileCount.y; y++) {
            html.push('\t<div style="display:flex;">');
            for (let x = 0; x < tileCount.x; x++) {
                const tile = await tif.getTile(x, y, index);
                if (tile == null) {
                    html.push(`\t\t<div class="c"></div>`);
                    continue;
                }

                html.push(`\t\t<img class="c" src="./${getTileName(tile.mimeType, index, x, y)}" >`);
            }

            html.push('\t</div>');
        }
        html.push('</html>');
        await fs.writeFile(path.join(output, 'index.html'), html.join('\n'));
    }

    async dumpTiles(tif: CogTiff, output: string, index: number) {
        const promises: Promise<void>[] = [];
        const img = tif.getImage(index);
        if (!img.isTiled()) {
            return;
        }

        this.logger.info({ ...img.tileSize, ...img.tileCount }, 'TileInfo');
        const tileCount = img.tileCount;

        // Load all offsets in
        await img.tileOffset.load();

        for (let x = 0; x < tileCount.x; x++) {
            for (let y = 0; y < tileCount.y; y++) {
                const promise = TileQueue(() => writeTile(tif, x, y, index, output, this.logger));
                promises.push(promise);
                this.outputCount++;
            }
        }

        await Promise.all(promises);
    }

    async onExecute(): Promise<void> {
        if (
            this.imageIndex == null ||
            this.imageIndex.value == null ||
            this.output == null ||
            this.output.value == null
        ) {
            return;
        }
        this.outputCount = 0;

        const { tif } = await ActionUtil.getCogSource(this.file);
        const index = this.imageIndex.value;
        if (index == null || index > tif.images.length - 1 || index < -1) {
            this.renderHelpText();
            throw Error(`Invalid index level "${index}" must be between 0 - ${tif.images.length - 1}`);
        }

        const img = tif.getImage(index);
        if (!img.isTiled()) {
            throw Error('Tif file is not tiled.');
        }

        const output = path.join(this.output.value, `i${index}`);
        await fs.mkdir(output, { recursive: true });

        await this.dumpTiles(tif, output, index);
        await this.dumpIndex(tif, output, index);
        await this.dumpBounds(tif, this.output.value, index);

        const chunkIds = Object.keys(tif.source.chunks).filter((f) => tif.source.chunk(parseInt(f, 10)).isReady());
        const result: CliResultMap[] = [
            {
                keys: [
                    { key: 'Tiff type', value: `${TiffVersion[tif.source.version]} (v${String(tif.source.version)})` },
                    { key: 'Chunk size', value: toByteSizeString(tif.source.chunkSize) },
                    {
                        key: 'Bytes read',
                        value:
                            `${toByteSizeString(chunkIds.length * tif.source.chunkSize)} ` +
                            `(${chunkIds.length} Chunk${chunkIds.length === 1 ? '' : 's'})`,
                    },
                ],
            },
            {
                title: 'Output',
                keys: [{ key: 'Images', value: this.outputCount }],
            },
        ];
        const msg = ActionUtil.formatResult(`${c.bold('COG File Info')} - ${c.bold(tif.source.name)}`, result);
        console.log(msg.join('\n'));
        return Promise.resolve();
    }

    protected onDefineParameters(): void {
        this.file = this.defineStringParameter({
            argumentName: 'FILE',
            parameterLongName: '--file',
            parameterShortName: '-f',
            description: 'cog file to access',
            required: true,
        });

        this.imageIndex = this.defineIntegerParameter({
            argumentName: 'IMAGE',
            parameterShortName: '-i',
            parameterLongName: '--image',
            description: 'Image id to export (starting from 0)',
            required: true,
        });

        this.output = this.defineStringParameter({
            argumentName: 'OUTPUT',
            parameterShortName: '-o',
            parameterLongName: '--output',
            description: 'Where to store the output',
            required: true,
        });
    }
}
