/**
 * Tif version number that is stored at the start of a tif file
 */
export enum TiffVersion {
  /**
   * Big tif's,
   * generally uses 64bit numbers for offsets
   * @see http://bigtiff.org/
   **/
  BigTiff = 43,
  /**
   * Original tif
   * Uses 32 bit or smaller numbers for offsets and counters
   */
  Tiff = 42,
}
