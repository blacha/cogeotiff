import { CogSource } from '../cog.source';
import { CogSourceView } from '../cog.source.view';
import { Fetchable } from '../util/util.fetchable';
import { getTiffTagSize, getTiffTagValueReader, TiffTag, TiffTagValueType } from './tif';

export abstract class CogTifTag<T = any> {
    protected source: CogSource;
    protected view: CogSourceView;

    abstract value: T | null;

    byteOffset: number;
    name: string;
    id: number;
    dataType: number;
    dataCount: number;

    abstract isStatic(): this is CogTifTagStatic<T>;
    abstract isLazy(): this is CogTifTagLazy<T>;
    abstract isOffset(): this is CogTifTagOffset;

    constructor(source: CogSource, offset: number, view: CogSourceView) {
        this.view = view;
        this.source = source;
        this.byteOffset = offset;

        this.id = this.view.uint16At(0);
        this.name = TiffTag[this.id];

        this.dataType = this.view.uint16At(2);
        this.dataCount = this.view.uintAt(4, this.source.config.offset);
    }

    get hasBytes() {
        return this.source.hasBytes(this.valuePointer, this.dataLength);
    }

    get isReady() {
        return true;
    }

    get dataTypeSize() {
        return getTiffTagSize(this.dataType);
    }

    get dataTypeName() {
        return TiffTagValueType[this.dataType];
    }

    get dataLength() {
        return this.dataTypeSize * this.dataCount;
    }

    /** absolute offset of the Tag value */
    get valuePointer() {
        const valueOffset = this.size - this.source.config.pointer;
        if (this.isValueInline) {
            return this.byteOffset + valueOffset;
        }
        return this.view.uintAt(valueOffset, this.source.config.pointer);
    }

    /** Size of the IFD (bytes) */
    get size() {
        return this.source.config.ifd;
    }

    /** Is the value of this tag inline, or is it a pointer to the real value */
    get isValueInline() {
        return this.dataLength <= this.source.config.pointer;
    }

    /** Read the value in from the byte array */
    readValue(): T {
        const offset = this.valuePointer;
        const dataTypeSize = this.dataTypeSize;
        const convert = getTiffTagValueReader(this.dataType);
        const count = this.dataCount;
        const dataLength = count * dataTypeSize;

        if (count == 1) {
            return convert(this.source, offset) as any;
        }

        const output = [];
        for (let i = 0; i < dataLength; i += dataTypeSize) {
            output.push(convert(this.source, offset + i));
        }

        // Convert to a string if ascii
        if (this.dataType === TiffTagValueType.ASCII) {
            return output.join('').trim() as any;
        }

        return output as any;
    }
}

export class CogTifTagStatic<T> extends CogTifTag<T> {
    value: T | null = null;

    constructor(source: CogSource, offset: number, view: CogSourceView) {
        super(source, offset, view);
        if (this.hasBytes) {
            this.value = this.readValue();
        }
    }

    isStatic(): this is CogTifTagStatic<T> {
        return true;
    }
    isOffset(): this is CogTifTagOffset {
        return false;
    }
    isLazy(): this is CogTifTagLazy<T> {
        return false;
    }
}

export class CogTifTagLazy<T> extends CogTifTag<T> {
    fetchable: Fetchable<T>;
    constructor(source: CogSource, offset: number, view: CogSourceView) {
        super(source, offset, view);
        this.fetchable = new Fetchable(this.loadValueFromPtr.bind(this));
    }

    isStatic(): this is CogTifTagStatic<T> {
        return false;
    }
    isOffset(): this is CogTifTagOffset {
        return false;
    }
    isLazy(): this is CogTifTagLazy<T> {
        return true;
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

export class CogTifTagOffset extends CogTifTag<number[]> {
    _loadedValues: number[] | null = null;
    constructor(source: CogSource, offset: number, view: CogSourceView) {
        super(source, offset, view);
    }

    get value(): number[] | null {
        if (this._loadedValues != null) {
            return this._loadedValues;
        }

        if (this.hasBytes) {
            this.readValue();
            return this._loadedValues;
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
            this._loadedValues = [val];
        } else {
            this._loadedValues = val;
        }
        return this._loadedValues;
    }

    async getValueAt(index: number): Promise<number> {
        if (this._loadedValues) {
            return this._loadedValues[index];
        }

        const dataSize = this.dataTypeSize;
        const valueOffset = this.valuePointer + dataSize * index;
        const convert = getTiffTagValueReader(this.dataType);

        if (!this.source.hasBytes(valueOffset, dataSize)) {
            await this.source.loadBytes(valueOffset, dataSize);
        }
        return convert(this.source, valueOffset) as number;
    }

    isStatic() {
        return false;
    }
    isOffset(): this is CogTifTagOffset {
        return true;
    }
    isLazy() {
        return false;
    }
}

export const CogTifTagFactory = {
    create(source: CogSource, offset: number) {
        const view = source.getView(offset);
        const tagId = view.uint16At(0);
        if (tagId === TiffTag.TileOffsets || tagId === TiffTag.TileByteCounts) {
            return new CogTifTagOffset(source, offset, view);
        }

        const staticTag = new CogTifTagStatic(source, offset, view);
        if (staticTag.hasBytes) {
            return staticTag;
        }

        return new CogTifTagLazy(source, offset, view);
    },
};
