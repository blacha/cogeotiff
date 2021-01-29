# @cogeotiff/source-url


Load a chunks of a file from a URL Source using `fetch`

## Usage

```javascript
import { SourceUrl } from '@cogeotiff/source-url';

const source= new SourceUrl('https://example.com/cog.tif');

await source.loadBytes(0, 1024)
```

#### Nodejs
Nodejs does not come with a default `fetch` function, this package will use `node-fetch` when in used with nodejs
