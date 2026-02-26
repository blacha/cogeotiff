# cogeotiff


Tools to work with [Cloud optimized GeogTiff](https://www.cogeo.org/) (COG) 

-  Completely javascript based, works in the browser and nodejs
-  Lazy load Tiffs images and metadata
-  Supports huge 100GB+ COGs
-  Uses GDAL Tiffs optimizations, generally only one or two reads per tile!
-  Loads Tiffs from URL, File, Google Cloud or AWS S3
-  Used in production for [LINZ's Basemaps](https://github.com/linz/basemaps) with billions of tiles fetched from COGs!

## Usage

Load a COG from a URL using `fetch`

```typescript
import { SourceHttp } from '@chunkd/source-http';

const source = new SourceHttp('https://example.com/cog.tif');
const cog = await Tiff.create(source);

const img = cog.images[0];
if (img.isTiled()) throw new Error('Tiff is not tiled');
const tile = await img.getTile(2, 2); // Fetch a tile from a tiff x:2, y:2

// Tiff tags can be directly accessed too
img.value(TiffTag.GdalNoData); // "-9999"
// or tag metadata can be fetched
img.tags.get(TiffTag.GdalNoData); 
/**
{
  type: 'inline', // How the tag was read "inline" vs "lazy"
  id: 42113, // Tag Id (@see TiffTag)
  name: 'GdalNoData', // Tag Name
  count: 6, // Number of values
  value: '-9999',
  dataType: 2, // Char
  tagOffset: 194 // Bytes into the file where the tag was read.
}
*/
```

## Command Line Interface

```bash
npm i -g @cogeotiff/cli
```

### cogeotiff info

Display basic information about COG

```shell
cogeotiff info webp.cog.tif
```

Output:

```
COG File Info - /home/blacha/Downloads/tif-new/bg43.webp.cog.tif

    Tiff type       BigTiff (v43)
    Chunk size      64 KB
    Bytes read      64 KB (1 Chunk)

  Images
    Compression     image/webp
    Origin          18550349.52047286,-5596413.462927464,0
    Resolution      19.10925707129406,-19.10925707129415,0
    BoundingBox     18550349.52047286,-5713820.738373496,19098250.139221005,-5596413.462927464
    Info
                Id      Size                    Tile Size               Tile Count
                0       28672x6144              56x12                   672
                1       14336x3072              28x6                    168
                2       7168x1536               14x3                    42
                3       3584x768                7x2                     14
                4       1792x384                4x1                     4
                5       896x192                 2x1                     2
                6       448x96                  1x1                     1

  GDAL
    COG optimized   true
    COG broken      false
    Tile order      RowMajor
    Tile leader     uint32 - 4 Bytes
    Mask interleaved  false
```

### cogeotiff dump

Dump all tiles for a image (**Warning** if you do this for a large cog this will create millions of files.)

```
cogeotiff dump --image 2 --output output
```


# Building

Requires [NodeJs](https://nodejs.org/en/) >=[24.0](./.node-version)

Use [n](https://github.com/tj/n) or [fnm](https://github.com/Schniz/fnm) to manage nodeJs versions

```bash
# Download the latest nodejs
n latest

# Install node deps
npm install

# Build everything into /build
npm run build

# Run the unit tests
npm run test
```
