import { ByteSize } from '@chunkd/core';
import { CogTiff } from '../cog.tiff.js';

export enum GhostOption {
    GDAL_STRUCTURAL_METADATA_SIZE = 'GDAL_STRUCTURAL_METADATA_SIZE',
    LAYOUT = 'LAYOUT',
    BLOCK_ORDER = 'BLOCK_ORDER',
    BLOCK_LEADER = 'BLOCK_LEADER',
    BLOCK_TRAILER = 'BLOCK_TRAILER',
    KNOWN_INCOMPATIBLE_EDITION = 'KNOWN_INCOMPATIBLE_EDITION',
    MASK_INTERLEAVED_WITH_IMAGERY = 'MASK_INTERLEAVED_WITH_IMAGERY',
}

export enum GhostOptionTileOrder {
    RowMajor = 'ROW_MAJOR',
}

export enum GhostOptionTileLeader {
    uint32 = 'SIZE_AS_UINT4',
}

/**
 * GDAL has made a ghost set of options for Tif files
 * this class represents the optimizations that can be used
 */
export class CogTifGhostOptions {
    options: Map<string, string> = new Map();
    source: CogTiff;

    /**
     * Has GDAL optimized this tif
     */
    get isCogOptimized(): boolean {
        if (this.isBroken) return false;
        return this.options.get(GhostOption.LAYOUT) === 'IFDS_BEFORE_DATA';
    }

    /**
     * Has GDAL determined this tif is now broken
     */
    get isBroken(): boolean {
        return this.options.get(GhostOption.KNOWN_INCOMPATIBLE_EDITION) === 'YES';
    }

    /**
     * Load the ghost options from a source
     * @param bytes the ghost header bytes
     */
    process(bytes: Uint8Array): void {
        let key = '';
        let value = '';
        let setValue = false;
        for (let i = 0; i < bytes.length; i++) {
            const charCode = bytes[i];
            if (charCode === 0) break;

            const char = String.fromCharCode(charCode);
            if (char === '\n') {
                this.options.set(key, value);
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
        switch (this.options.get(GhostOption.BLOCK_LEADER)) {
            case GhostOptionTileLeader.uint32:
                return ByteSize.UInt32;
            default:
                return null;
        }
    }

    get isMaskInterleaved(): boolean {
        return this.options.get(GhostOption.MASK_INTERLEAVED_WITH_IMAGERY) === 'YES';
    }
}
