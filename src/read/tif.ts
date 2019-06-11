export enum TiffVersion {
    BigTiff = 43,
    Tiff = 42
}

// Stolen from geotiff.js
export enum TiffTag {
    // TIFF Baseline
    Artist = 0x013B,
    BitsPerSample = 0x0102,
    CellLength = 0x0109,
    CellWidth = 0x0108,
    ColorMap = 0x0140,
    Compression = 0x0103,
    Copyright = 0x8298,
    DateTime = 0x0132,
    ExtraSamples = 0x0152,
    FillOrder = 0x010A,
    FreeByteCounts = 0x0121,
    FreeOffsets = 0x0120,
    GrayResponseCurve = 0x0123,
    GrayResponseUnit = 0x0122,
    HostComputer = 0x013C,
    ImageDescription = 0x010E,
    ImageHeight = 0x0101,
    ImageWidth = 0x0100,
    Make = 0x010F,
    MaxSampleValue = 0x0119,
    MinSampleValue = 0x0118,
    Model = 0x0110,
    NewSubfileType = 0x00FE,
    Orientation = 0x0112,
    PhotometricInterpretation = 0x0106,
    PlanarConfiguration = 0x011C,
    ResolutionUnit = 0x0128,
    RowsPerStrip = 0x0116,
    SamplesPerPixel = 0x0115,
    Software = 0x0131,
    StripByteCounts = 0x0117,
    StripOffsets = 0x0111,
    SubfileType = 0x00FF,
    Threshholding = 0x0107,
    XResolution = 0x011A,
    YResolution = 0x011B,

    // TIFF Extended
    BadFaxLines = 0x0146,
    CleanFaxData = 0x0147,
    ClipPath = 0x0157,
    ConsecutiveBadFaxLines = 0x0148,
    Decode = 0x01B1,
    DefaultImageColor = 0x01B2,
    DocumentName = 0x010D,
    DotRange = 0x0150,
    HalftoneHints = 0x0141,
    Indexed = 0x015A,
    JPEGTables = 0x015B,
    PageName = 0x011D,
    PageNumber = 0x0129,
    Predictor = 0x013D,
    PrimaryChromaticities = 0x013F,
    ReferenceBlackWhite = 0x0214,
    SampleFormat = 0x0153,
    SMinSampleValue = 0x0154,
    SMaxSampleValue = 0x0155,
    StripRowCounts = 0x022F,
    SubIFDs = 0x014A,
    T4Options = 0x0124,
    T6Options = 0x0125,
    TileByteCounts = 0x0145,
    TileHeight = 0x0143,
    TileOffsets = 0x0144,
    TileWidth = 0x0142,
    TransferFunction = 0x012D,
    WhitePoint = 0x013E,
    XClipPathUnits = 0x0158,
    XPosition = 0x011E,
    YCbCrCoefficients = 0x0211,
    YCbCrPositioning = 0x0213,
    YCbCrSubSampling = 0x0212,
    YClipPathUnits = 0x0159,
    YPosition = 0x011F,

    // EXIF
    ApertureValue = 0x9202,
    ColorSpace = 0xA001,
    DateTimeDigitized = 0x9004,
    DateTimeOriginal = 0x9003,
    Exif_IFD = 0x8769,
    ExifVersion = 0x9000,
    ExposureTime = 0x829A,
    FileSource = 0xA300,
    Flash = 0x9209,
    FlashpixVersion = 0xA000,
    FNumber = 0x829D,
    ImageUniqueID = 0xA420,
    LightSource = 0x9208,
    MakerNote = 0x927C,
    ShutterSpeedValue = 0x9201,
    UserComment = 0x9286,

    // IPTC
    IPTC = 0x83BB,

    // ICC
    ICC_Profile = 0x8773,

    // XMP
    XMP = 0x02BC,

    // GDAL
    GDAL_METADATA = 0xA480,
    GDAL_NODATA = 0xA481,

    // Photoshop
    Photoshop = 0x8649,

    // GeoTiff
    ModelPixelScale = 0x830E,
    ModelTiepoint = 0x8482,
    ModelTransformation = 0x85D8,
    GeoKeyDirectory = 0x87AF,
    GeoDoubleParams = 0x87B0,
    GeoAsciiParams = 0x87B1,
}

export const TiffCompression = {
    6: "image/jpeg",
    7: "image/jpeg",
    8: "deflate",
    34712: "image/jp2",
    50001: "image/webp"
};

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
    SRATIONAL = 0x000A,
    FLOAT = 0x000B,
    DOUBLE = 0x000C,
    // introduced by BigTIFF
    LONG8 = 0x0010,
    SLONG8 = 0x0011,
    IFD8 = 0x0012,
};

export function getTiffTagSize(fieldType: TiffTagValueType) {
    switch (fieldType) {
        case TiffTagValueType.BYTE: case TiffTagValueType.ASCII: case TiffTagValueType.SBYTE: case TiffTagValueType.UNDEFINED:
            return 1;
        case TiffTagValueType.SHORT: case TiffTagValueType.SSHORT:
            return 2;
        case TiffTagValueType.LONG: case TiffTagValueType.SLONG: case TiffTagValueType.FLOAT:
            return 4;
        case TiffTagValueType.RATIONAL: case TiffTagValueType.SRATIONAL: case TiffTagValueType.DOUBLE:
        case TiffTagValueType.LONG8: case TiffTagValueType.SLONG8: case TiffTagValueType.IFD8:
            return 8;
        default:
            throw new Error(`Invalid field type: "${fieldType}"`);
    }
}

export type TiffTagValueRational = [number, number]
export type TiffTagValueReaderFunc = (view: DataView, offset: number, isLittleEndian: boolean) => number | bigint | TiffTagValueRational | string

const TiffTagValueReader: { [key: string]: TiffTagValueReaderFunc } = {
    char: (view: DataView, offset: number, isLittleEndian: boolean) => String.fromCharCode(view.getUint8(offset)),
    uint8: (view: DataView, offset: number, isLittleEndian: boolean) => view.getUint8(offset),
    uint16: (view: DataView, offset: number, isLittleEndian: boolean) => view.getUint16(offset, isLittleEndian),
    uint32: (view: DataView, offset: number, isLittleEndian: boolean) => view.getUint32(offset, isLittleEndian),
    uint64: (view: DataView, offset: number, isLittleEndian: boolean) => view.getBigUint64(offset, isLittleEndian),
    double: (view: DataView, offset: number, isLittleEndian: boolean) => view.getFloat64(offset, isLittleEndian),
    rational: (view: DataView, offset: number, isLittleEndian: boolean) => [view.getUint32(offset, this.isLittleEndian), view.getUint32(offset + 4, this.isLittleEndian)]
}
export function getTiffTagValueReader(fieldType: TiffTagValueType): TiffTagValueReaderFunc {
    switch (fieldType) {
        case TiffTagValueType.ASCII:
            return TiffTagValueReader.char;

        case TiffTagValueType.BYTE:
        case TiffTagValueType.UNDEFINED:
        case TiffTagValueType.SBYTE:
            return TiffTagValueReader.uint8

        case TiffTagValueType.SHORT:
        case TiffTagValueType.SSHORT:
            return TiffTagValueReader.uint16

        case TiffTagValueType.LONG:
        case TiffTagValueType.SLONG:
            return TiffTagValueReader.uint32

        case TiffTagValueType.RATIONAL:
        case TiffTagValueType.SRATIONAL:
            return TiffTagValueReader.rational

        case TiffTagValueType.DOUBLE:
            return TiffTagValueReader.rational

        case TiffTagValueType.LONG8:
            return TiffTagValueReader.uint64

        default:
            throw new Error(`Unknown read type "${fieldType}" "${TiffTagValueType[fieldType]}"`)
    }
}
