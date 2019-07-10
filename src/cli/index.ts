import 'source-map-support/register';

import { CogInfoCommandLine } from './cli.cog.info';
import { CogSourceUrl } from '../source/cog.source.web';
import * as fetch from 'node-fetch';

CogSourceUrl.fetch = (a, b) => fetch(a, b);

const cogInfo: CogInfoCommandLine = new CogInfoCommandLine();
cogInfo.execute();
