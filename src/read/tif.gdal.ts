import { CogSource } from "../cog.source";
import { getReverseEnumValue } from "../util/util.enum";
import { ByteSize } from "./byte.size";

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
    MASK_INTERLEAVED_WITH_IMAGERY = 'MASK_INTERLEAVED_WITH_IMAGERY'
}

export enum GhostOptionTileOrder {
    RowMajor = 'ROW_MAJOR'
}

export enum GhostOptionTileLeader {
    uint32 = 'SIZE_AS_UINT4'
}
export const GhostOptionTileLeaderSize = {
    uint32: ByteSize.UInt32
}

export class CogTifGhostOptions {
    _options: Map<GhostOption, string> = new Map();

    get isCogOptimized() {
        if (this.isBroken) {
            return false;
        }
        return this._options.get(GhostOption.LAYOUT) === 'IFDS_BEFORE_DATA'
    }

    get isBroken() {
        return this._options.get(GhostOption.KNOWN_INCOMPATIBLE_EDITION) === 'YES'
    }

    set(key: GhostOption, val: string) {
        this._options.set(key, val);
    }

    process(source: CogSource, offset: number, length: number) {
        const chars = [];
        for (let i = offset; i < offset + length; i++) {
            const char = source.uint8(i);
            if (char == 0) {
                continue;
            }
            chars.push(String.fromCharCode(char));
        }

        for (const [key, value] of chars.join('').trim().split('\n').map(c => c.split('='))) {
            this._options.set(GhostOption[key], value)
        }
    }

    private _getReverse<T>(e: Object, key: GhostOption): T {
        const opt = this._options.get(key)
        return getReverseEnumValue<T>(e, opt);
    }
    get tileOrder(): GhostOptionTileOrder {
        return this._getReverse(GhostOptionTileOrder, GhostOption.BLOCK_ORDER)
    }

    get tileLeader(): GhostOptionTileLeader {
        return this._getReverse(GhostOptionTileLeader, GhostOption.BLOCK_LEADER)
    }

    get tileLeaderByteSize(): ByteSize {
        return GhostOptionTileLeaderSize[this.tileLeader]
    }

    get isMaskInterleaved(): boolean {
        return this._options.get(GhostOption.MASK_INTERLEAVED_WITH_IMAGERY) === 'YES'
    }

}
