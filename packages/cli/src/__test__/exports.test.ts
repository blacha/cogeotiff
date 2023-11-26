import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  AngularUnit,
  Compression,
  LinearUnit,
  OldSubFileType,
  Orientation,
  Photometric,
  PlanarConfiguration,
  RasterTypeKey,
  SampleFormat,
  SubFileType,
} from '@cogeotiff/core';

// Ensure the tag constants are exported
describe('Exports', () => {
  it('should export constants', () => {
    assert.equal(Photometric.Rgb, 2);
    assert.equal(SampleFormat.Float, 3);
    assert.equal(RasterTypeKey.PixelIsArea, 1);
    assert.equal(SubFileType.ReducedImage, 1);
    assert.equal(OldSubFileType.ReducedImage, 2);
    assert.equal(Compression.Lzw, 5);
    assert.equal(AngularUnit.Degree, 9102);
    assert.equal(LinearUnit.Metre, 9001);
    assert.equal(PlanarConfiguration.Contig, 1);
    assert.equal(Orientation.TopLeft, 1);
  });
});
