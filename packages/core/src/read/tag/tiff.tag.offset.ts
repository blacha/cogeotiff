import { CogSource, getTiffTagValueReader } from '../..';
import { CogSourceView } from '../../source/cog.source.view';
import { CogTiffTagBase } from './tiff.tag.base';

/**
 * TiffTag for offset arrays
 *
 * Allows individual access to specific records without having to read the entire tag in.
 */
export class CogTiffTagOffset extends CogTiffTagBase<number[]> {
    private loadedValues: number[] | null = null;

    constructor(tagId: number, source: CogSource, offset: number, view: CogSourceView) {
        super(tagId, source, offset, view);
    }

    get value(): number[] | null {
        if (this.loadedValues != null) {
            return this.loadedValues;
        }

        if (this.hasBytes) {
            this.readValue();
            return this.loadedValues;
        }

        return null;
    }

    /** Load the entire index into memory */
    async load() {
        await this.source.loadBytes(this.valuePointer, this.dataCount);
        this.readValue();
    }

    readValue() {
        const val = super.readValue();
        // if only one value is read in, it will not be returned as a array
        if (typeof val === 'number') {
            this.loadedValues = [val];
        } else {
            this.loadedValues = val;
        }
        return this.loadedValues;
    }

    /**
     * Read a specific value from the offset array
     * @param index index to read at
     */
    async getValueAt(index: number): Promise<number> {
        if (this.loadedValues) {
            return this.loadedValues[index];
        }

        const dataSize = this.dataTypeSize;
        const valueOffset = this.valuePointer + dataSize * index;
        const convert = getTiffTagValueReader(this.dataType);

        if (!this.source.hasBytes(valueOffset, dataSize)) {
            await this.source.loadBytes(valueOffset, dataSize);
        }
        return convert(this.source, valueOffset) as number;
    }
}
