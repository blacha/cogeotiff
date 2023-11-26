import assert from 'node:assert';
import { describe, it } from 'node:test';

import { TestFileSource } from '../__benchmark__/source.file.js';
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
  // TODO this does not load 100% yet
  // it('should read big endian', async () => {
  //     const source = new TestFileSource(new URL('../../data/big_cog.tiff', import.meta.url));
  //     const tiff = new Tiff(source);

  //     await tiff.init();

  //     assert.equal(tiff.isLittleEndian, false);
  //     assert.equal(tiff.version, TiffVersion.BigTiff);
  //     validate(tiff);
  // });

  it('should read big tiff', async () => {
    const source = new TestFileSource(new URL('../../data/big_cog.tiff', import.meta.url));
    const tiff = new Tiff(source);

    await tiff.init();

    assert.equal(tiff.isLittleEndian, true);
    assert.equal(tiff.version, TiffVersion.BigTiff);
    validate(tiff);
  });

  it('should read tiff', async () => {
    const source = new TestFileSource(new URL('../../data/cog.tiff', import.meta.url));
    const tiff = new Tiff(source);

    await tiff.init();

    assert.equal(tiff.isLittleEndian, true);
    assert.equal(tiff.version, TiffVersion.Tiff);
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
    assert.equal(im.value(TiffTag.SampleFormat), SampleFormat.Float);
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
});
