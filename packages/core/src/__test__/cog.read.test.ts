import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { TestFileSource } from '../__benchmark__/source.file.js';
import { SourceMemory } from '../__benchmark__/source.memory.js';
import { TiffMimeType } from '../const/tiff.mime.js';
import { Photometric, SampleFormat } from '../const/tiff.tag.id.js';
import { TiffVersion } from '../const/tiff.version.js';
import { TagOffset, TiffTag, TiffTagGeo } from '../index.js';
import { Tiff } from '../tiff.js';

function validate(tif: Tiff): void {
  assert.equal(tif.images.length, 5);

  const [firstTif] = tif.images;
  assert.equal(firstTif.isTiled(), true);
  assert.deepEqual(firstTif.tileSize, { width: 256, height: 256 });
  assert.deepEqual(firstTif.size, { width: 64, height: 64 });
}

describe('TiffTag', () => {
  it('should have the correct ModelTransformation tag id', () => {
    assert.equal(TiffTag.ModelTransformation, 34264);
  });
});

describe('CogRead', () => {
  it('should read big endian', async () => {
    const source = new TestFileSource(new URL('../../data/big.endian.tiff', import.meta.url));
    const tiff = new Tiff(source);

    await tiff.init();

    assert.equal(tiff.isLittleEndian, false);
    assert.equal(tiff.version, TiffVersion.Tiff);
    assert.equal(tiff.images.length, 1);
    const firstImage = tiff.images[0];
    const byteCounts = await firstImage.fetch(TiffTag.TileByteCounts);
    assert.deepEqual([...(byteCounts ?? [])], [511]);

    assert.equal(firstImage.compression, 'application/zstd');
    assert.equal(firstImage.isTiled(), true);

    const firstTile = await firstImage.getTile(0, 0);
    assert.equal(firstTile?.bytes.byteLength, 511);
  });

  it('should read big tiff', async () => {
    const source = new TestFileSource(new URL('../../data/big_cog.tiff', import.meta.url));
    const tiff = new Tiff(source);

    await tiff.init();

    assert.equal(tiff.isLittleEndian, true);
    assert.equal(tiff.version, TiffVersion.BigTiff);
    assert.equal(tiff.images[0].epsg, null);
    validate(tiff);

    const [byteCounts, tileOffsets] = await Promise.all([
      tiff.images[0].fetch(TiffTag.TileByteCounts),
      tiff.images[0].fetch(TiffTag.TileOffsets),
    ]);

    assert.deepEqual([...(byteCounts ?? [])], [196608]);
    assert.deepEqual([...(tileOffsets ?? [])], [272]);
  });

  it('should fail reading a empty byte tiff', async () => {
    const source = new SourceMemory(Buffer.from(''));
    const tiff = new Tiff(source);
    const ret = await tiff.init().catch((e) => String(e));
    assert.equal(String(ret), 'Error: Unable to read empty tiff');
  });

  it('should read tiff', async () => {
    const source = new TestFileSource(new URL('../../data/cog.tiff', import.meta.url));
    const tiff = new Tiff(source);

    await tiff.init();

    assert.equal(tiff.isLittleEndian, true);
    assert.equal(tiff.version, TiffVersion.Tiff);
    assert.equal(tiff.images[0].epsg, null);

    validate(tiff);

    const [firstTif] = tiff.images;
    assert.equal(firstTif.compression, TiffMimeType.Jpeg);
  });

  it('should allow multiple init', async () => {
    const source = new TestFileSource(new URL('../../data/cog.tiff', import.meta.url));
    const tiff = new Tiff(source);

    assert.equal(tiff.isInitialized, false);
    await tiff.init();
    assert.equal(tiff.isInitialized, true);
    assert.equal(tiff.images.length, 5);

    assert.equal(tiff.isInitialized, true);
    await tiff.init();
    assert.equal(tiff.images.length, 5);
  });

  it('should read the byte count array if it is loaded', async () => {
    const source = new TestFileSource(new URL('../../data/rgba8_cog.tiff', import.meta.url));
    const fetchSize = 16 * 1024;

    const tiff = new Tiff(source);
    tiff.defaultReadSize = fetchSize;
    await tiff.init();

    assert.equal(source.fetches.length, 1);
    assert.equal(source.fetches[0].length, fetchSize);

    const img = tiff.images[0];
    const byteCounts = img.tags.get(TiffTag.TileByteCounts) as TagOffset;
    const tileOffsets = img.tags.get(TiffTag.TileOffsets) as TagOffset;
    assert.equal(source.fetches.length, 1);

    assert.equal(byteCounts.type, 'offset');
    assert.equal(byteCounts.isLoaded, true);

    assert.equal(tileOffsets.type, 'offset');
    assert.equal(tileOffsets.isLoaded, true);

    const tile = await img.getTile(0, 0);
    assert.equal(tile?.bytes.byteLength, byteCounts.value[0]);
    assert.equal(source.fetches.length, 2);
    assert.deepEqual(source.fetches[1], { offset: tileOffsets.value[0], length: byteCounts.value[0] });

    // force the offset to be unloaded
    byteCounts.isLoaded = false;
    const oldValue = byteCounts.value;
    byteCounts.value = [];
    const tileB = await img.getTile(0, 0);
    assert.equal(tileB?.bytes.byteLength, oldValue[0]);
    assert.equal(source.fetches.length, 4);

    // Read the tile offset then the tile
    assert.deepEqual(source.fetches[2], { offset: tileOffsets.value[0] - 4, length: 4 });
    assert.deepEqual(source.fetches[3], { offset: tileOffsets.value[0], length: oldValue[0] });
  });

  it('should read the byte count array if it is loaded (BigTiff)', async () => {
    const source = new TestFileSource(new URL('../../data/rgba8_cog_big.tiff', import.meta.url));
    const fetchSize = 16 * 1024;

    const tiff = new Tiff(source);
    tiff.defaultReadSize = fetchSize;
    await tiff.init();

    assert.equal(source.fetches.length, 1);
    assert.equal(source.fetches[0].length, fetchSize);

    const img = tiff.images[0];
    const byteCounts = img.tags.get(TiffTag.TileByteCounts) as TagOffset;
    const tileOffsets = img.tags.get(TiffTag.TileOffsets) as TagOffset;
    assert.equal(source.fetches.length, 1);

    assert.equal(byteCounts.type, 'offset');
    assert.equal(byteCounts.isLoaded, true);
    assert.equal(byteCounts.view == null, true);

    assert.equal(tileOffsets.type, 'offset');
    assert.equal(tileOffsets.isLoaded, false);
    assert.equal(tileOffsets.view == null, false);

    const tile = await img.getTile(0, 0);
    assert.equal(tile?.bytes.byteLength, byteCounts.value[0]);
    assert.equal(source.fetches.length, 2);
    assert.deepEqual(source.fetches[1], { offset: tileOffsets.value[0], length: byteCounts.value[0] });

    // force the offset to be unloaded
    byteCounts.isLoaded = false;
    const oldValue = byteCounts.value;
    byteCounts.value = [];
    byteCounts.view = undefined;
    const tileB = await img.getTile(0, 0);
    assert.equal(tileB?.bytes.byteLength, oldValue[0]);
    assert.equal(source.fetches.length, 4);
    // Read the tile offset then the tile
    assert.deepEqual(source.fetches[2], { offset: tileOffsets.value[0] - 4, length: 4 });
    assert.deepEqual(source.fetches[3], { offset: tileOffsets.value[0], length: oldValue[0] });
  });

  it('should read ifds from anywhere in the file', async () => {
    const source = new TestFileSource(new URL('../../data/DEM_BS28_2016_1000_1141.tif', import.meta.url));
    const tiff = await Tiff.create(source);

    assert.equal(tiff.images.length, 1);
    const im = tiff.images[0];

    assert.equal(im.isGeoTagsLoaded, true);
    assert.equal(im.epsg, 2193);
    assert.equal(im.compression, TiffMimeType.None);
    assert.equal(im.isTiled(), false);

    // 32 bit float DEM
    assert.deepEqual(im.value(TiffTag.BitsPerSample), [32]);
    assert.deepEqual(im.value(TiffTag.SampleFormat), [SampleFormat.Float]);
    assert.equal(im.value(TiffTag.Photometric), Photometric.MinIsBlack);

    assert.equal(im.value(TiffTag.GdalNoData), '-9999');
    assert.equal(im.noData, -9999);

    assert.equal(im.valueGeo(TiffTagGeo.GTCitationGeoKey), 'NZGD2000 / New Zealand Transverse Mercator 2000');
    assert.equal(im.valueGeo(TiffTagGeo.GeodeticCitationGeoKey), 'NZGD2000');

    const stripCount = await im.fetch(TiffTag.StripByteCounts);
    assert.deepEqual([...(stripCount ?? [])], [8064, 8064, 8064, 8064, 8064, 8064, 8064, 5040]);
  });

  it('should read sub array ifds', async () => {
    const source = new TestFileSource(
      new URL('../../data/east_coast_phase3_2023_AY31_1000_3335.tif.gz', import.meta.url),
    );
    const tiff = await Tiff.create(source);

    assert.equal(tiff.images.length, 5);
    const im = tiff.images[0];

    assert.equal(im.isGeoTagsLoaded, true);
    assert.equal(im.epsg, 2193);
    assert.equal(im.compression, TiffMimeType.Lzw);
    assert.deepEqual(im.size, { width: 9600, height: 14400 });
    assert.deepEqual(im.value(TiffTag.BitsPerSample), [8, 8, 8, 8]);

    const geoTags = [...im.tagsGeo.keys()].map((key) => TiffTagGeo[key]);
    assert.deepEqual(geoTags, [
      'GTModelTypeGeoKey',
      'GTRasterTypeGeoKey',
      'GTCitationGeoKey',
      'GeodeticCRSGeoKey',
      'GeogAngularUnitsGeoKey',
      'EllipsoidGeoKey',
      'EllipsoidSemiMajorAxisGeoKey',
      'EllipsoidSemiMinorAxisGeoKey',
      'EllipsoidInvFlatteningGeoKey',
      'GeogTOWGS84GeoKey',
      'ProjectedCRSGeoKey',
      'ProjectedCitationGeoKey',
      'ProjLinearUnitsGeoKey',
    ]);

    assert.deepEqual(im.valueGeo(TiffTagGeo.GeogTOWGS84GeoKey), [0, 0, 0, 0, 0, 0, 0]);
  });

  it('should allow invalid compression', async () => {
    const source = new TestFileSource(new URL('../../data/cog.tiff', import.meta.url));
    const tiff = await Tiff.create(source);

    // Overwrite the loaded compression type to a invalid value
    tiff.images[0].tags.get(TiffTag.Compression)!.value = -1;

    const tile = await tiff.images[0].getTile(0, 0);
    assert.deepEqual(tile?.mimeType, 'application/octet-stream');
  });

  it('should load small tiffs', async () => {
    const cogSourceFile = new URL('../../data/rgba8_tiled.tiff', import.meta.url);

    const buf = await readFile(cogSourceFile);
    const source = new SourceMemory(buf);

    const tiff = await Tiff.create(source);
    assert.equal(tiff.images.length, 5);
    assert.equal(tiff.images[0].epsg, 3857);

    const [byteCounts, tileOffsets] = await Promise.all([
      tiff.images[0].fetch(TiffTag.TileByteCounts),
      tiff.images[0].fetch(TiffTag.TileOffsets),
    ]);

    assert.deepEqual([...(byteCounts ?? [])], [64, 64, 68, 64, 64, 68, 64, 64, 68, 64, 64, 64, 64, 64, 64, 68]);
    assert.deepEqual(
      [...(tileOffsets ?? [])],
      [797, 861, 925, 993, 1057, 1121, 1189, 1253, 1317, 1385, 1449, 1513, 1577, 1641, 1705, 1769],
    );
  });
  
  it('should load a file with a model transformation tag', async () => {
    const cogSourceFile = new URL('../../data/model_transformation.tif', import.meta.url);

    const buf = await readFile(cogSourceFile);
    const source = new SourceMemory(buf);

    const tiff = await Tiff.create(source);
    assert.equal(tiff.images.length, 1);
  });
});
