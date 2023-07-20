import { promises as fs } from 'fs';
import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { TestFileSource } from '../__benchmark__/source.file.js';
import { SourceMemory } from '../__benchmark__/source.memory.js';
import { ByteSize } from '../util/bytes.js';
import { CogTiff } from '../cog.tiff.js';
import { TiffMimeType } from '../const/tiff.mime.js';

// 900913 properties.
const A = 6378137.0;
const InitialResolution = (2 * Math.PI * A) / 256;

function getResolution(zoom: number): number {
  return InitialResolution / 2 ** zoom;
}

describe('CogTiled', () => {
  const cogSourceFile = new TestFileSource(new URL('../../data/rgba8_tiled.tiff', import.meta.url));
  const cog = new CogTiff(cogSourceFile);

  beforeEach(() => cog.init());

  it('should match resolutions to web mercator zoom levels', () => {
    for (let i = 0; i < 14; i++) {
      assert.equal(cog.getImageByResolution(getResolution(i)).id, 4);
    }

    assert.equal(cog.getImageByResolution(getResolution(14)).id, 3);
    assert.equal(cog.getImageByResolution(getResolution(15)).id, 2);
    assert.equal(cog.getImageByResolution(getResolution(16)).id, 1);
    assert.equal(cog.getImageByResolution(getResolution(17)).id, 0);
    assert.equal(cog.getImageByResolution(getResolution(18)).id, 0);

    for (let i = 19; i < 32; i++) {
      assert.equal(cog.getImageByResolution(getResolution(i)).id, 0);
    }
  });

  it('should get origin from all images', () => {
    const baseOrigin = cog.images[0].origin;
    for (const img of cog.images) {
      assert.deepEqual(img.origin, baseOrigin);
    }
  });

  it('should get bounding box from all images', () => {
    const baseOrigin = cog.images[0].bbox;
    for (const img of cog.images) {
      assert.deepEqual(img.bbox, baseOrigin);
    }
  });

  it('should be geolocated', () => {
    for (const img of cog.images) assert.equal(img.isGeoLocated, true);
  });

  it('should scale image resolution for all images', () => {
    const [resX, resY, resZ] = cog.images[0].resolution;
    for (let i = 0; i < cog.images.length; i++) {
      const img = cog.images[i];
      const scale = 2 ** i; // This tiff is scaled at a factor of two per zoom level
      assert.deepEqual(img.resolution, [resX * scale, resY * scale, resZ]);
    }
  });

  it('should have tile information', () => {
    const [firstImage] = cog.images;
    assert.equal(firstImage.stripCount, 0);
    assert.equal(firstImage.isTiled(), true);
  });

  it('should hasTile for every tile', async () => {
    const [firstImage] = cog.images;

    for (let x = 0; x < firstImage.tileCount.x; x++) {
      for (let y = 0; y < firstImage.tileCount.y; y++) {
        assert.equal(await firstImage.hasTile(x, y), true);
      }
    }
  });
});

describe('Cog.Big', () => {
  it('should support reading from memory', async () => {
    const fullSource = new TestFileSource(new URL('../../data/sparse.tiff', import.meta.url));

    const cog = new CogTiff(fullSource);
    await cog.init();

    const [firstImage] = cog.images;
    assert.equal(firstImage.stripCount, 0);
    assert.equal(firstImage.isTiled(), true);

    const img = cog.images[4];
    assert.deepEqual(img.tileCount, { x: 2, y: 2 });
  });

  it('should read using a memory source', async () => {
    const bytes = await fs.readFile(new URL('../../data/sparse.tiff', import.meta.url));
    const source = new SourceMemory(bytes.buffer);
    const cog = new CogTiff(source);
    await cog.init();

    const [firstImage] = cog.images;
    assert.equal(firstImage.stripCount, 0);
    assert.equal(firstImage.isTiled(), true);

    const img = cog.images[4];
    assert.deepEqual(img.tileCount, { x: 2, y: 2 });
  });
});

describe('Cog.Sparse', () => {
  const cogSourceFile = new TestFileSource(new URL('../../data/sparse.tiff', import.meta.url));
  const cog = new CogTiff(cogSourceFile);

  it('should read metadata', async () => {
    await cog.init();
    assert.equal(cog.images[0].epsg, 2193);
  });

  it('should be geolocated', () => {
    for (const img of cog.images) assert.equal(img.isGeoLocated, true);
  });

  it('should support sparse cogs', async () => {
    const z = 4;
    const img = cog.images[z];

    const { tileCount } = img;
    assert.deepEqual(tileCount, { x: 2, y: 2 });

    for (let x = 0; x < tileCount.x; x++) {
      for (let y = 0; y < tileCount.y; y++) {
        const hasTile = await img.hasTile(x, y);
        assert.equal(hasTile, false);
        const tileXy = await img.getTile(x, y);
        const tileXyz = await cog.images[z].getTile(x, y);
        assert.equal(tileXy, null, `Tile x:${x} y:${y} should be empty`);
        assert.equal(tileXyz, null, `Tile x:${x} y:${y} z: ${z} should be empty`);
      }
    }
  });

  it('should have ghost options', () => {
    assert.equal(cog.options?.options.size, 6);
    assert.equal(cog.options?.tileLeaderByteSize, ByteSize.UInt32);
    assert.equal(cog.options?.isCogOptimized, true);

    const entries = [...(cog.options?.options.entries() ?? [])];
    assert.deepEqual(entries, [
      ['GDAL_STRUCTURAL_METADATA_SIZE', '000140 bytes'],
      ['LAYOUT', 'IFDS_BEFORE_DATA'],
      ['BLOCK_ORDER', 'ROW_MAJOR'],
      ['BLOCK_LEADER', 'SIZE_AS_UINT4'],
      ['BLOCK_TRAILER', 'LAST_4_BYTES_REPEATED'],
      ['KNOWN_INCOMPATIBLE_EDITION', 'NO'],
    ]);
  });
});

describe('CogStrip', () => {
  const cogSourceFile = new TestFileSource(new URL('../../data/rgba8_strip.tiff', import.meta.url));
  const cog = new CogTiff(cogSourceFile);

  beforeEach(() => cog.init());

  it('should get origin from all images', () => {
    const baseOrigin = cog.images[0].origin;
    for (const img of cog.images) {
      assert.deepEqual(img.origin, baseOrigin);
    }
  });

  it('should get bounding box from all images', () => {
    const baseOrigin = cog.images[0].bbox;
    for (const img of cog.images) {
      assert.deepEqual(img.bbox, baseOrigin);
    }
  });

  it('should scale image resolution for all images', () => {
    const [resX, resY, resZ] = cog.images[0].resolution;
    for (let i = 0; i < cog.images.length; i++) {
      const img = cog.images[i];
      const scale = 2 ** i; // This tiff is scaled at a factor of two per zoom level
      assert.deepEqual(img.resolution, [resX * scale, resY * scale, resZ]);
    }
  });

  it('should have strip information', async () => {
    const [firstImage] = cog.images;
    assert.equal(firstImage.isTiled(), false);
    assert.equal(firstImage.stripCount, 2);

    const stripA = await firstImage.getStrip(0);
    assert.equal(stripA?.mimeType, TiffMimeType.Webp);
    assert.equal(stripA?.bytes.byteLength, 152);

    const stripB = await firstImage.getStrip(1);
    assert.equal(stripB?.mimeType, TiffMimeType.Webp);
    assert.equal(stripB?.bytes.byteLength, 152);
  });
});
