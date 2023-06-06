// import { TiffVersion } from '@cogeotiff/core';
// import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';
// import c from 'ansi-colors';
// import { ChunkSourceBase } from '@chunkd/core';
// import { ActionUtil, CliResultMap } from './action.util.js';
// import { logger as Logger } from './cli.log.js';
// import { toByteSizeString } from './util.bytes.js';
// import { writeTile } from './util.tile.js';

// export class ActionTile extends CommandLineAction {
//     private file: CommandLineStringParameter | null = null;
//     private xyz: CommandLineStringParameter | null = null;

//     public constructor() {
//         super({
//             actionName: 'tile',
//             summary: 'Fetch a specific tile from a COG',
//             documentation: '',
//         });
//     }

//     async onExecute(): Promise<void> {
//         const logger = Logger.child({ action: 'tile' });

//         // abstract
//         const { tif } = await ActionUtil.getCogSource(this.file);
//         if (this.xyz == null || this.xyz.value == null) {
//             throw new Error('XYZ was not defined');
//         }

//         const [x, y, z] = this.xyz.value.split(',').map((c) => parseInt(c));
//         if (isNaN(x) || isNaN(y) || isNaN(z)) {
//             throw new Error('Invalid XYZ, format: "X,Y,Z"');
//         }

//         await writeTile(tif, x, y, z, '.', logger);
//         const source = tif.source as ChunkSourceBase;
//         const chunkIds = [...(source.chunks as Map<unknown, unknown>).values()];

//         const result: CliResultMap[] = [
//             {
//                 keys: [
//                     { key: 'Tiff type', value: `${TiffVersion[tif.version]} (v${String(tif.version)})` },
//                     { key: 'Chunk size', value: toByteSizeString(tif.source.chunkSize) },
//                     {
//                         key: 'Bytes read',
//                         value: `${toByteSizeString(chunkIds.length * tif.source.chunkSize)} (${chunkIds.length} Chunk${
//                             chunkIds.length === 1 ? '' : 's'
//                         })`,
//                     },
//                 ],
//             },
//         ];

//         const msg = ActionUtil.formatResult(`${c.bold('COG File Info')} - ${c.bold(tif.source.uri)}`, result);
//         console.log(msg.join('\n'));
//     }

//     protected onDefineParameters(): void {
//         // abstract
//         this.file = this.defineStringParameter({
//             argumentName: 'FILE',
//             parameterLongName: '--file',
//             parameterShortName: '-f',
//             description: 'cog file to access',
//             required: true,
//         });

//         this.xyz = this.defineStringParameter({
//             argumentName: 'XYZ',
//             parameterLongName: '--xyz',
//             description: '"X,Y,Z" of the tile to fetch',
//             required: true,
//         });
//     }
// }
