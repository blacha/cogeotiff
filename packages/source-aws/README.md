# @coginfo/source-aws

Load a COG from a AWS using `aws-sdk`

## Usage

```javascript
import { CogSourceAwsS3 } from '@coginfo/source-aws';

const cog = await CogSourceAwsS3.create('bucket', 'path/to/cog.tif');
```
