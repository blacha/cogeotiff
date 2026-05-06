import assert from 'node:assert';
import { describe, it } from 'node:test';

import { TestFileSource } from '../__benchmark__/source.file.js';
import { Tiff } from '../tiff.js';

describe('TiffImage.getTiles', () => {
  it('returns [] for empty input and makes no fetches', async () => {
    const source = new TestFileSource(new URL('../../data/rgba8_tiled.tiff', import.meta.url));
    const tiff = await Tiff.create(source);
    const initialFetches = source.fetches.length;

    const result = await tiff.images[0].getTiles([]);

    assert.deepEqual(result, []);
    assert.equal(source.fetches.length, initialFetches);
  });

  it('returns bytes equivalent to per-tile getTile for every tile', async () => {
    const source = new TestFileSource(new URL('../../data/rgba8_tiled.tiff', import.meta.url));
    const tiff = await Tiff.create(source);
    const img = tiff.images[0];

    const coords: { x: number; y: number }[] = [];
    for (let y = 0; y < img.tileCount.y; y++) {
      for (let x = 0; x < img.tileCount.x; x++) coords.push({ x, y });
    }
    assert.ok(coords.length > 1, `fixture must have >1 tile to exercise getTiles, got ${coords.length}`);

    const expected = await Promise.all(coords.map((c) => img.getTile(c.x, c.y)));
    const actual = await img.getTiles(coords);

    assert.equal(actual.length, expected.length);
    for (let i = 0; i < actual.length; i++) {
      assert.equal(actual[i]?.mimeType, expected[i]?.mimeType);
      assert.equal(actual[i]?.compression, expected[i]?.compression);
      assert.deepEqual(new Uint8Array(actual[i]!.bytes), new Uint8Array(expected[i]!.bytes), `tile ${i} bytes differ`);
    }
  });

  it('prepends JPEG header for JPEG-compressed tiles, matching getTile', async () => {
    // cog.tiff is JPEG-compressed. image[0] has only one tile (1×1) but that is
    // sufficient to verify the JPEG-header path runs through getTiles.
    const source = new TestFileSource(new URL('../../data/cog.tiff', import.meta.url));
    const tiff = await Tiff.create(source);
    const img = tiff.images[0];

    const expected = await img.getTile(0, 0);
    const [actual] = await img.getTiles([{ x: 0, y: 0 }]);

    assert.ok(expected != null && actual != null);
    assert.equal(actual.mimeType, expected.mimeType);
    assert.equal(actual.compression, expected.compression);
    assert.deepEqual(new Uint8Array(actual.bytes), new Uint8Array(expected.bytes));
  });

  it('throws on out-of-range tile coordinates', async () => {
    const source = new TestFileSource(new URL('../../data/rgba8_tiled.tiff', import.meta.url));
    const tiff = await Tiff.create(source);
    const img = tiff.images[0];

    await assert.rejects(() => img.getTiles([{ x: img.tileCount.x, y: 0 }]), /Tile index is outside of range/);
    await assert.rejects(() => img.getTiles([{ x: 0, y: img.tileCount.y }]), /Tile index is outside of range/);
  });

  it('throws when called on an untiled image', async () => {
    const source = new TestFileSource(new URL('../../data/model_transformation.tif', import.meta.url));
    const tiff = await Tiff.create(source);
    const img = tiff.images[0];
    assert.equal(img.isTiled(), false);

    await assert.rejects(() => img.getTiles([{ x: 0, y: 0 }]), /Tiff is not tiled/);
  });

  it('returns null for sparse tiles', async () => {
    const source = new TestFileSource(new URL('../../data/sparse.tiff', import.meta.url));
    const tiff = await Tiff.create(source);
    const img = tiff.images[4];
    assert.deepEqual(img.tileCount, { x: 2, y: 2 });

    const result = await img.getTiles([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);

    assert.equal(result.length, 4);
    for (const r of result) assert.equal(r, null);
  });

  it('uses source.fetchRanges when the source implements it', async () => {
    const inner = new TestFileSource(new URL('../../data/rgba8_tiled.tiff', import.meta.url));

    let fetchRangesCalls = 0;
    let lastFetchRangesArgs: { offset: number; length: number }[] = [];
    const wrapping = {
      url: inner.url,
      fetch: inner.fetch.bind(inner),
      async fetchRanges(ranges: { offset: number; length: number }[]): Promise<ArrayBuffer[]> {
        fetchRangesCalls++;
        lastFetchRangesArgs = ranges;
        return Promise.all(ranges.map((r) => inner.fetch(r.offset, r.length)));
      },
    };

    const tiff = await Tiff.create(wrapping);
    const img = tiff.images[0];

    const fetchesBefore = inner.fetches.length;
    const result = await img.getTiles([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);

    assert.equal(fetchRangesCalls, 1);
    assert.equal(lastFetchRangesArgs.length, 2);
    assert.equal(result.length, 2);
    assert.ok(inner.fetches.length - fetchesBefore >= 2);
  });

  it('coalesces adjacent tile data fetches when source has no fetchRanges', async () => {
    const fixtureUrl = new URL('../../data/rgba8_tiled.tiff', import.meta.url);

    // Baseline: per-tile getTile, count source.fetch calls in the data phase only.
    const sourceA = new TestFileSource(fixtureUrl);
    const tiffA = await Tiff.create(sourceA);
    const imgA = tiffA.images[0];

    const coords: { x: number; y: number }[] = [];
    for (let y = 0; y < imgA.tileCount.y; y++) {
      for (let x = 0; x < imgA.tileCount.x; x++) coords.push({ x, y });
    }
    assert.ok(coords.length > 1, 'fixture must have >1 tile');

    const beforeIndividual = sourceA.fetches.length;
    for (const c of coords) await imgA.getTile(c.x, c.y);
    const individualFetchCount = sourceA.fetches.length - beforeIndividual;

    // Batched: getTiles with a generous coalesce gap.
    const sourceB = new TestFileSource(fixtureUrl);
    const tiffB = await Tiff.create(sourceB);
    const imgB = tiffB.images[0];

    const beforeBatched = sourceB.fetches.length;
    const batched = await imgB.getTiles(coords, { coalesce: 1024 * 1024 });
    const batchedFetchCount = sourceB.fetches.length - beforeBatched;

    assert.equal(batched.length, coords.length);
    assert.ok(
      batchedFetchCount < individualFetchCount,
      `expected coalesced fetch count (${batchedFetchCount}) < individual (${individualFetchCount})`,
    );
  });
});
