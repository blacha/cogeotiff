import { getUint } from './bytes.js';
import { CogTiffImage } from './cog.tiff.image.js';
import { TiffEndian } from './const/tiff.endian.js';
import { TiffTag } from './const/tiff.tag.id.js';
import { TiffVersion } from './const/tiff.version.js';
import { hasBytes, DataViewOffset } from './read/data.view.offset.js';
import { CogTifGhostOptions } from './read/tiff.gdal.js';
import { TagTiffBigConfig, TagTiffConfig, TiffIfdConfig } from './read/tiff.ifd.config.js';
import { CogTiffTag, createTag } from './read/tiff.tag.factory.js';
import { CogSource } from './source.js';
import { toHex } from './util/util.hex.js';

export class CogTiff {
    /** Read 16KB blocks at a time */
    defaultReadSize = 16 * 1024;
    source: CogSource;
    version = TiffVersion.Tiff;
    images: CogTiffImage[] = [];
    options = new CogTifGhostOptions();
    ifdConfig: TiffIfdConfig = TagTiffConfig;
    isLittleEndian: boolean;

    constructor(source: CogSource) {
        this.source = source;
    }

    /** Has init() been called */
    isInitialized = false;

    private _initPromise?: Promise<CogTiff>;
    /**
     * Initialize the COG loading in the header and all image headers
     */
    init(): Promise<CogTiff> {
        if (this._initPromise) return this._initPromise;
        this._initPromise = this._readIfd();
        return this._initPromise;
    }

    private async _readIfd(): Promise<CogTiff> {
        if (this.isInitialized) return this;
        const bytes = new DataView(await this.source.fetchBytes(0, this.defaultReadSize)) as DataViewOffset;
        bytes.sourceOffset = 0;

        let offset = 0;
        const endian = bytes.getUint16(offset, this.isLittleEndian);
        offset += 2;

        this.isLittleEndian = endian === TiffEndian.Little;
        if (!this.isLittleEndian) throw new Error('Only little endian is supported');
        this.version = bytes.getUint16(offset, this.isLittleEndian);
        offset += 2;

        let nextOffsetIfd: number;
        if (this.version === TiffVersion.BigTiff) {
            this.ifdConfig = TagTiffBigConfig;
            const pointerSize = bytes.getUint16(offset, this.isLittleEndian);
            offset += 2;
            if (pointerSize !== 8) throw new Error('Only 8byte pointers are supported');
            const zeros = bytes.getUint16(offset, this.isLittleEndian);
            offset += 2;
            if (zeros !== 0) throw new Error('Invalid big tiff header');
            nextOffsetIfd = getUint(bytes, offset, this.ifdConfig.pointer, this.isLittleEndian);
            offset += this.ifdConfig.pointer;
        } else if (this.version === TiffVersion.Tiff) {
            nextOffsetIfd = getUint(bytes, offset, this.ifdConfig.pointer, this.isLittleEndian);
            offset += this.ifdConfig.pointer;
        } else {
            throw new Error(`Only tiff supported version:${this.version}`);
        }

        const ghostSize = nextOffsetIfd - offset;
        // GDAL now stores metadata between the IFD inside a ghost storage area
        if (ghostSize > 0 && ghostSize < 16 * 1024) this.options.process(bytes, offset, ghostSize);

        // console.time('ReadIfd');
        await this.readIfd(nextOffsetIfd, bytes);
        // console.timeEnd('ReadIfd');
        this.isInitialized = true;
        return this;
    }

    /**
     * Find a image which has a resolution similar to the provided resolution
     *
     * @param resolution resolution to find
     */
    getImageByResolution(resolution: number): CogTiffImage {
        const firstImage = this.images[0];
        const firstImageSize = firstImage.size;
        const [refX] = firstImage.resolution;

        const resolutionBaseX = refX * firstImageSize.width;
        // const resolutionBaseY = refY * firstImageSize.height;
        for (let i = this.images.length - 1; i > 0; i--) {
            const img = this.images[i];
            const imgSize = img.size;

            const imgResolutionX = resolutionBaseX / imgSize.width;
            // TODO do we care about y resolution
            // const imgResolutionY = resolutionBaseY / imgSize.height;

            if (imgResolutionX - resolution <= 0.01) return img;
        }
        return firstImage;
    }

    private async readIfd(offset: number, lastView: DataViewOffset): Promise<void> {
        // Often the previous read has enough information for reading this view
        if (!hasBytes(lastView, offset, 512)) {
            const bytes = await this.source.fetchBytes(offset, this.defaultReadSize);
            lastView = new DataView(bytes) as DataViewOffset;
            lastView.sourceOffset = offset;
        }

        const viewOffset = offset - lastView.sourceOffset;
        const tagCount = getUint(lastView, viewOffset, this.ifdConfig.offset, this.isLittleEndian);
        // const byteStart = this.ifdConfig.offset;
        const tags: Map<TiffTag, CogTiffTag> = new Map();

        // We now know how many bytes we need so ensure the ifd bytes are all read
        const ifdBytes = tagCount * this.ifdConfig.ifd;
        if (!hasBytes(lastView, offset, ifdBytes)) {
            const bytes = await this.source.fetchBytes(offset, this.defaultReadSize);
            lastView = new DataView(bytes) as DataViewOffset;
            lastView.sourceOffset = offset;
        }

        let currentOffset = viewOffset + this.ifdConfig.offset;
        for (let i = 0; i < tagCount; i++) {
            const tag = createTag(this, lastView, currentOffset);
            currentOffset += this.ifdConfig.ifd;
            tags.set(tag.id, tag);
        }

        this.images.push(new CogTiffImage(this, this.images.length, tags));
        const nextOffset = getUint(lastView, currentOffset, this.ifdConfig.pointer, this.isLittleEndian);
        if (nextOffset) return this.readIfd(nextOffset, lastView);
    }
}
