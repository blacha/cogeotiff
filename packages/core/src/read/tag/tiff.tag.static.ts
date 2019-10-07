import { CogSource } from '../../source/cog.source';
import { CogSourceView } from '../../source/cog.source.view';
import { CogTiffTagBase } from './tiff.tag.base';

export class CogTifTagStatic<T> extends CogTiffTagBase<T> {
    _isRead: boolean = false;
    _value: T | null = null;

    constructor(tagId: number, source: CogSource, offset: number, view: CogSourceView) {
        super(tagId, source, offset, view);
    }

    /** Lazy read the inline tiff tags */
    get value() {
        if (this._isRead == false) {
            this._value = this.readValue();
            this._isRead = true;
        }
        return this._value;
    }
}
