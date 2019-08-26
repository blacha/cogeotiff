import { CommandLineParser, CommandLineFlagParameter } from '@microsoft/ts-command-line';
import { ActionDumpTile } from './action.dump.tile';
import chalk from 'chalk';
import { ChalkLogStream } from './cli.log';
import { ActionCogInfo } from './action.info';
import { ActionTile } from './action.tile';
import { Log } from 'bblog';
import * as Core from '@coginfo/core';

export class CogInfoCommandLine extends CommandLineParser {
    verbose = this.defineFlagParameter({
        parameterLongName: '--verbose',
        parameterShortName: '-v',
        description: 'Show extra logging detail',
    });
    extraVerbose = this.defineFlagParameter({
        parameterLongName: '--vv',
        parameterShortName: '-V',
        description: 'Show extra extra logging detail',
    });

    constructor() {
        super({
            toolFilename: 'coginfo',
            toolDescription: 'Cloud optimized geotiff utilities',
        });

        this.addAction(new ActionDumpTile());
        this.addAction(new ActionCogInfo());
        this.addAction(new ActionTile());
    }

    protected onExecute(): Promise<void> {
        if (!chalk.supportsColor) {
            return super.onExecute();
        }
        const logger = Log.createLogger({
            name: 'coginfo',
            hostname: '',
            streams: [ChalkLogStream],
        });
        Core.Log.set(logger);

        if (this.verbose.value) {
            ChalkLogStream.level = Log.INFO;
        } else if (this.extraVerbose.value) {
            ChalkLogStream.level = Log.TRACE;
        } else {
            ChalkLogStream.level = Log.ERROR;
        }

        return super.onExecute();
    }
    protected onDefineParameters(): void {}
}
