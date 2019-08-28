import { CogSource } from '../../source/cog.source';
import { CogSourceView } from '../../source/cog.source.view';
import { CogTiffTagBase } from './tiff.tag.base';

export class CogTifTagStatic<T> extends CogTiffTagBase<T> {
    value: T | null = null;

    constructor(source: CogSource, offset: number, view: CogSourceView) {
        super(source, offset, view);
        if (this.hasBytes) {
            this.value = this.readValue();
        }
    }
}
