import { CogTiffTagBase } from './tiff.tag.base.js';

export class CogTiffTagLazy<T> extends CogTiffTagBase<T> {
    value: T | null = null;

    get isReady(): boolean {
        return this.value != null;
    }

    async fetch(): Promise<T> {
        if (this.tiff.source.hasBytes(this.valuePointer, this.dataLength) === false) {
            await this.tiff.source.loadBytes(this.valuePointer, this.dataLength);
        }
        this.value = this.readValue();
        return this.value;
    }
}
