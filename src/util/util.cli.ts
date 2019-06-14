import 'source-map-support/register'

import { LoggerConfig } from "./util.log";
import { Log } from "bblog";
import { CogSourceFile, CogTif } from "..";
import * as arg from 'arg';
import chalk from 'chalk';

export const Cli = {
    ChunkSize: 64 * 1024,
    StdHelp: chalk`
    --help                           Shows this help message
    --file {underline COG File}      File to process
    --bs {underline bytes}           Chunk size (KB) default: 64KB
    --v|vv|vvv                       Increase logging verbosity
`,
    StdArgs: {
        '--help': Boolean,
        '--file': String,
        '--v': Boolean,
        '--vv': Boolean,
        '--vvv': Boolean,
        '--bs': Number,

        '-f': '--file',
        '-h': '--help',
        '-v': '--v'
    },

    getLogging(args: Object) {
        if (args['--v']) {
            LoggerConfig.level = Log.INFO
        } else if (args['--vv']) {
            LoggerConfig.level = Log.DEBUG
        } else if (args['--vvv']) {
            LoggerConfig.level = Log.TRACE
        } else {
            LoggerConfig.level = Log.ERROR
        }
    },

    fail(helpMessage: string, extraMessage = '') {
        console.log(extraMessage + helpMessage + Cli.StdHelp)
        process.exit(2);
    },
    async process(argList: arg.Spec, helpMessage: string) {
        const fullArgs = {
            ...Cli.StdArgs,
            ...argList
        }
        const args = arg(fullArgs)
        if (args['--help']) {
            throw Cli.fail(helpMessage);
        }

        const fileName = args['--file'];
        if (fileName == null) {
            throw Cli.fail(helpMessage);
        }

        Cli.getLogging(args)

        const bs = args['--bs']
        const source = new CogSourceFile(fileName);
        source.chunkSize = isNaN(bs) ? Cli.ChunkSize : bs * 1024;
        const tif = new CogTif(source);
        await tif.init();
        return { tif, args, source };
    }
}

