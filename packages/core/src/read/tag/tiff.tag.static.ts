import { CogTiffTagBase } from './tiff.tag.base.js';

export class CogTifTagStatic<T> extends CogTiffTagBase<T> {
    _isRead = false;
    _value: T | null = null;

    /** Lazy read the inline tiff tags */
    get value(): T {
        if (this._isRead === false) {
            this._value = this.readValue();
            this._isRead = true;
        }
        return this._value!;
    }
}
