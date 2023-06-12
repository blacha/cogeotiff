import { getUint } from './bytes.js';
import { CogTiffImage } from './cog.tiff.image.js';
import { TiffEndian } from './const/tiff.endian.js';
import { TiffVersion } from './const/tiff.version.js';
import { TiffTag } from './index.js';
import { DataViewOffset, hasBytes } from './read/data.view.offset.js';
import { CogTifGhostOptions } from './read/tiff.gdal.js';
import { TagTiffBigConfig, TagTiffConfig, TiffIfdConfig } from './read/tiff.ifd.config.js';
import { CogTiffTag, createTag } from './read/tiff.tag.factory.js';
import { CogSource } from './source.js';

export class CogTiff {
  /** Read 16KB blocks at a time */
  defaultReadSize = 16 * 1024;
  source: CogSource;
  version = TiffVersion.Tiff;
  images: CogTiffImage[] = [];
  /** Ghost header options */
  options?: CogTifGhostOptions;
  /** Configuration for the size of the IFD */
  ifdConfig: TiffIfdConfig = TagTiffConfig;
  /** Is the tiff being read is little Endian */
  isLittleEndian = false;
  /** Has init() been called */
  isInitialized = false;

  private _initPromise?: Promise<CogTiff>;
  constructor(source: CogSource) {
    this.source = source;
  }

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
    // console.time('init');
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
    if (ghostSize > 0 && ghostSize < 16 * 1024) {
      this.options = new CogTifGhostOptions();
      this.options.process(bytes, offset, ghostSize);
    }

    while (nextOffsetIfd !== 0) {
      let lastView = bytes;
      if (!hasBytes(lastView, nextOffsetIfd, 1024)) {
        const bytes = await this.source.fetchBytes(offset, this.defaultReadSize);
        lastView = new DataView(bytes) as DataViewOffset;
        lastView.sourceOffset = offset;
      }
      nextOffsetIfd = await this.readIfd(nextOffsetIfd, bytes);
    }

    // console.log(counts);
    await Promise.all(this.images.map((i) => i.init()));
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

  private async readIfd(offset: number, lastView: DataViewOffset): Promise<number> {
    const viewOffset = offset - lastView.sourceOffset;
    const tagCount = getUint(lastView, viewOffset, this.ifdConfig.offset, this.isLittleEndian);

    const tags: Map<TiffTag, CogTiffTag> = new Map();

    // We now know how many bytes we need so ensure the ifd bytes are all read
    const ifdBytes = tagCount * this.ifdConfig.ifd;
    if (!hasBytes(lastView, offset, ifdBytes)) throw new Error('ifd out of range');

    const ifdSize = this.ifdConfig.ifd;
    const startOffset = viewOffset + this.ifdConfig.offset;
    for (let i = 0; i < tagCount; i++) {
      const tag = createTag(this, lastView, startOffset + i * ifdSize);
      tags.set(tag.id, tag);
    }

    this.images.push(new CogTiffImage(this, this.images.length, tags));
    return getUint(lastView, startOffset + tagCount * ifdSize, this.ifdConfig.pointer, this.isLittleEndian);
  }
}
