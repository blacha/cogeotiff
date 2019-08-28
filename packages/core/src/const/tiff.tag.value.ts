export enum TiffTagValueType {
    BYTE = 0x0001,
    ASCII = 0x0002,
    SHORT = 0x0003,
    LONG = 0x0004,
    RATIONAL = 0x0005,
    SBYTE = 0x0006,
    UNDEFINED = 0x0007,
    SSHORT = 0x0008,
    SLONG = 0x0009,
    SRATIONAL = 0x000a,
    FLOAT = 0x000b,
    DOUBLE = 0x000c,
    // introduced by BigTIFF
    LONG8 = 0x0010,
    SLONG8 = 0x0011,
    IFD8 = 0x0012,
}
