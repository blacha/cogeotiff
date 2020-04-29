# cogeotiff

[![Build Status](https://github.com/blacha/cogeotiff/workflows/Main/badge.svg)](https://github.com/blacha/cogeotiff/actions)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/blacha/cogeotiff.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/blacha/cogeotiff/context:javascript)

Tools to work with [Cloud optimized GEOTiff](https://www.cogeo.org/)

-   Completely javascript based, works in the browser and nodejs
-   Lazy load COG images and metadata
-   Supports huge 100GB+ COGs
-   Uses GDAL COG optimizations, generally only one read per tile!
-   Loads COGs from URL, File or AWS S3

## Usage

Load a COG from a URL using `fetch`

```javascript
import { CogSourceUrl } from '@cogeotiff/source-url';

const cog = await CogSourceUrl.create('https://example.com/cog.tif');
const tile = await cog.getTileRaw(2, 2, 5);
```

## Scripts

```bash
npm i -g @cogeotiff/cli
```

### cogeotiff info

Display basic information about COG

```shell
cogeotiff info --file webp.cog.tif
```

Output:

```
COG File Info - /home/blacha/Downloads/tif-new/bg43.webp.cog.tif

    Tiff type       BigTiff (v43)
    Chunk size      64 KB
    Bytes read      64 KB (1 Chunk)

  Images
    Count           7
    Compression     image/webp
    Origin          2027440,5699400,0
    Resolution      0.10000000000000002,-0.10000000000000002,0
    BoundingBox     2027440,5698320,2029120,5699400
    Sizes           16800x10800 8400x5400 4200x2700 2100x1350 1050x675 525x338 263x169
    Tiles           512x512 (726) 512x512 (187) 512x512 (54) 512x512 (15) 512x512 (6) 512x512 (2) 512x512 (1)

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
cogeotiff dump --file webp.cog.tif --image 2 --output output
```

### cogeotiff tile

Load and dump a individual tile

```
cogeotiff tile --file webp.cog.tif --xyz 1,1,1
```

# Building

This requires [NodeJs](https://nodejs.org/en/) > 12 & [Yarn](https://yarnpkg.com/en/)

Use [n](https://github.com/tj/n) to manage nodeJs versions

```bash
# Download the latest nodejs & yarn
n latest
npm install -g yarn

# Install node deps
yarn

# Build everything into /build
yarn run build

# Run the unit tests
yarn run test
```
