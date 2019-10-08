import { TiffTag } from '../../const/tiff.tag.id';
import { TiffTagValueType } from '../../const/tiff.tag.value';
import { CogSource } from '../../source/cog.source';
import { CogSourceView } from '../../source/cog.source.view';
import { getTiffTagSize, getTiffTagValueReader } from '../tiff.value.reader';

export abstract class CogTiffTagBase<T = any> {
    protected source: CogSource;
    protected view: CogSourceView;

    /**
     * Value of the tiff tag, may be null if the value has not been read
     */
    abstract value: T | null;

    /** Raw offset for where in the tif this tag starts */
    private byteOffset: number;

    /** Name of the tag */
    name: string;

    /** TifTagId @see TiffTag */
    id: number;

    /** Type of data inside the record @see this.dataTypeName */
    dataType: number;

    /** Number of records inside the tag */
    dataCount: number;

    constructor(id: number, source: CogSource, offset: number, view: CogSourceView) {
        this.view = view;
        this.source = source;
        this.byteOffset = offset;

        this.id = id;
        this.name = TiffTag[this.id];

        this.dataType = this.view.uint16At(2);
        this.dataCount = this.view.uintAt(4, this.source.config.offset);
        this.dataTypeSize = getTiffTagSize(this.dataType);
        this.dataLength = this.dataTypeSize * this.dataCount;
    }

    /**
     * Have the bytes for the tag been loaded, or is a fetch required to read the tag
     */
    get hasBytes() {
        return this.source.hasBytes(this.valuePointer, this.dataLength);
    }

    /**
     * is the tag ready to be read
     */
    get isReady() {
        return true;
    }

    /**
     * Get the size of the data type
     *
     * @remarks
     * This is only the size of one instance of the data @see this.dataLength for total byte size
     *
     */
    dataTypeSize: number;

    /**
     * Get a human readable name for a datatype
     *
     */
    get dataTypeName(): string {
        return TiffTagValueType[this.dataType];
    }

    /**
     * Get the number of bytes used for the all of the data
     */
    dataLength: number;

    /** absolute offset of the Tag value */
    get valuePointer(): number {
        const valueOffset = this.size - this.source.config.pointer;
        if (this.isValueInline) {
            return this.byteOffset + valueOffset;
        }
        return this.view.uintAt(valueOffset, this.source.config.pointer);
    }

    /** Size of the IFD (bytes) */
    get size(): number {
        return this.source.config.ifd;
    }

    /** Is the value of this tag inline, or is it a pointer to the real value */
    get isValueInline(): boolean {
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
