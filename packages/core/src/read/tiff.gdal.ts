import { ByteSize } from '@chunkd/core';
import { CogTiff } from '../cog.tiff.js';

//   GDAL_STRUCTURAL_METADATA_SIZE: '000140 bytes',
//   LAYOUT: 'IFDS_BEFORE_DATA',
//   BLOCK_ORDER: 'ROW_MAJOR',
//   BLOCK_LEADER: 'SIZE_AS_UINT4',
//   BLOCK_TRAILER: 'LAST_4_BYTES_REPEATED',
//   KNOWN_INCOMPATIBLE_EDITION: 'NO'

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
    options: Map<GhostOption, string> = new Map();
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
     * @param source Source to load from
     * @param offset Byte offset to start reading
     * @param length max number of bytes to read
     */
    process(bytes: Uint8Array): void {
        const chars: string[] = [];
        for (let i = 0; i < bytes.length; i++) {
            const char = bytes[i];
            if (char === 0) continue;
            chars.push(String.fromCharCode(char));
        }

        const keyValPairs = chars
            .join('')
            .trim()
            .split('\n')
            .map((c) => c.split('='));

        for (const [key, value] of keyValPairs) {
            this.options.set(GhostOption[key as GhostOption], value);
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
