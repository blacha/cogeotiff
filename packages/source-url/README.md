# @coginfo/source-url


Load a COG from a URL Source using `fetch`

## Usage

```javascript
import { CogSourceUrl } from '@coginfo/source-url';

const cog = await CogSourceUrl.create('https://example.com/cog.tif');
```

#### Nodejs
Nodejs does not come with a default `fetch` function, this package will use `node-fetch` when in used with nodejs
