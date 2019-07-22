import { CommandLineAction, CommandLineStringParameter } from '@microsoft/ts-command-line';
import { ActionUtil, CliResultMap, CLiResultMapLine } from './action.util';
import { TiffVersion, TiffTag } from '../read/tif';
import { toByteSizeString } from '../util/util.bytes';
import chalk from 'chalk';
import { Logger } from '../util/util.log';
import { writeFileSync } from 'fs';
import { TileUtil } from '../util/util.tile';
import { Timer } from '../util/util.timer';

export class ActionTile extends CommandLineAction {
    private file: CommandLineStringParameter | null = null;
    private xyz: CommandLineStringParameter | null = null;

    public constructor() {
        super({
            actionName: 'tile',
            summary: 'Fetch a specific tile from a COG',
            documentation: '',
        });
    }

    async onExecute(): Promise<void> {
        // abstract
        Timer.start('total');
        const { tif } = await ActionUtil.getCogSource(this.file);
        if (this.xyz == null || this.xyz.value == null) {
            throw new Error('XYZ was not defined');
        }

        const isCogOptimized = tif.options.isCogOptimized;
        if (!isCogOptimized) {
            Logger.warn('COG is not optimized, fetching specific tiles will be slow.');
        }

        const [x, y, z] = this.xyz.value.split(',').map(c => parseInt(c));
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            throw new Error('Invalid XYZ, format: "X,Y,Z"');
        }

        Timer.start('tile');
        await TileUtil.write(tif, x, y, z, '.');
        Timer.end('tile');

        Timer.end('total');
        const chunkIds = Object.keys(tif.source._chunks).filter(f => tif.source.chunk(parseInt(f, 10)).isReady());

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
                title: 'Performance',
                keys: Object.keys(Timer.startTimes).map(c => {
                    if (Timer.times[c] == null) {
                        return null;
                    }
                    return { key: c, value: String(Timer.times[c]) };
                }),
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

        this.xyz = this.defineStringParameter({
            argumentName: 'XYZ',
            parameterLongName: '--xyz',
            description: '"X,Y,Z" of the tile to fetch',
            required: true,
        });
    }
}
