import { CommandLineFlagParameter, CommandLineParser } from '@rushstack/ts-command-line';
import { Log } from 'bblog';
import { ActionDumpTile } from './action.dump.tile.js';
import { ActionCogInfo } from './action.info.js';
import { ActionTile } from './action.tile.js';
import { ChalkLogStream } from './cli.log.js';

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
