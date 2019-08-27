/**
 * Tiff format
 * The header of a tif file contains the endianness of the file
 */
export enum TiffEndian {
    BIG = 0x4d4d,
    LITTLE = 0x4949,
}
