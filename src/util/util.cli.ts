import { LoggerConfig } from "./util.log";
import { Log } from "bblog";
import { CogSourceFile, CogTif } from "..";
import * as arg from 'arg';
import chalk from 'chalk';
import { CogSourceUrl } from '../source/cog.source.web';
import * as fetch from 'node-fetch';

CogSourceUrl.fetch = (a, b) => fetch(a, b);

export interface CliResultMap {
    title?: string;
    keys: { key: string, value: any }[]
}
export const StdArgs = {
    '--help': Boolean,
    '--file': String,
    '--url': String,
    '--v': Boolean,
    '--vv': Boolean,
    '--vvv': Boolean,
    '--bs': Number,

    '-f': '--file',
    '-u': '--url',
    '-h': '--help',
    '-v': '--v',
    '-V': '--vv'
}

export const Cli = {
    ChunkSize: 64 * 1024,
    StdHelp: chalk`
    --help                           Shows this help message
    --file {underline COG File}      File to process
    --url {underline COG File}       URL to process
    --bs {underline bytes}           Chunk size (KB) default: 64KB
    --v|vv|vvv                       Increase logging verbosity
`,
    StdArgs,

    getLogging(args: arg.Result<typeof StdArgs>) {
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

    getSource(args: arg.Result<typeof StdArgs>) {
        const fileName = args['--file'];
        if (fileName != null) {
            return new CogSourceFile(fileName);
        }

        const url = args['--url'];
        if (url != null) {
            return new CogSourceUrl(url);
        }
        return null;
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

        const source = Cli.getSource(args);
        if (source == null) {
            throw Cli.fail(helpMessage, 'Missing input. Use --file or --url\n\n')
        }

        Cli.getLogging(args)

        const bs = args['--bs']
        if (typeof bs === 'number') {
            source.chunkSize = bs * 1024;
        } else {
            source.chunkSize = this.ChunkSize;
        }
        const tif = new CogTif(source);
        await tif.init();
        return { tif, args, source };
    },

    formatResult(title: string, result: CliResultMap[]): string[] {
        const msg: string[] = [title];
        for (const group of result) {
            msg.push('');
            if (group.title) {
                msg.push(chalk`  {bold ${group.title}}`)
            }
            for (const kv of group.keys) {
                if (kv == null) { continue; }
                if (kv.value == null || (typeof kv.value === 'string' && kv.value.trim() === '')) {
                    continue;
                }
                msg.push(chalk`    ${kv.key.padEnd(14, ' ')}  ${kv.value}`)
            }
        }
        return msg;

    }
}

