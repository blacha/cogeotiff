export enum TiffTagValueType {
  Uint8 = 0x0001,
  Ascii = 0x0002,
  Uint16 = 0x0003,
  Uint32 = 0x0004,
  Rational = 0x0005,
  Int8 = 0x0006,
  Undefined = 0x0007,
  Int16 = 0x0008,
  Int32 = 0x0009,
  SignedRational = 0x000a,
  Float32 = 0x000b,
  Float64 = 0x000c,
  // introduced by BigTIFF
  Uint64 = 0x0010,
  Int64 = 0x0011,
  Ifd8 = 0x0012,
}
