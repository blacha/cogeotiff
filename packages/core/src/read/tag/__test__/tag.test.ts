// import { TestFileChunkSource } from '@chunkd/core/build/__test__/chunk.source.fake.js';
// import { promises as fs } from 'fs';
// import assert from 'node:assert';
// import { describe, it } from 'node:test';
// import { CogTiff } from '../../../cog.tiff.js';
// import { CogSource } from '../../../source.js';
// import { CogTiffTagLazy } from '../tiff.tag.lazy.js';

// export class TestFileSource implements CogSource {
//     url: URL;

//     constructor(fileName: URL) {
//         this.url = fileName;
//     }
//     async fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
//         const fileData = await fs.readFile(this.url);
//         return fileData.buffer.slice(fileData.byteOffset + offset, fileData.byteOffset + offset + length);
//     }

//     get size(): Promise<number> {
//         return Promise.resolve()
//             .then(() => fs.stat(this.url))
//             .then((f) => f.size);
//     }
// }

// describe('TiffTag', () => {
//     const cogSourceFile = new TestFileSource(new URL('../../../../../data/rgba8_tiled.tiff', import.meta.url));
//     it('should load lazy tags', async () => {
//         const tiff = new CogTiff(cogSourceFile);

//         await cogSourceFile.fetchBytes(3680, 8);
//         const lazy = new CogTiffTagLazy(339, tiff, 3680);
//         assert.equal(lazy.value, null);

//         const res = await lazy.fetch();
//         assert.deepEqual(res, [18761, 43, 8, 0]);
//         assert.deepEqual(lazy.value, res);
//     });
// });
