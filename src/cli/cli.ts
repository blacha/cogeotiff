// import 'source-map-support/register';

// import { LoggerConfig, Logger } from '../util/util.log';
// import { Log } from 'bblog';
// import * as arg from 'arg';
// import chalk from 'chalk';
// import { CogSourceUrl } from '../source/cog.source.web';
// import * as fetch from 'node-fetch';
// import { ChalkLogStream } from './cli.log';
// import { CogSource } from '../cog.source';
// import { CogSourceFile } from '../source/cog.source.file';
// import { CogTif } from '../cog.tif';

// CogSourceUrl.fetch = (a, b) => fetch(a, b);

// export const StdArgs = {
//     '--help': Boolean,
//     '--file': String,
//     '--url': String,
//     '--v': Boolean,
//     '--vv': Boolean,
//     '--vvv': Boolean,
//     '--bs': Number,

//     '-f': '--file',
//     '-u': '--url',
//     '-h': '--help',
//     '-v': '--v',
//     '-V': '--vv',
// };

// export const Cli = {
//     ChunkSize: 64 * 1024,
//     StdHelp: chalk`
//     --help                           Shows this help message
//     --file {underline COG File}      File to process
//     --url {underline COG File}       URL to process
//     --bs {underline bytes}           Chunk size (KB) default: 64KB
//     --v|vv|vvv                       Increase logging verbosity
// `,
//     StdArgs,

//     setupLogging(args: arg.Result<typeof StdArgs>): void {

//     },

//     fail(helpMessage: string, extraMessage = ''): void {
//         console.log(extraMessage + helpMessage + Cli.StdHelp);
//         process.exit(2);
//     },

//     getSource(args: arg.Result<typeof StdArgs>): CogSource | null {
//         const fileName = args['--file'];
//         if (fileName != null) {
//             return new CogSourceFile(fileName);
//         }

//         const url = args['--url'];
//         if (url != null) {
//             return new CogSourceUrl(url);
//         }
//         return null;
//     },

//     async process<T extends arg.Spec>(argList: T, helpMessage: string) {
//         const args = arg(argList);
//         if (args['--help']) {
//             throw Cli.fail(helpMessage);
//         }

//         const source = Cli.getSource(args);
//         if (source == null) {
//             throw Cli.fail(helpMessage, 'Missing input. Use --file or --url\n\n');
//         }

//         Cli.setupLogging(args);

//         const bs = args['--bs'];
//         if (typeof bs == 'number' && !isNaN(bs)) {
//             source.chunkSize = bs * 1024;
//         } else {
//             source.chunkSize = Cli.ChunkSize;
//         }
//         const tif = new CogTif(source);
//         await tif.init();
//         return { tif, args, source };
//     },

// };
