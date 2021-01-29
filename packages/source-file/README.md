# @cogeotiff/source-file


Load a COG from a file using `fs`

## Usage

```javascript
import { SourceFile } from '@cogeotiff/source-file';

const source = new SourceFile('./cog.tif');


// Read in the first 1KB of data
await source.loadBytes(0, 1024);
```
