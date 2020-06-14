# @cogeotiff/core

Reading logic for GeoTiffs

## Usage

```javascript
import { CogSourceUrl } from '@cogeotiff/source-url';

const cog = await CogSourceUrl.create('https://example.com/cog.tif');

/** Load a specific tile from a specific image */
const tile = await cog.getTile(2, 2, 5);

/** Load the 5th image in the Tif */
const img = cog.getImage(5);
if (img.isTiled()) {
    /** Load tile x:10 y:10 */
    const tile = await img.getTile(10, 10);

    const tileInfo = img.tileInfo
}

/** Get the origin point of the tif */
const origin = img.origin;
const bbox = img.bbox;
```
