import { Fetchable } from '@cogeotiff/fetchable';
import { CogTiff } from '../../cog.tiff';
import { CogTiffTagBase } from './tiff.tag.base';

export class CogTiffTagLazy<T> extends CogTiffTagBase<T> {
    private fetchable: Fetchable<T>;
    constructor(tagId: number, tiff: CogTiff, offset: number) {
        super(tagId, tiff, offset);
        this.fetchable = new Fetchable(this.loadValueFromPtr);
    }

    loadValueFromPtr = async (): Promise<T> => {
        await this.tiff.source.loadBytes(this.valuePointer, this.dataLength);
        return this.readValue();
    };

    get isReady(): boolean {
        return this.fetchable.value != null;
    }

    get value(): T | null {
        return this.fetchable.value;
    }

    fetch(): Promise<T> {
        return this.fetchable.fetch();
    }
}
