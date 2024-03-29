# @cogeotiff/core

Working with [Cloud optimized GEOTiff](https://www.cogeo.org/) and Tiffs

-  Completely javascript based, works in the browser and nodejs
-  Lazy load Tiffs images and metadata
-  Supports huge 100GB+ COG
-  Uses GDAL COG optimizations, generally only one or two reads per tile!
-  Loads Tiffs from URL, File, Google Cloud or AWS S3
-  Used in production for [LINZ's Basemaps](https://github.com/linz/basemaps) with billions of tiles fetched from Tiffs!

## Usage

Load a COG from a remote http source

```typescript
import { SourceHttp } from '@chunkd/source-url';
import { Tiff } from '@cogeotiff/core'

const source = new SourceHttp('https://example.com/cog.tif');
const tiff = await Tiff.create(source);

/** Load a specific tile from a specific image */
const tile = await tiff.images[5].getTile(2, 2);

/** Load the 5th image in the Tiff */
const img = tiff.images[5];
if (img.isTiled()) {
    /** Load tile x:10 y:10 */
    const tile = await img.getTile(10, 10);
    tile.mimeType; // image/jpeg
    tile.bytes; // Raw image buffer
}

/** Get the origin point of the tiff */
const origin = img.origin;
/** Bounding box of the tiff */
const bbox = img.bbox;

// Tiff tags can be accessed via some helpers
const noData = img.noData; // -9999
const noDataTag = img.tags.get(TiffTag.GdalNoData) // Tag information such as file offset or tagId
const noDataValue = img.value(TiffTag.GdalNoData) // "-9999" (tag is stored as a string)
```

### Tags

Tags are somewhat typesafe for most common use cases in typescript, 

```typescript
img.value(TiffTag.ImageWidth) // number
img.value(TiffTag.BitsPerSample) // number[]
```

Some tags have exported constants to make them easier to work with

```typescript
import {Photometric} from '@cogeotiff/core'


const photometric = img.value(TiffTag.Photometric)

if( photometric == Photometric.Rgb) { 
  // Tiff is a RGB photometric tiff
}
```

For a full list of constants see [./src/index.ts](./src/index.ts)

GeoTiff tags are loaded into a separate location

```typescript
import {RasterTypeKey} from '@cogeotiff/core'

const pixelIsArea = img.valueGeo(TiffTagGeo.GTRasterTypeGeoKey) == RasterTypeKey.PixelIsArea
```

### Examples

More examples can bee seen

- [@cogeotiff/example](https://github.com/blacha/cogeotiff/tree/master/packages/examples)
- [CogViewer](https://github.com/blacha/cogeotiff-web)
- [@chunkd](https://github.com/blacha/chunkd) Additional sources eg file:// and s3://