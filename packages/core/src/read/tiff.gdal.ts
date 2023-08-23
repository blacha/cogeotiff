import { ByteSize } from '../util/bytes.js';

export enum GhostOption {
  GdalStructuralMetadataSize = 'GDAL_STRUCTURAL_METADATA_SIZE',
  Layout = 'LAYOUT',
  BlockOrder = 'BLOCK_ORDER',
  BlockLeader = 'BLOCK_LEADER',
  BlockTrailer = 'BLOCK_TRAILER',
  KnownIncompatibleEdition = 'KNOWN_INCOMPATIBLE_EDITION',
  MaskInterleavedWithImagery = 'MASK_INTERLEAVED_WITH_IMAGERY',
}

export enum GhostOptionTileOrder {
  RowMajor = 'ROW_MAJOR',
}

export enum GhostOptionTileLeader {
  uint32 = 'SIZE_AS_UINT4',
}

/**
 * GDAL has made a ghost set of options for Tiff files
 * this class represents the optimizations that GDAL has applied
 */
export class CogTifGhostOptions {
  options: Map<string, string> = new Map();

  /**
   * Has GDAL optimized this tiff
   */
  get isCogOptimized(): boolean {
    if (this.isBroken) return false;
    return this.options.get(GhostOption.Layout) === 'IFDS_BEFORE_DATA';
  }

  /**
   * Has GDAL determined this tiff is now broken
   */
  get isBroken(): boolean {
    return this.options.get(GhostOption.KnownIncompatibleEdition) === 'YES';
  }

  /**
   * Load the ghost options from a source
   * @param bytes the ghost header bytes
   */
  process(bytes: DataView, offset: number, ghostSize: number): void {
    let key = '';
    let value = '';
    let setValue = false;
    for (let i = 0; i < ghostSize; i++) {
      const charCode = bytes.getUint8(offset + i);
      if (charCode === 0) break;

      const char = String.fromCharCode(charCode);
      if (char === '\n') {
        this.options.set(key.trim(), value.trim());
        key = '';
        value = '';
        setValue = false;
      } else if (char === '=') {
        setValue = true;
      } else {
        if (setValue) value += char;
        else key += char;
      }
    }
  }

  /**
   * If the tile leader is set, how many bytes are allocated to the tile size
   */
  get tileLeaderByteSize(): ByteSize | null {
    switch (this.options.get(GhostOption.BlockLeader)) {
      case GhostOptionTileLeader.uint32:
        return ByteSize.UInt32;
      default:
        return null;
    }
  }

  get isMaskInterleaved(): boolean {
    return this.options.get(GhostOption.MaskInterleavedWithImagery) === 'YES';
  }
}
