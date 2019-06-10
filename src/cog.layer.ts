
export const VERSION_TIFF = 42;
export const VERSION_BIGTIFF = 43;

const ENDIAN_BIG = 0x4D4D
export const ENDIAN_LITTLE = 0x4949

export interface CogImage {
    Compression: number;
    ImageWidth: number;
    ImageLength: number;
    TileWidth: number;
    TileLength: number;
    TileOffsets: number[];
    TileByteCounts: number[];
}


