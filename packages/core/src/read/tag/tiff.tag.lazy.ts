import { CogSource } from '../../source/cog.source';
import { CogSourceView } from '../../source/cog.source.view';
import { Fetchable } from '../../util/util.fetchable';
import { CogTiffTagBase } from './tiff.tag.base';

export class CogTiffTagLazy<T> extends CogTiffTagBase<T> {
    private fetchable: Fetchable<T>;
    constructor(tagId: number, source: CogSource, offset: number, view: CogSourceView) {
        super(tagId, source, offset, view);
        this.fetchable = new Fetchable(this.loadValueFromPtr.bind(this));
    }

    async loadValueFromPtr() {
        await this.source.loadBytes(this.valuePointer, this.dataLength);
        return this.readValue();
    }

    get isReady() {
        return this.fetchable.value != null;
    }

    get value() {
        return this.fetchable.value;
    }

    fetch() {
        return this.fetchable.fetch();
    }
}
