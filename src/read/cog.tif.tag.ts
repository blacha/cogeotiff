import { CogSource } from '../cog.source';
import { CogSourceView } from '../cog.source.view';
import { Fetchable } from '../util/util.fetchable';
import { getTiffTagSize, getTiffTagValueReader, TiffTag, TiffTagValueType, TiffVersion } from './tif';

export class CogTifTag<T = any> {
    protected source: CogSource;
    protected view: CogSourceView;

    valueFetch: Fetchable<T>;
    byteOffset: number;

    constructor(source: CogSource, offset: number) {
        this.source = source;
        this.byteOffset = offset;
        this.view = source.getView(offset, source.config.ifd);

        if (this.source.hasBytes(this.valuePointer, this.dataLength)) {
            this.valueFetch = new Fetchable<T>(this.convertValue(this.valuePointer));
        } else {
            this.valueFetch = new Fetchable<T>(this.loadValueFromPtr.bind(this));
        }
    }

    static create(source: CogSource, offset: number) {
        if (source.version === TiffVersion.Tiff) {
            return new CogTifTag(source, offset);
        }
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return new CogTifTagBig(source, offset);
    }

    get isReady() {
        return this.valueFetch.isFetching && this.valueFetch.value != null;
    }

    get value() {
        return this.valueFetch.value;
    }

    get fetch() {
        return this.valueFetch.fetch;
    }

    get id(): TiffTag {
        return this.view.uint16At(0);
    }

    get name(): string {
        return TiffTag[this.id];
    }

    get dataType(): TiffTagValueType {
        return this.view.uint16At(2);
    }

    get dataCount(): number {
        return this.view.uint16At(4);
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
        return this.view.uint32At(valueOffset);
    }

    /** Is the value of this tag inline, or is it a pointer to the real value */
    get isValueInline() {
        return this.dataLength <= this.source.config.pointer;
    }

    get size() {
        return this.source.config.ifd;
    }

    /**
     * Assume the value is a pointer and load the bytes at the pointer
     *
     * TODO Ideally we should only load the bytes we care about
     */
    async loadValueFromPtr() {
        await this.source.loadBytes(this.valuePointer, this.dataLength);
        return this.convertValue(this.valuePointer);
    }

    private convertValue(offset: number): T {
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

export class CogTifTagBig<T> extends CogTifTag<T> {
    get dataCount() {
        return this.view.uint64At(4);
    }

    get valuePointer() {
        const valueOffset = this.size - this.source.config.pointer;
        if (this.isValueInline) {
            return this.byteOffset + valueOffset;
        }
        return this.view.uint64At(valueOffset);
    }
}
