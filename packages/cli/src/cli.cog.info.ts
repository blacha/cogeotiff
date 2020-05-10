import * as Core from '@cogeotiff/core';
import { CommandLineParser, CommandLineFlagParameter } from '@rushstack/ts-command-line';
import { Log } from 'bblog';
import * as chalk from 'chalk';
import { ActionDumpTile } from './action.dump.tile';
import { ActionCogInfo } from './action.info';
import { ActionTile } from './action.tile';
import { ChalkLogStream, CliLogger } from './cli.log';

export class CogInfoCommandLine extends CommandLineParser {
    verbose?: CommandLineFlagParameter;
    extraVerbose?: CommandLineFlagParameter;

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
        Core.Log.set(CliLogger);

        if (this.verbose?.value) {
            ChalkLogStream.setLevel(Log.INFO);
        } else if (this.extraVerbose?.value) {
            ChalkLogStream.setLevel(Log.TRACE);
        } else {
            ChalkLogStream.setLevel(Log.ERROR);
        }

        return super.onExecute();
    }
    protected onDefineParameters(): void {
        this.verbose = this.defineFlagParameter({
            parameterLongName: '--verbose',
            parameterShortName: '-v',
            description: 'Show extra logging detail',
        });
        this.extraVerbose = this.defineFlagParameter({
            parameterLongName: '--vv',
            parameterShortName: '-V',
            description: 'Show extra extra logging detail',
        });
    }
}
