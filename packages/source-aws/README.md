# @cogeotiff/source-aws

Load a chunks of a file from a AWS using `aws-sdk`

## Usage

```typescript
import { SourceAwsS3 } from '@cogeotiff/source-aws';
import S3 from 'aws-sdk/clients/s3';

const source = new SourceAwsS3('bucket', 'path/to/cog.tif', new S3());

// Load the first 1KB
await source.fetchBytes(0, 1024);
```
