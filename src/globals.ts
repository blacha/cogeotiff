export enum TIFF_TAG {
    width = 256,
    height = 257,
    tileWidth = 322,
    tileHeight = 323,
    offsets = 324,
    byteCounts = 325,
    compression = 259,
    jpegTables = 347
}

export const TIFF_COMPRESSION = {
    6: 'image/jpeg',
    7: 'image/jpeg',
    8: 'deflate',
    34712: 'image/jp2',
    50001: 'image/webp'
}

export const TIFF_SIZE = {
    1: {
        // # TIFFByte
        'format': 'B',
        'length': 1
    },
    2: {
        // # TIFFascii
        'format': 'c',
        'length': 1
    },
    3: {
        // # TIFFshort
        'format': 'H',
        'length': 2
    },
    4: {
        // # TIFFlong
        'format': 'L',
        'length': 4
    },
    5: {
        // # TIFFrational
        'format': 'f',
        'length': 4
    },
    7: {
        // undefined
        'format': 'B',
        'length': 1
    },
    12: {
        // # TIFFdouble
        'format': 'd',
        'length': 8
    },
    16: {
        // # TIFFlong8
        'format': 'Q',
        'length': 8
    }
}
