const BUFFER_SIZE = Math.pow(2, 16) // 32kb

abstract class CogSource {
    _bytes: { buffer: Buffer, offset: number }[] = [];

    async uint16(offset: number) {
        const buff = await this.getInternalBuffer(offset, 2);
        return buff.buffer.readUInt16LE(offset - buff.offset)
    }

    async uint32(offset: number) {
        const buff = await this.getInternalBuffer(offset, 4);
        return buff.buffer.readUInt32LE(offset - buff.offset)
    }

    async getBytes(offset: number, count: number) {
        const buff = await this.getInternalBuffer(offset, 2);
        return buff.buffer.subarray(offset - buff.offset, count)
    }

    hasBytes(offset: number, count = 1) {
        for (const data of this._bytes) {
            if (offset < data.offset) {
                continue;
            }
            if (offset + count > data.offset + data.buffer.length) {
                continue;
            }
            return true;
        }
        return false;
    }

    // TODO will cause errors if fetching at edge of range
    protected async getInternalBuffer(offset: number, count: number) {
        for (const data of this._bytes) {
            if (offset < data.offset) {
                continue;
            }
            if (offset + count > data.offset + data.buffer.length) {
                continue;
            }
            return data;
        }
        const buffer = await this.fetchBytes(offset, BUFFER_SIZE);
        const node = { buffer, offset };
        this._bytes.push(node)
        return node;
    }

    protected abstract fetchBytes(offset: number, length: number): Promise<Buffer>
}
