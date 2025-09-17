import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { TestFileSource } from '../__benchmark__/source.file.js';
import { SourceMemory } from '../__benchmark__/source.memory.js';
import { TiffMimeType } from '../const/tiff.mime.js';
import { Photometric, SampleFormat } from '../const/tiff.tag.id.js';
import { TiffVersion } from '../const/tiff.version.js';
import { TiffTag, TiffTagGeo } from '../index.js';
import { Tiff } from '../tiff.js';

function validate(tif: Tiff): void {
  assert.equal(tif.images.length, 5);

  const [firstTif] = tif.images;
  assert.equal(firstTif.isTiled(), true);
  assert.deepEqual(firstTif.tileSize, { width: 256, height: 256 });
  assert.deepEqual(firstTif.size, { width: 64, height: 64 });
}

describe('CogRead', () => {
  it('should read big endian', async () => {
    const source = new TestFileSource(new URL('../../data/big.endian.tiff', import.meta.url));
    const tiff = new Tiff(source);

    await tiff.init();

    assert.equal(tiff.isLittleEndian, false);
    assert.equal(tiff.version, TiffVersion.Tiff);
    assert.equal(tiff.images.length, 1);
    const firstImage = tiff.images[0]

    assert.equal(firstImage.compression, 'application/zstd')
    assert.equal(firstImage.isTiled(), true)

    const firstTile = await firstImage.getTile(0,0)
    assert.equal(firstTile?.bytes.byteLength, 511)
  });

  it('should read big tiff', async () => {
    const source = new TestFileSource(new URL('../../data/big_cog.tiff', import.meta.url));
    const tiff = new Tiff(source);

    await tiff.init();

    assert.equal(tiff.isLittleEndian, true);
    assert.equal(tiff.version, TiffVersion.BigTiff);
    assert.equal(tiff.images[0].epsg, null);
    validate(tiff);
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
    assert.deepEqual(await im.fetch(TiffTag.StripByteCounts), [8064, 8064, 8064, 8064, 8064, 8064, 8064, 5040]);
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
  });
});
