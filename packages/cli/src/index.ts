import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import 'source-map-support/register';
import { CogInfoCommandLine } from './cli.cog.info';
import { CliLogger } from './cli.log';
import * as S3 from 'aws-sdk/clients/s3';

CogSourceAwsS3.DefaultS3 = new S3();

const cogInfo: CogInfoCommandLine = new CogInfoCommandLine();
cogInfo.executeWithoutErrorHandling().catch((error) => {
    CliLogger.fatal({ error }, 'Failed to run');
    process.exit(1);
});
