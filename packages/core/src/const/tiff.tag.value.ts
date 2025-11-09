export enum TiffTagValueType {
  Uint8 = 1,
  Ascii = 2,
  Uint16 = 3,
  Uint32 = 4,
  Rational = 5,
  Int8 = 6,
  Undefined = 7,
  Int16 = 8,
  Int32 = 9,
  SignedRational = 10,
  Float32 = 11,
  Float64 = 12,
  // IFD offset: https://owl.phy.queensu.ca/~phil/exiftool/standards.html
  Ifd = 13,
  // BigTiff
  Uint64 = 16,
  Int64 = 17,
  Ifd8 = 18,
}
