import { CogSource } from '../cog.source';
import { MimeType } from './mime';

export enum TiffVersion {
    BigTiff = 43,
    Tiff = 42,
}

// Stolen from geotiff.js
export enum TiffTag {
    // TIFF Baseline
    Artist = 0x013b,
    BitsPerSample = 0x0102,
    CellLength = 0x0109,
    CellWidth = 0x0108,
    ColorMap = 0x0140,
    Compression = 0x0103,
    Copyright = 0x8298,
    DateTime = 0x0132,
    ExtraSamples = 0x0152,
    FillOrder = 0x010a,
    FreeByteCounts = 0x0121,
    FreeOffsets = 0x0120,
    GrayResponseCurve = 0x0123,
    GrayResponseUnit = 0x0122,
    HostComputer = 0x013c,
    ImageDescription = 0x010e,
    ImageHeight = 0x0101,
    ImageWidth = 0x0100,
    Make = 0x010f,
    MaxSampleValue = 0x0119,
    MinSampleValue = 0x0118,
    Model = 0x0110,
    NewSubfileType = 0x00fe,
    Orientation = 0x0112,
    PhotometricInterpretation = 0x0106,
    PlanarConfiguration = 0x011c,
    ResolutionUnit = 0x0128,
    RowsPerStrip = 0x0116,
    SamplesPerPixel = 0x0115,
    Software = 0x0131,
    StripByteCounts = 0x0117,
    StripOffsets = 0x0111,
    SubfileType = 0x00ff,
    Threshholding = 0x0107,
    XResolution = 0x011a,
    YResolution = 0x011b,

    // TIFF Extended
    BadFaxLines = 0x0146,
    CleanFaxData = 0x0147,
    ClipPath = 0x0157,
    ConsecutiveBadFaxLines = 0x0148,
    Decode = 0x01b1,
    DefaultImageColor = 0x01b2,
    DocumentName = 0x010d,
    DotRange = 0x0150,
    HalftoneHints = 0x0141,
    Indexed = 0x015a,
    JPEGTables = 0x015b,
    PageName = 0x011d,
    PageNumber = 0x0129,
    Predictor = 0x013d,
    PrimaryChromaticities = 0x013f,
    ReferenceBlackWhite = 0x0214,
    SampleFormat = 0x0153,
    SMinSampleValue = 0x0154,
    SMaxSampleValue = 0x0155,
    StripRowCounts = 0x022f,
    SubIFDs = 0x014a,
    T4Options = 0x0124,
    T6Options = 0x0125,
    TileByteCounts = 0x0145,
    TileHeight = 0x0143,
    TileOffsets = 0x0144,
    TileWidth = 0x0142,
    TransferFunction = 0x012d,
    WhitePoint = 0x013e,
    XClipPathUnits = 0x0158,
    XPosition = 0x011e,
    YCbCrCoefficients = 0x0211,
    YCbCrPositioning = 0x0213,
    YCbCrSubSampling = 0x0212,
    YClipPathUnits = 0x0159,
    YPosition = 0x011f,

    // EXIF
    ApertureValue = 0x9202,
    ColorSpace = 0xa001,
    DateTimeDigitized = 0x9004,
    DateTimeOriginal = 0x9003,
    ExifIFD = 0x8769,
    ExifVersion = 0x9000,
    ExposureTime = 0x829a,
    FileSource = 0xa300,
    Flash = 0x9209,
    FlashpixVersion = 0xa000,
    FNumber = 0x829d,
    ImageUniqueID = 0xa420,
    LightSource = 0x9208,
    MakerNote = 0x927c,
    ShutterSpeedValue = 0x9201,
    UserComment = 0x9286,

    // IPTC
    IPTC = 0x83bb,

    // ICC
    ICCProfile = 0x8773,

    // XMP
    XMP = 0x02bc,

    // GDAL
    GDAL_METADATA = 0xa480,
    GDAL_NODATA = 0xa481,

    // Photoshop
    Photoshop = 0x8649,

    // GeoTiff
    ModelPixelScale = 0x830e,
    ModelTiepoint = 0x8482,
    ModelTransformation = 0x85d8,
    GeoKeyDirectory = 0x87af,
    GeoDoubleParams = 0x87b0,
    GeoAsciiParams = 0x87b1,
}

export enum TiffEndian {
    BIG = 0x4d4d,
    LITTLE = 0x4949,
}

export const TiffCompression: { [key: number]: string } = {
    6: MimeType.JPEG,
    7: MimeType.JPEG,
    8: 'deflate',
    34712: MimeType.JP2,
    50001: MimeType.WEBP,
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
    SRATIONAL = 0x000a,
    FLOAT = 0x000b,
    DOUBLE = 0x000c,
    // introduced by BigTIFF
    LONG8 = 0x0010,
    SLONG8 = 0x0011,
    IFD8 = 0x0012,
}

export function getTiffTagSize(fieldType: TiffTagValueType) {
    switch (fieldType) {
        case TiffTagValueType.BYTE:
        case TiffTagValueType.ASCII:
        case TiffTagValueType.SBYTE:
        case TiffTagValueType.UNDEFINED:
            return 1;
        case TiffTagValueType.SHORT:
        case TiffTagValueType.SSHORT:
            return 2;
        case TiffTagValueType.LONG:
        case TiffTagValueType.SLONG:
        case TiffTagValueType.FLOAT:
            return 4;
        case TiffTagValueType.RATIONAL:
        case TiffTagValueType.SRATIONAL:
        case TiffTagValueType.DOUBLE:
        case TiffTagValueType.LONG8:
        case TiffTagValueType.SLONG8:
        case TiffTagValueType.IFD8:
            return 8;
        default:
            throw new Error(`Invalid field type: "${fieldType}"`);
    }
}

export type TiffTagValueRational = [number, number];
export type TiffTagValueReaderFunc = (
    view: CogSource,
    offset: number,
) => number | bigint | TiffTagValueRational | string;

const TiffTagValueReader: { [key: string]: TiffTagValueReaderFunc } = {
    char: (view: CogSource, offset: number) => String.fromCharCode(view.uint8(offset)),
    uint8: (view: CogSource, offset: number) => view.uint8(offset),
    uint16: (view: CogSource, offset: number) => view.uint16(offset),
    uint32: (view: CogSource, offset: number) => view.uint32(offset),
    uint64: (view: CogSource, offset: number) => view.uint64(offset),
    double: (view: CogSource, offset: number) => view.double(offset),
    rational: (view: CogSource, offset: number) => [view.uint32(offset), view.uint32(offset + 4)],
};
export function getTiffTagValueReader(fieldType: TiffTagValueType): TiffTagValueReaderFunc {
    switch (fieldType) {
        case TiffTagValueType.ASCII:
            return TiffTagValueReader.char;

        case TiffTagValueType.BYTE:
        case TiffTagValueType.UNDEFINED:
        case TiffTagValueType.SBYTE:
            return TiffTagValueReader.uint8;

        case TiffTagValueType.SHORT:
        case TiffTagValueType.SSHORT:
            return TiffTagValueReader.uint16;

        case TiffTagValueType.LONG:
        case TiffTagValueType.SLONG:
            return TiffTagValueReader.uint32;

        case TiffTagValueType.RATIONAL:
        case TiffTagValueType.SRATIONAL:
            return TiffTagValueReader.rational;

        case TiffTagValueType.DOUBLE:
            return TiffTagValueReader.double;

        case TiffTagValueType.LONG8:
            return TiffTagValueReader.uint64;

        default:
            throw new Error(`Unknown read type "${fieldType}" "${TiffTagValueType[fieldType]}"`);
    }
}
