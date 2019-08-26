import 'source-map-support/register';

import { CogInfoCommandLine } from './cli.cog.info';

const cogInfo: CogInfoCommandLine = new CogInfoCommandLine();
cogInfo.execute();
