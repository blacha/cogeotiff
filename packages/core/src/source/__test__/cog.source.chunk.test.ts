import * as o from 'ospec';
import 'source-map-support/register';
import { ByteSize } from '../../const/byte.size';
import { TiffEndian } from '../../const/tiff.endian';
import { FakeCogSource } from '../../__test__/fake.source';

// Reference uin64 from MDN
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
function getUint64(dataview: DataView, byteOffset: number, isLittleEndian: boolean) {
    // split 64-bit number into two 32-bit (4-byte) parts
    const left = dataview.getUint32(byteOffset, isLittleEndian);
    const right = dataview.getUint32(byteOffset + 4, isLittleEndian);

    // combine the two 32-bit values
    return isLittleEndian ? left + 2 ** 32 * right : 2 ** 32 * left + right;
}

o.spec('CogSourceChunk', () => {
    const CHUNK_SIZE = 10;
    let source: FakeCogSource;

    o.beforeEach(() => {
        source = new FakeCogSource();
        source.isLittleEndian = true;
        source.chunkSize = CHUNK_SIZE;
    });

    async function Chunk(id: number) {
        const cnk = source.chunk(id).fetch();
        if (cnk == null) {
            throw new Error('Failed to fetch');
        }
        return cnk;
    }

    o('should get unit8', async () => {
        const chunk = await Chunk(0);
        o(source.uint8(0)).equals(0);
        o(source.uint16(0)).equals(256);

        o(source.uint32(0)).equals(50462976);
        o(source.uint32(4)).equals(117835012);

        o(source.uint64(0)).equals(getUint64(chunk.view, 0, true));
    });

    o('should get unit8 from range', async () => {
        await Chunk(0);
        for (let i = 0; i < 10; i++) {
            o(source.uint8(i)).equals(i);
        }
    });

    o('should use chunk offset', async () => {
        await Chunk(1);
        o(source.uint8(10)).equals(10);
    });

    o('should support multiple chunks', async () => {
        await Chunk(1);
        await Chunk(2);
        await Chunk(3);

        for (let i = 10; i < source.chunkSize * 3; i++) {
            o(source.uint8(i)).equals(i);
        }
    });

    o('should fetch big endian', async () => {
        source.isLittleEndian = false;
        const chunk = await Chunk(0);
        for (let i = 0; i < source.chunkSize - 1; i++) {
            o(chunk.view.getUint16(i, source.isLittleEndian)).equals(source.uint16(i));
        }
    });

    for (const endian of [TiffEndian.BIG, TiffEndian.LITTLE]) {
        const isLittleEndian = endian === TiffEndian.LITTLE;
        const word = isLittleEndian ? 'LE' : 'BE';
        o(`should fetch uint16 (${word})`, async () => {
            source.isLittleEndian = isLittleEndian;

            const chunk = await Chunk(0);
            for (let i = 0; i < source.chunkSize - ByteSize.UInt16; i++) {
                o(chunk.view.getUint16(i, source.isLittleEndian)).equals(source.uint16(i));
            }
        });

        o(`should fetch uint32 (${word})`, async () => {
            source.isLittleEndian = isLittleEndian;

            const chunk = await Chunk(0);
            for (let i = 0; i < source.chunkSize - ByteSize.UInt32; i++) {
                o(chunk.view.getUint32(i, source.isLittleEndian)).equals(source.uint32(i));
            }
        });

        o(`should fetch uint64 (${word})`, async () => {
            source.isLittleEndian = isLittleEndian;

            const chunk = await Chunk(0);
            for (let i = 0; i < source.chunkSize - ByteSize.UInt64; i++) {
                o(getUint64(chunk.view, i, source.isLittleEndian)).equals(source.uint64(i));
            }
        });
    }

    o('should uint16 across chunks', async () => {
        source.chunkSize = 1;
        await Chunk(0);
        await Chunk(1);
        o(source.uint16(0)).equals(256);
    });

    o('should uint32 across chunks', async () => {
        source.chunkSize = 1;
        await Chunk(0);
        await Chunk(1);
        await Chunk(2);
        await Chunk(3);
        o(source.uint32(0)).equals(50462976);
    });

    o('should uint64 when numbers are close', async () => {
        source.chunkSize = 2048;
        await Chunk(31);
        // This causes chunks to be read from chunks 31.9990234375 and 32.0029296875
        // which when should be reading part from chunk 31 and chunk 32

        o(() => source.uint64(65534)).throws('Chunk:32 is not ready');

        await Chunk(32);

        o(source.uint64(65534) > 0).equals(true);
    });
});
