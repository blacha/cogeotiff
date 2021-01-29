# @cogeotiff/core

Reading logic for GeoTiffs

## Usage

```typescript
import { CogSourceUrl } from '@cogeotiff/source-url';

const source = new  CogSourceUrl('https://example.com/cog.tif');
const tiff = await CogTiff.create(source)

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
