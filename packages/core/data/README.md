# Testing cogs taken from

- https://github.com/mapbox/COGDumper
- `sparse.tiff` Contains data sourced from [LINZ](https://linz.govt.nz) licensed for reuse under CC BY 4.0
- `DEM_BS28_2016_1000_1141.tif`  Contains data sourced from [LINZ](https://linz.govt.nz) licensed for reuse under CC BY 4.0
- `model_transformation.tif` is a small window of data from [source.coop](https://source.coop/tge-labs/aef), specifically s3://us-west-2.opendata.source.coop/tge-labs/aef/v1/annual/2024/13N/xjejfvrbm1fbu1ecw-0000000000-0000008192.tiff flipped so the y-axis is up (the source data has an inverted y-axis), licensed for reuse under CC BY 4.0. The AlphaEarth Foundations Satellite Embedding dataset is produced by Google and Google DeepMind.


# rgba8_cog.tiff

```bash
gdal_translate -of COG -co compress=zstd rgba8_tiled.tiff rgba8_cog.tiff -co blocksize=16
```
