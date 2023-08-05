# coeotiff

CLI to work with [Cloud optimized GEOTiff](https://www.cogeo.org/)

-   Completely javascript based, works in the browser and nodejs
-   Lazy load COG images and metadata
-   Supports huge 100GB+ COGs
-   Uses GDAL COG optimizations, generally only one read per tile!
-   Loads COGs from URL, File or AWS S3

## Usage

```bash
npm i -g @cogeotiff/cli
```

### cogeotiff info

Display basic information about COG

```shell
cogeotiff info webp.cog.tiff
```

Output:

```
COG File Info - s3://linz-imagery/otago/otago_sn9457_1995-1997_0.75m/2193/rgb/    Tiff type       BigTiff (v43)
    Bytes read      32 KB (1 Chunk)

Images
    Compression     image/webp
    Origin          1352800, 4851600, 0
    Resolution      0.75, -0.75, 0
    BoundingBox     1352800, 4844400, 1357600, 4851600
    EPSG            EPSG:2193 (https://epsg.io/2193)
    Images          
        Id      Size                    Tile Size               Tile Count              Resolution          
        0       6400x9600               512x512                 13x19 (247)             0.75                
        1       3200x4800               512x512                 7x10 (70)               1.5                 
        2       1600x2400               512x512                 4x5 (20)                3                   
        3       800x1200                512x512                 2x3 (6)                 6                   
        4       400x600                 512x512                 1x2 (2)                 12                  
        5       200x300                 512x512                 1x1 (1)                 24                  

GDAL
    COG optimized   true
    Ghost Options   
                GDAL_STRUCTURAL_METADATA_SIZE = 000140 bytes
                LAYOUT = IFDS_BEFORE_DATA
                BLOCK_ORDER = ROW_MAJOR
                BLOCK_LEADER = SIZE_AS_UINT4
                BLOCK_TRAILER = LAST_4_BYTES_REPEATED
                KNOWN_INCOMPATIBLE_EDITION = NO
```

### cogeotiff dump

Dump all tiles for a image (**Warning** if you do this for a large cog this will create millions of files.)

```
cogeotiff dump webp.cog.tiff --image 2 --output output
```
