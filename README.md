# cog-viewer
[![pipeline status](https://gitlab.com/blacha/coginfo/badges/master/pipeline.svg)](https://gitlab.com/blacha/coginfo/commits/master)

![pipeline status](https://codebuild.ap-southeast-2.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiQ2p1VkxVVEdrOWhhcnF2WExWMFlueHBIWmdHeVltdjgyeHBIenFNNzU4WVZWYzJzeXVUYnFqRWJVU212SkJiTkFvUmZmNG0yY2ovS3VTVjRYcjdqRGhvPSIsIml2UGFyYW1ldGVyU3BlYyI6InNaUFo2ZW1KclVBRDJHREgiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)

Utility to investigate access patterns for [Cloud optimized GEOTiff](https://www.cogeo.org/)

This is mostly just a learning exercise for Tiff/[BigTiff](http://bigtiff.org/) IFD access & GEOTiff in general


This is a work in progress and likely will not work


## Scripts
### coginfo

Display basic information about COG

```shell
coginfo --file webp.cog.tif
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


### cogdump

Dump all tiles for a zoom level (**Warning** if you do this for a large cog this will create millions of files.)

```
cogdump --file webp.cog.tif --zoom 2 --output output --html
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

# Contribuiting

This repoistory uses [Conventional Commits](https://www.conventionalcommits.org/)

Example options:
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **docs**: Documentation only changes
- **feat**: A new feature
- **fix**: A bug fix
- **perf**: A code change that improves performance
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **style**: Changes that do not affect the meaning of the code
- **test**: Adding missing tests or correcting existing tests
