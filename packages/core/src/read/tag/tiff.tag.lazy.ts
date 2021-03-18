import { LogType } from '@cogeotiff/chunk';
import { CogTiffTagBase } from './tiff.tag.base';

export class CogTiffTagLazy<T> extends CogTiffTagBase<T> {
    value: T | null = null;

    get isReady(): boolean {
        return this.value != null;
    }

    async fetch(l?: LogType): Promise<T> {
        if (this.tiff.source.hasBytes(this.valuePointer, this.dataLength) === false) {
            await this.tiff.source.loadBytes(this.valuePointer, this.dataLength, l);
        }
        this.value = await this.readValue();
        return this.value;
    }
}
