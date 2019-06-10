export enum TIFF_TAG {
    width = 256,
    height = 257,
    tileWidth = 322,
    tileHeight = 323,
    offsets = 324,
    byteCounts = 325,
    compression = 259,
    jpegTables = 347,
    ModelPixelScale = 0x830e,
    ModelTiepoint = 0x8482,
    ModelTransformation = 0x85d8,
    GeoKeyDirectory = 0x87af,
    GeoDoubleParams = 0x87b0,
    GeoAsciiParams = 0x87b1
}

export const TIFF_COMPRESSION = {
    6: "image/jpeg",
    7: "image/jpeg",
    8: "deflate",
    34712: "image/jp2",
    50001: "image/webp"
};

export enum TIFF_TAG_TYPE {
    'BYTE' = 0x0001,
    'ASCII' = 0x0002,
    'SHORT' = 0x0003,
    'LONG' = 0x0004,
    'RATIONAL' = 0x0005,
    'SBYTE' = 0x0006,
    'UNDEFINED' = 0x0007,
    'SSHORT' = 0x0008,
    'SLONG' = 0x0009,
    'SRATIONAL' = 0x000A,
    'FLOAT' = 0x000B,
    'DOUBLE' = 0x000C,
    // introduced by BigTIFF
    'LONG8' = 0x0010,
    'SLONG8' = 0x0011,
    'IFD8' = 0x0012,
};

export const TIFF_SIZE = {
    1: {
        // # TIFFByte
        format: "B",
        length: 1
    },
    2: {
        // # TIFFascii
        format: "c",
        length: 1
    },
    3: {
        // # TIFFshort
        format: "H",
        length: 2
    },
    4: {
        // # TIFFlong
        format: "L",
        length: 4
    },
    5: {
        // # TIFFrational
        format: "f",
        length: 4
    },
    7: {
        // undefined
        format: "B",
        length: 1
    },
    12: {
        // # TIFFdouble
        format: "d",
        length: 8
    },
    16: {
        // # TIFFlong8
        format: "Q",
        length: 8
    }
};
