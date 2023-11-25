/** Sub file type for tag 254 {@link TiffTag.SubFileType} */
export enum SubFileType {
  /** Reduced resolution version */
  ReducedImage = 1,
  /** One page of many */
  Page = 2,
  /** Transparency mask */
  Mask = 4,
}

/** Sub file type for tag 255 {@link TiffTag.OldSubFileType} */
export enum OldSubFileType {
  /** Full resolution image data */
  Image = 1,
  /** Reduced resolution version */
  ReducedImage = 2,
  /** One page of many */
  Page = 3,
}
/** Tiff compression types */
export enum Compression {
  None = 1,
  Lzw = 5,
  Jpeg6 = 6,
  Jpeg = 7,
  DeflateOther = 8,
  Deflate = 32946,
  Jp2000 = 3417,
  Lerc = 34887,
  Lzma = 34925,
  Zstd = 50000,
  Webp = 50001,
  JpegXl = 50002,
}

export enum Photometric {
  /** min value is white */
  MinIsWhite = 0,
  /** min value is black */
  MinIsBlack = 1,
  /** RGB color model */
  Rgb = 2,
  /** color map indexed */
  Palette = 3,
  /** $holdout mask */
  Mask = 4,
  /** !color separations */
  Separated = 5,
  /** !CCIR 601 */
  Ycbcr = 6,
  /** !1976 CIE L*a*b* */
  Cielab = 8,
  /** ICC L*a*b* [Adobe TIFF Technote 4] */
  Icclab = 9,
  /** ITU L*a*b* */
  Itulab = 10,
  /** color filter array */
  Cfa = 32803,
  /** CIE Log2(L) */
  Logl = 32844,
  Logluv = 32845,
}

/**
 * Tiff tags as defined by libtiff and libgeotiff
 *
 * - {@link https://gitlab.com/libtiff/libtiff}
 * - {@link https://github.com/OSGeo/libgeotiff/}
 */
export enum TiffTag {
  /**
   * Type of the sub file
   *
   * @see {@link SubFileType}
   */
  SubFileType = 254,

  /**
   * Type of sub file
   *
   * @see {@link OldSubFileType}
   */
  OldSubFileType = 255,

  /** Width of image in pixels */
  ImageWidth = 256,

  /** Height of image in pixels */
  ImageHeight = 257,

  /** Number of bits per channel */
  BitsPerSample = 258,

  /**
   * Compression Type
   *
   * @see {@link Compression}
   */
  Compression = 259,

  /**
   * Photometric interpretation
   *
   * @see {@link Photometric}
   */
  Photometric = 262,

  // Artist = 0x013b,
  // BitsPerSample = 0x0102,
  // CellLength = 0x0109,
  // CellWidth = 0x0108,
  // ColorMap = 0x0140,
  // /**
  //  * Compression type
  //  * {@link Compression}
  //  */
  // Compression = 0x0103,
  // Copyright = 0x8298,
  // DateTime = 0x0132,
  // ExtraSamples = 0x0152,
  // FillOrder = 0x010a,
  // FreeByteCounts = 0x0121,
  // FreeOffsets = 0x0120,
  // GrayResponseCurve = 0x0123,
  // GrayResponseUnit = 0x0122,
  // HostComputer = 0x013c,
  // ImageDescription = 0x010e,
  // /**
  //  * Height of the image in pixels
  //  */
  // ImageHeight = 0x0101,
  // /**
  //  * Width of the image in pixels
  //  */
  // ImageWidth = 0x0100,
  // Make = 0x010f,
  // MaxSampleValue = 0x0119,
  // MinSampleValue = 0x0118,
  // Model = 0x0110,
  // /**
  //  * Subfile data descriptor
  //  */
  // NewSubFileType = 254,
  // Orientation = 0x0112,
  // PhotometricInterpretation = 0x0106,
  // PlanarConfiguration = 0x011c,
  // ResolutionUnit = 0x0128,
  // RowsPerStrip = 0x0116,
  // SamplesPerPixel = 0x0115,
  // Software = 0x0131,
  // StripByteCounts = 0x0117,
  // StripOffsets = 0x0111,
  // OldSubFileType = 0x00ff,
  // Threshholding = 0x0107,
  // XResolution = 0x011a,
  // YResolution = 0x011b,

  // // TIFF Extended
  // BadFaxLines = 0x0146,
  // CleanFaxData = 0x0147,
  // ClipPath = 0x0157,
  // ConsecutiveBadFaxLines = 0x0148,
  // Decode = 0x01b1,
  // DefaultImageColor = 0x01b2,
  // DocumentName = 0x010d,
  // DotRange = 0x0150,
  // HalftoneHints = 0x0141,
  // Indexed = 0x015a,
  // /**
  //  * JPEG quantization and/or Huffman tables.
  //  *
  //  * This field is only set when {@link TiffTag.Compression} is JPEG
  //  *
  //  * @type {number[]}
  //  * @default null
  //  */
  // JPEGTables = 0x015b,
  // PageName = 0x011d,
  // PageNumber = 0x0129,
  // Predictor = 0x013d,
  // PrimaryChromaticities = 0x013f,
  // ReferenceBlackWhite = 0x0214,
  // SampleFormat = 0x0153,
  // SMinSampleValue = 0x0154,
  // SMaxSampleValue = 0x0155,
  // StripRowCounts = 0x022f,
  // SubIFDs = 0x014a,
  // T4Options = 0x0124,
  // T6Options = 0x0125,
  // TileByteCounts = 0x0145,
  // TileHeight = 0x0143,
  // TileOffsets = 0x0144,
  // TileWidth = 0x0142,
  // TransferFunction = 0x012d,
  // WhitePoint = 0x013e,
  // XClipPathUnits = 0x0158,
  // XPosition = 0x011e,
  // YCbCrCoefficients = 0x0211,
  // YCbCrPositioning = 0x0213,
  // YCbCrSubSampling = 0x0212,
  // YClipPathUnits = 0x0159,
  // YPosition = 0x011f,

  // // EXIF
  // ApertureValue = 0x9202,
  // ColorSpace = 0xa001,
  // DateTimeDigitized = 0x9004,
  // DateTimeOriginal = 0x9003,
  // ExifIFD = 0x8769,
  // ExifVersion = 0x9000,
  // ExposureTime = 0x829a,
  // FileSource = 0xa300,
  // Flash = 0x9209,
  // FlashpixVersion = 0xa000,
  // FNumber = 0x829d,
  // ImageUniqueID = 0xa420,
  // LightSource = 0x9208,
  // MakerNote = 0x927c,
  // ShutterSpeedValue = 0x9201,
  // UserComment = 0x9286,

  // // IPTC
  // IPTC = 0x83bb,

  // // ICC
  // ICCProfile = 0x8773,

  // // XMP
  // XMP = 0x02bc,

  // // GDAL
  // GdalMetadata = 0xa480,
  // GdalNoData = 0xa481,
  // LercParams = 0xc5f2,

  // // Photoshop
  // Photoshop = 0x8649,

  // GeoTiff Tags

  /**
   * Pixel scale in meters
   * in the format [scaleX, scaleY, scaleZ]
   *
   * Requires {@link ModelTiePoint} to be set and {@link ModelTransformation} not to be set
   *
   * @example
   * ```typescript
   * [100.0, 100.0, 0.0]
   * ```
   */
  ModelPixelScale = 33550,
  /**
   * Position of the tiff
   *
   * contains a list of tie points that contain
   * [x,y,z] of position in the in the tiff, generally [0,0,0]
   * [x,y,z] of the position in the projected
   *
   * @example
   * Mapping tiff point `[0,0,0]` to projected coordinates `[350807.4, 5316081.3, 0.0]`
   * ```
   * [0, 0, 0, 350807.4, 5316081.3, 0.0]
   * ```
   */
  ModelTiePoint = 33922,

  /**
   * Exact affine transformation between the tiff and the projected location
   *
   * this tag should not be defined when {@link ModelTiePoint} or {@link ModelPixelScale} are used
   *
   * @example
   *```typescript
   *   [ 0, 100.0, 0, 400000.0,
   * 100.0,     0, 0, 500000.0,
   *     0,     0, 0,        0,
   *     0,     0, 0,        1]
   * ```
   */
  ModelTransformation = 34744,
  /**
   * List of GeoTiff tags
   * {@link TiffTagGeo}
   *
   * {@link https://docs.ogc.org/is/19-008r4/19-008r4.html#_requirements_class_geokeydirectorytag}
   */
  GeoKeyDirectory = 34745,
  /**
   * Double Parameters for GeoTiff Tags
   *
   * {@link TiffTagGeo}
   */
  GeoDoubleParams = 34746,
  /**
   * Ascii Parameters for GeoTiff Tags
   *
   * {@link TiffTagGeo}
   */
  GeoAsciiParams = 34747,
}

/** Define the expected types for all the tiff tags */
export interface TiffTagType {
  ImageHeight: number;
  ImageWidth: number;
  SubFileType: SubFileType;
  BitsPerSample: number[];
  Compression: Compression | number;
  OldSubFileType: OldSubFileType;
  Photometric: Photometric;

  // [TiffTag.Artist]: unknown;
  // [TiffTag.CellLength]: unknown;
  // [TiffTag.CellWidth]: unknown;
  // [TiffTag.ColorMap]: unknown;
  // [TiffTag.Copyright]: unknown;
  // [TiffTag.DateTime]: unknown;
  // [TiffTag.ExtraSamples]: unknown;
  // [TiffTag.FillOrder]: unknown;
  // [TiffTag.FreeByteCounts]: unknown;
  // [TiffTag.FreeOffsets]: unknown;
  // [TiffTag.GrayResponseCurve]: unknown;
  // [TiffTag.GrayResponseUnit]: unknown;
  // [TiffTag.HostComputer]: unknown;
  // [TiffTag.ImageDescription]: unknown;

  // [TiffTag.Make]: unknown;
  // [TiffTag.MaxSampleValue]: unknown;
  // [TiffTag.MinSampleValue]: unknown;
  // [TiffTag.Model]: unknown;
  // [TiffTag.Orientation]: unknown;
  // [TiffTag.PhotometricInterpretation]: unknown;
  // [TiffTag.PlanarConfiguration]: unknown;
  // [TiffTag.ResolutionUnit]: unknown;
  // [TiffTag.RowsPerStrip]: unknown;
  // [TiffTag.SamplesPerPixel]: unknown;
  // [TiffTag.Software]: unknown;
  // [TiffTag.StripByteCounts]: unknown;
  // [TiffTag.StripOffsets]: unknown;
  // [TiffTag.Threshholding]: unknown;
  // [TiffTag.XResolution]: unknown;
  // [TiffTag.YResolution]: unknown;

  // // TIFF Extended
  // [TiffTag.BadFaxLines]: unknown;
  // [TiffTag.CleanFaxData]: unknown;
  // [TiffTag.ClipPath]: unknown;
  // [TiffTag.ConsecutiveBadFaxLines]: unknown;
  // [TiffTag.Decode]: unknown;
  // [TiffTag.DefaultImageColor]: unknown;
  // [TiffTag.DocumentName]: unknown;
  // [TiffTag.DotRange]: unknown;
  // [TiffTag.HalftoneHints]: unknown;
  // [TiffTag.Indexed]: unknown;
  // [TiffTag.JPEGTables]: number[];
  // [TiffTag.PageName]: unknown;
  // [TiffTag.PageNumber]: unknown;
  // [TiffTag.Predictor]: unknown;
  // [TiffTag.PrimaryChromaticities]: unknown;
  // [TiffTag.ReferenceBlackWhite]: unknown;
  // [TiffTag.SampleFormat]: unknown;
  // [TiffTag.SMinSampleValue]: unknown;
  // [TiffTag.SMaxSampleValue]: unknown;
  // [TiffTag.StripRowCounts]: unknown;
  // [TiffTag.SubIFDs]: unknown;
  // [TiffTag.T4Options]: unknown;
  // [TiffTag.T6Options]: unknown;
  // [TiffTag.TileByteCounts]: unknown;
  // [TiffTag.TileHeight]: unknown;
  // [TiffTag.TileOffsets]: unknown;
  // [TiffTag.TileWidth]: unknown;
  // [TiffTag.TransferFunction]: unknown;
  // [TiffTag.WhitePoint]: unknown;
  // [TiffTag.XClipPathUnits]: unknown;
  // [TiffTag.XPosition]: unknown;
  // [TiffTag.YCbCrCoefficients]: unknown;
  // [TiffTag.YCbCrPositioning]: unknown;
  // [TiffTag.YCbCrSubSampling]: unknown;
  // [TiffTag.YClipPathUnits]: unknown;
  // [TiffTag.YPosition]: unknown;

  // // EXIF
  // [TiffTag.ApertureValue]: unknown;
  // [TiffTag.ColorSpace]: unknown;
  // [TiffTag.DateTimeDigitized]: unknown;
  // [TiffTag.DateTimeOriginal]: unknown;
  // [TiffTag.ExifIFD]: unknown;
  // [TiffTag.ExifVersion]: unknown;
  // [TiffTag.ExposureTime]: unknown;
  // [TiffTag.FileSource]: unknown;
  // [TiffTag.Flash]: unknown;
  // [TiffTag.FlashpixVersion]: unknown;
  // [TiffTag.FNumber]: unknown;
  // [TiffTag.ImageUniqueID]: unknown;
  // [TiffTag.LightSource]: unknown;
  // [TiffTag.MakerNote]: unknown;
  // [TiffTag.ShutterSpeedValue]: unknown;
  // [TiffTag.UserComment]: unknown;

  // // IPTC
  // [TiffTag.IPTC]: unknown;

  // // ICC
  // [TiffTag.ICCProfile]: unknown;

  // // XMP
  // [TiffTag.XMP]: unknown;

  // // GDAL
  // [TiffTag.GdalMetadata]: unknown;
  // [TiffTag.GdalNoData]: unknown;
  // [TiffTag.LercParams]: unknown;

  // // Photoshop
  // [TiffTag.Photoshop]: unknown;

  // GeoTiff
  [TiffTag.ModelPixelScale]: number[];
  [TiffTag.ModelTiePoint]: number[];
  [TiffTag.ModelTransformation]: number[];
  [TiffTag.GeoKeyDirectory]: number[];
  [TiffTag.GeoDoubleParams]: number[];
  [TiffTag.GeoAsciiParams]: string;
}

/**
 * Geotiff tags as defined by OGC GeoTiff 1.1
 *
 * {@link https://docs.ogc.org/is/19-008r4/19-008r4.html#_summary_of_geokey_ids_and_names}
 */
export enum TiffTagGeo {
  // GeoTIFF Configuration Keys
  GTModelTypeGeoKey = 1024,
  GTRasterTypeGeoKey = 1025,
  GTCitationGeoKey = 1026,

  // Geodetic CRS Parameter Keys
  GeodeticCRSGeoKey = 2048,
  GeodeticCitationGeoKey = 2049,
  GeodeticDatumGeoKey = 2050,
  PrimeMeridianGeoKey = 2051,
  GeogLinearUnitsGeoKey = 2052,
  GeogLinearUnitSizeGeoKey = 2053,
  GeogAngularUnitsGeoKey = 2054,
  GeogAngularUnitSizeGeoKey = 2055,
  EllipsoidGeoKey = 2056,
  EllipsoidSemiMajorAxisGeoKey = 2057,
  EllipsoidSemiMinorAxisGeoKey = 2058,
  EllipsoidInvFlatteningGeoKey = 2059,
  PrimeMeridianLongitudeGeoKey = 2061,

  GeogTOWGS84GeoKey = 2062,

  // Projected CRS Parameter Keys
  GeogAzimuthUnitsGeoKey = 2060,

  /**
   * EPSG code of the tiff
   */
  ProjectedCRSGeoKey = 3072,
  /**
   *
   * @example "UTM Zone 60 N with WGS 84"
   */
  ProjectedCitationGeoKey = 3073,

  ProjectionGeoKey = 3074,
  ProjMethodGeoKey = 3075,
  ProjLinearUnitsGeoKey = 3076,
  ProjLinearUnitSizeGeoKey = 3077,
  ProjStdParallel1GeoKey = 3078,
  ProjStdParallel2GeoKey = 3079,
  ProjNatOriginLongGeoKey = 3080,
  ProjNatOriginLatGeoKey = 3081,
  ProjFalseEastingGeoKey = 3082,
  ProjFalseNorthingGeoKey = 3083,
  ProjFalseOriginLongGeoKey = 3084,
  ProjFalseOriginLatGeoKey = 3085,
  ProjFalseOriginEastingGeoKey = 3086,
  ProjFalseOriginNorthingGeoKey = 3087,
  ProjCenterLongGeoKey = 3088,
  ProjCenterLatGeoKey = 3089,
  ProjCenterEastingGeoKey = 3090,
  ProjCenterNorthingGeoKey = 3091,
  ProjScaleAtNatOriginGeoKey = 3092,
  ProjScaleAtCenterGeoKey = 3093,
  ProjAzimuthAngleGeoKey = 3094,
  ProjStraightVertPoleLongGeoKey = 3095,
  ProjRectifiedGridAngleGeoKey = 3096,

  // Vertical CRS Parameter Keys (4096-5119)

  VerticalGeoKey = 4096,
  VerticalCitationGeoKey = 4097,
  /**
   * vertical datum for a user-defined vertical coordinate reference system.
   *
   * {@link }
   */
  VerticalDatumGeoKey = 4098,
  VerticalUnitsGeoKey = 4099,
}

/**
 * Define the types for all the geo tiff tags
 *
 * {@link https://docs.ogc.org/is/19-008r4/19-008r4.html#_summary_of_geokey_ids_and_names}
 */
export interface TiffTagGeoType {
  // GeoTIFF Configuration Keys
  GTModelTypeGeoKey: number;
  [TiffTagGeo.GTRasterTypeGeoKey]: number;
  [TiffTagGeo.GTCitationGeoKey]: string;

  // Geodetic CRS Parameter Keys
  [TiffTagGeo.GeodeticCRSGeoKey]: number;
  [TiffTagGeo.GeodeticCitationGeoKey]: string;
  [TiffTagGeo.GeodeticDatumGeoKey]: number;
  [TiffTagGeo.PrimeMeridianGeoKey]: number;
  [TiffTagGeo.GeogLinearUnitsGeoKey]: number;
  [TiffTagGeo.GeogLinearUnitSizeGeoKey]: number;
  [TiffTagGeo.GeogAngularUnitsGeoKey]: number;
  [TiffTagGeo.GeogAngularUnitSizeGeoKey]: number;
  [TiffTagGeo.EllipsoidGeoKey]: number;
  [TiffTagGeo.EllipsoidSemiMajorAxisGeoKey]: number;
  [TiffTagGeo.EllipsoidSemiMinorAxisGeoKey]: number;
  [TiffTagGeo.EllipsoidInvFlatteningGeoKey]: number;
  [TiffTagGeo.GeogAzimuthUnitsGeoKey]: number;
  [TiffTagGeo.PrimeMeridianLongitudeGeoKey]: number;
  [TiffTagGeo.GeogTOWGS84GeoKey]: number;

  // Projected CRS Parameter Keys
  [TiffTagGeo.ProjectedCRSGeoKey]: number;
  [TiffTagGeo.ProjectedCitationGeoKey]: string;
  [TiffTagGeo.ProjectionGeoKey]: number;
  [TiffTagGeo.ProjMethodGeoKey]: number;
  [TiffTagGeo.ProjLinearUnitsGeoKey]: number;
  [TiffTagGeo.ProjLinearUnitSizeGeoKey]: number;
  [TiffTagGeo.ProjStdParallel1GeoKey]: number;
  [TiffTagGeo.ProjStdParallel2GeoKey]: number;
  [TiffTagGeo.ProjNatOriginLongGeoKey]: number;
  [TiffTagGeo.ProjNatOriginLatGeoKey]: number;
  [TiffTagGeo.ProjFalseEastingGeoKey]: number;
  [TiffTagGeo.ProjFalseNorthingGeoKey]: number;
  [TiffTagGeo.ProjFalseOriginLongGeoKey]: number;
  [TiffTagGeo.ProjFalseOriginLatGeoKey]: number;
  [TiffTagGeo.ProjFalseOriginEastingGeoKey]: number;
  [TiffTagGeo.ProjFalseOriginNorthingGeoKey]: number;
  [TiffTagGeo.ProjCenterLongGeoKey]: number;
  [TiffTagGeo.ProjCenterLatGeoKey]: number;
  [TiffTagGeo.ProjCenterEastingGeoKey]: number;
  [TiffTagGeo.ProjCenterNorthingGeoKey]: number;
  [TiffTagGeo.ProjScaleAtNatOriginGeoKey]: number;
  [TiffTagGeo.ProjScaleAtCenterGeoKey]: number;
  [TiffTagGeo.ProjAzimuthAngleGeoKey]: number;
  [TiffTagGeo.ProjStraightVertPoleLongGeoKey]: number;
  [TiffTagGeo.ProjRectifiedGridAngleGeoKey]: number;

  // Vertical CRS Parameter Keys
  [TiffTagGeo.VerticalGeoKey]: number;
  [TiffTagGeo.VerticalCitationGeoKey]: string;
  [TiffTagGeo.VerticalDatumGeoKey]: number;
  [TiffTagGeo.VerticalUnitsGeoKey]: number;
}

// const get

// export type GeoMap = Record<K n TiffTagGeo, TiffTagGeoType[K]>;

// interface Gk<K extends keyof typeof TiffTagGeo = keyof typeof TiffTagGeo> {
//   [k: K in TiffTagGeo]: TiffTagGeoType[TiffTagGeo[K]];
// }

export enum Foo {
  str = 1,
  int = 2,
}

export interface FooType {
  str: string;
  int: number;
}

type TagsGeo = {
  [K in keyof TiffTagGeoType]: TiffTagGeoType[K];
};

type Tags = {
  [K in keyof typeof TiffTag]: TiffTagType[K];
};

const img: { tags: Tags; geo: TagsGeo };

img.geo.GTModelTypeGeoKey;
img.tags.BitsPerSample;
