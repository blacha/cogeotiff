import 'source-map-support/register';
import { CogInfoCommandLine } from './cli.cog.info';
import { CliLogger } from './cli.log';

const cogInfo: CogInfoCommandLine = new CogInfoCommandLine();
cogInfo.executeWithoutErrorHandling().catch((error) => {
    CliLogger.fatal({ error }, 'Failed to run');
    process.exit(1);
});
