import { CommandLineParser, CommandLineFlagParameter } from '@microsoft/ts-command-line';
import { ActionDumpTile } from './action.dump.tile';
import { Logger, LoggerConfig } from '../util/util.log';
import chalk from 'chalk';
import { Log } from 'bblog';
import { ChalkLogStream } from './cli.log';
import { ActionCogInfo } from './action.info';

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
    }

    protected onExecute(): Promise<void> {
        // override
        if (this.verbose.value) {
            LoggerConfig.level = Log.INFO;
        } else if (this.extraVerbose.value) {
            LoggerConfig.level = Log.TRACE;
        } else {
            LoggerConfig.level = Log.ERROR;
        }

        if (chalk.supportsColor) {
            Logger['streams'] = [ChalkLogStream];
        }
        return super.onExecute();
    }
    protected onDefineParameters(): void {}
}
