/**
 * Tiff format
 *
 * The header of a Tiff file contains the endianness of the file
 */
export enum TiffEndian {
  Big = 0x4d4d,
  Little = 0x4949,
}
