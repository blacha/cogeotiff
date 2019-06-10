import { TIFF_TAG_TYPE } from "./tif";

const BUFFER_SIZE = Math.pow(2, 16) // 32kb

export interface CogSourceBuffer {
    buffer: DataView;
    offset: number;
}
export abstract class CogSource {
    // TODO this is not really a great way of storing a sparse Buffer
    // Should refactor this to be a better buffer, it will often have duplicate data in
    _bytes: CogSourceBuffer[] = [];
    isLittleEndian = true;

    /** Read a UInt16 at the offset */
    async uint16(offset: number) {
        const buff = await this.getInternalBuffer(offset, 2);
        return this.uint16Sync(offset, buff);
    }
    /** Read a UInt32 at the offset */
    async uint32(offset: number) {
        const buff = await this.getInternalBuffer(offset, 4);
        return this.uint32Sync(offset, buff);
    }
    uint32Sync(offset: number, buff: CogSourceBuffer) {
        return buff.buffer.getUint32(offset - buff.offset, this.isLittleEndian)
    }
    uint16Sync(offset: number, buff: CogSourceBuffer) {
        return buff.buffer.getUint16(offset - buff.offset, this.isLittleEndian);

    }
    uint8Sync(offset: number, buff: CogSourceBuffer) {
        return buff.buffer.getUint8(offset - buff.offset)
    }

    /** Read a array of bytes at the offset */
    async getBytes(offset: number, count: number) {
        const buff = await this.getInternalBuffer(offset, count);
        const startOffset = offset - buff.offset;
        return buff.buffer.buffer.slice(startOffset, startOffset + count)
    }

    async readType(rawOffset: number, type: TIFF_TAG_TYPE, count: number): Promise<number | number[] | number[][]> {
        const fieldLength = CogSource.getFieldLength(type);
        const fieldSize = fieldLength * count;
        const buff = await this.getInternalBuffer(rawOffset, fieldSize);

        let convert = null;
        switch (type) {
            case TIFF_TAG_TYPE.BYTE:
            case TIFF_TAG_TYPE.ASCII:
            case TIFF_TAG_TYPE.UNDEFINED:
            case TIFF_TAG_TYPE.SBYTE:
                convert = offset => this.uint8Sync(rawOffset + offset, buff)
                break;

            case TIFF_TAG_TYPE.SHORT:
            case TIFF_TAG_TYPE.SSHORT:
                convert = offset => this.uint16Sync(rawOffset + offset, buff)
                break;

            case TIFF_TAG_TYPE.LONG:
            case TIFF_TAG_TYPE.SLONG:
                convert = offset => this.uint32Sync(rawOffset + offset, buff)
                break;

            case TIFF_TAG_TYPE.RATIONAL:
            case TIFF_TAG_TYPE.SRATIONAL:
                convert = (offset: number) => [
                    this.uint32Sync(rawOffset + offset, buff),
                    this.uint32Sync(rawOffset + offset + 4, buff)
                ]
                break;

            default:
                throw new Error(`Unknown read type "${type}"`)
        }

        const output = [];
        if (convert == null) {
            throw new Error(`Unknown read type "${type}"`)
        }

        for (let i = 0; i < fieldSize; i += fieldLength) {
            output.push(convert(i));
        }
        if (count == 1) {
            return output[0];
        }

        return output;
    }

    static getFieldLength(fieldType: TIFF_TAG_TYPE) {
        switch (fieldType) {
            case TIFF_TAG_TYPE.BYTE: case TIFF_TAG_TYPE.ASCII: case TIFF_TAG_TYPE.SBYTE: case TIFF_TAG_TYPE.UNDEFINED:
                return 1;
            case TIFF_TAG_TYPE.SHORT: case TIFF_TAG_TYPE.SSHORT:
                return 2;
            case TIFF_TAG_TYPE.LONG: case TIFF_TAG_TYPE.SLONG: case TIFF_TAG_TYPE.FLOAT:
                return 4;
            case TIFF_TAG_TYPE.RATIONAL: case TIFF_TAG_TYPE.SRATIONAL: case TIFF_TAG_TYPE.DOUBLE:
            case TIFF_TAG_TYPE.LONG8: case TIFF_TAG_TYPE.SLONG8: case TIFF_TAG_TYPE.IFD8:
                return 8;
            default:
                throw new Error(`Invalid field type: "${fieldType}"`);
        }
    }

    /** Check if the number of bytes has been chached so far */
    hasBytes(offset: number, count = 1) {
        for (const data of this._bytes) {
            if (offset < data.offset) {
                continue;
            }
            if (offset + count > data.offset + data.buffer.byteLength) {
                continue;
            }
            return true;
        }
        return false;
    }

    protected async getInternalBuffer(offset: number, count: number): Promise<CogSourceBuffer> {
        for (const data of this._bytes) {
            if (offset < data.offset) {
                continue;
            }
            if (offset + count > data.offset + data.buffer.byteLength) {
                continue;
            }
            return data;
        }
        const buffer = await this.fetchBytes(offset, Math.max(count, BUFFER_SIZE));
        const node = { buffer: new DataView(buffer), offset };
        this._bytes.push(node)
        return node;
    }

    protected abstract fetchBytes(offset: number, length: number): Promise<ArrayBuffer>
}
