/** Sub file type for tag 254 {@link TiffTag.SubFileType} */
export enum SubFileType {
  /** Reduced resolution version */
  ReducedImage = 1,
  /** One page of many */
  Page = 2,
  /** Transparency mask */
  Mask = 4,
}

export enum Orientation {
  /* row 0 top, col 0 lhs */
  TopLeft = 1,
  /* row 0 top, col 0 rhs */
  TopRight = 2,
  /* row 0 bottom, col 0 rhs */
  BottomRight = 3,
  /* row 0 Bottom, col 0 lhs */
  BottomLeft = 4,
  /* row 0 lhs, col 0 Top */
  LeftTop = 5,
  /* row 0 rhs, col 0 Top */
  RightTOP = 6,
  /* row 0 rhs, col 0 Bottom */
  RightBottom = 7,
  /* row 0 lhs, col 0 Bottom */
  LeftBottom = 8,
}

export enum RasterTypeKey {
  /**
   * PixelIsArea (default) a pixel is treated as an area,
   * the raster coordinate (0,0) is the top left corner of the top left pixel.
   */
  PixelIsArea = 1,

  /**
   * PixelIsPoint treats pixels as point samples with empty space between the "pixel" samples.
   * the raster coordinate (0,0) is the location of the top left raster pixel.
   */
  PixelIsPoint = 2,
}

export enum ModelTypeCode {
  Unknown = 0,
  /** Projection Coordinate System */
  Projected = 1,
  /** Geographic latitude-longitude System */
  Geographic = 2,
  /** Geocentric (X,Y,Z) Coordinate System */
  Geocentric = 3,

  UserDefined = 32767,
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

export enum PlanarConfiguration {
  /** single image plane */
  Contig = 1,
  /** separate planes of data */
  Separate = 2,
}

export enum Predictor {
  None = 1,
  /** Horizontal differencing */
  Horizontal = 2,
  /** Floating point */
  FloatingPoint = 3,
}

export enum SampleFormat {
  /** Unsigned integer data */
  Uint = 1,
  /** Signed integer data */
  Int = 2,
  /** IEEE floating point data */
  Float = 3,
  /** Untyped data */
  Void = 4,
  /** Complex signed int */
  ComplexInt = 5,
  /** Complex ieee floating */
  ComplexFloat = 6,
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

  /**
   * Number of bits per channel
   *
   * @example
   * ```typescript
   * [8,8,8] // 8 bit RGB
   * [16] // 16bit
   * ```
   */
  BitsPerSample = 258,

  /**
   *
   * Data type of the image
   *
   * See {@link SampleFormat}
   *
   * @example
   * ```typescript
   * [1] // SampleFormat.Uint
   * [1,1,1,1] // 4 band Uint
   * ```
   */
  SampleFormat = 339,

  /**
   * Compression Type
   *
   * @see {@link Compression}
   *
   * @example
   * ```typescript
   * 5 // Compression.Lzw
   * ```
   */
  Compression = 259,

  /**
   * Photometric interpretation
   *
   * @see {@link Photometric}
   *
   * @example
   * ```typescript
   * 2 // Photometric.Rgb
   * ```
   */
  Photometric = 262,

  /** Tile width in pixels */
  TileWidth = 322,
  /** Tile height in pixels */
  TileHeight = 323,

  /**
   * Offsets to data tiles
   * `0` means the tile has no data (sparse tiff)
   *
   * @example
   * ```typescript
   * [0, 3200, 1406] // three tiles, first tile does not exist
   * ```
   */
  TileOffsets = 324,
  /**
   *  Byte counts for tiles
   *  `0 means the tile does not exist (sparse tiff)
   *
   * @example
   * ```typescript
   * [0, 3200, 1406] // three tiles, first tile does not exist
   * ```
   **/
  TileByteCounts = 325,

  /** JPEG table stream */
  JpegTables = 347,

  StripOffsets = 273,
  StripByteCounts = 279,

  // GDAL
  /**
   * GDAL metadata
   * Generally a xml document with lots of information about the tiff and how it was created
   */
  GdalMetadata = 42112,

  /**
   * No data value encoded as a string
   *
   * @example "-9999"
   */
  GdalNoData = 42113,

  /**  GeoTiff Tags */

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
  ModelTransformation = 34264,
  /**
   * List of GeoTiff tags
   * {@link TiffTagGeo}
   *
   * {@link https://docs.ogc.org/is/19-008r4/19-008r4.html#_requirements_class_geokeydirectorytag}
   */
  GeoKeyDirectory = 34735,
  /**
   * Double Parameters for GeoTiff Tags
   *
   * {@link TiffTagGeo}
   */
  GeoDoubleParams = 34736,
  /**
   * Ascii Parameters for GeoTiff Tags
   *
   * {@link TiffTagGeo}
   */
  GeoAsciiParams = 34737,

  /**
   * Stores the LERC version and additional compression
   *
   * @example
   * ```typescript
   * [4, 0] // version 4, no extra compression
   * ```
   */
  LercParameters = 50674,

  PlanarConfiguration = 284,

  /** Untyped values */
  CellLength = 265,
  CellWidth = 264,
  ColorMap = 320,
  Copyright = 33432,
  DateTime = 306,
  ExtraSamples = 338,
  FillOrder = 266,
  FreeByteCounts = 289,
  FreeOffsets = 288,
  GrayResponseCurve = 291,
  GrayResponseUnit = 290,
  HostComputer = 316,
  ImageDescription = 270,
  Make = 271,
  MaxSampleValue = 281,
  MinSampleValue = 280,
  Model = 272,
  Orientation = 274,
  ResolutionUnit = 296,
  RowsPerStrip = 278,
  SamplesPerPixel = 277,
  Software = 305,

  Threshholding = 263,
  XResolution = 282,
  YResolution = 283,
  BadFaxLines = 326,
  CleanFaxData = 327,
  ClipPath = 343,
  ConsecutiveBadFaxLines = 328,
  Decode = 433,
  DefaultImageColor = 434,
  DocumentName = 269,
  DotRange = 336,
  HalftoneHints = 321,
  Indexed = 346,
  PageName = 285,
  PageNumber = 297,
  Predictor = 317,
  PrimaryChromaticities = 319,
  ReferenceBlackWhite = 532,
  SMinSampleValue = 340,
  SMaxSampleValue = 341,
  StripRowCounts = 559,
  SubIFDs = 330,
  T4Options = 292,
  T6Options = 293,

  TransferFunction = 301,
  WhitePoint = 318,
  XClipPathUnits = 344,
  XPosition = 286,
  YCbCrCoefficients = 529,
  YCbCrPositioning = 531,
  YCbCrSubSampling = 530,
  YClipPathUnits = 345,
  YPosition = 287,
  ApertureValue = 37378,
  ColorSpace = 40961,
  DateTimeDigitized = 36868,
  DateTimeOriginal = 36867,
  ExifIFD = 34665,
  ExifVersion = 36864,
  ExposureTime = 33434,
  FileSource = 41728,
  Flash = 37385,
  FlashpixVersion = 40960,
  FNumber = 33437,
  ImageUniqueID = 42016,
  LightSource = 37384,
  MakerNote = 37500,
  ShutterSpeedValue = 37377,
  UserComment = 37510,
  IPTC = 33723,
  ICCProfile = 34675,
  XMP = 700,
}

/** Define the expected types for all the tiff tags */
export interface TiffTagType {
  [TiffTag.ImageHeight]: number;
  [TiffTag.ImageWidth]: number;
  [TiffTag.SubFileType]: SubFileType;
  [TiffTag.BitsPerSample]: number[];
  [TiffTag.Compression]: Compression;
  [TiffTag.OldSubFileType]: OldSubFileType;
  [TiffTag.Photometric]: Photometric;

  [TiffTag.TileWidth]: number;
  [TiffTag.TileHeight]: number;
  [TiffTag.TileOffsets]: number[] | Uint32Array | Uint16Array;
  [TiffTag.TileByteCounts]: number[] | Uint32Array | Uint16Array;
  [TiffTag.JpegTables]: number[];

  [TiffTag.StripByteCounts]: number[] | Uint32Array | Uint16Array;
  [TiffTag.StripOffsets]: number[] | Uint32Array | Uint16Array;

  [TiffTag.SamplesPerPixel]: number;
  [TiffTag.SampleFormat]: SampleFormat[];
  [TiffTag.GdalMetadata]: string;
  [TiffTag.GdalNoData]: string;
  [TiffTag.ModelPixelScale]: number[];
  [TiffTag.ModelTiePoint]: number[];
  [TiffTag.ModelTransformation]: number[];
  [TiffTag.GeoKeyDirectory]: number[];
  [TiffTag.GeoDoubleParams]: number[];
  [TiffTag.GeoAsciiParams]: string;

  [TiffTag.PlanarConfiguration]: PlanarConfiguration;
  [TiffTag.Orientation]: Orientation;
  [TiffTag.Predictor]: Predictor;

  [TiffTag.LercParameters]: number[];

  // Untyped values

  [TiffTag.CellLength]: unknown;
  [TiffTag.CellWidth]: unknown;
  [TiffTag.ColorMap]: unknown;
  [TiffTag.Copyright]: unknown;
  [TiffTag.DateTime]: unknown;
  [TiffTag.ExtraSamples]: unknown;
  [TiffTag.FillOrder]: unknown;
  [TiffTag.FreeByteCounts]: unknown;
  [TiffTag.FreeOffsets]: unknown;
  [TiffTag.GrayResponseCurve]: unknown;
  [TiffTag.GrayResponseUnit]: unknown;
  [TiffTag.HostComputer]: unknown;
  [TiffTag.ImageDescription]: unknown;
  [TiffTag.Make]: unknown;
  [TiffTag.MaxSampleValue]: unknown;
  [TiffTag.MinSampleValue]: unknown;
  [TiffTag.Model]: unknown;
  [TiffTag.ResolutionUnit]: unknown;
  [TiffTag.RowsPerStrip]: unknown;
  [TiffTag.Software]: unknown;

  [TiffTag.Threshholding]: unknown;
  [TiffTag.XResolution]: unknown;
  [TiffTag.YResolution]: unknown;
  [TiffTag.BadFaxLines]: unknown;
  [TiffTag.CleanFaxData]: unknown;
  [TiffTag.ClipPath]: unknown;
  [TiffTag.ConsecutiveBadFaxLines]: unknown;
  [TiffTag.Decode]: unknown;
  [TiffTag.DefaultImageColor]: unknown;
  [TiffTag.DocumentName]: unknown;
  [TiffTag.DotRange]: unknown;
  [TiffTag.HalftoneHints]: unknown;
  [TiffTag.Indexed]: unknown;
  [TiffTag.PageName]: unknown;
  [TiffTag.PageNumber]: unknown;
  [TiffTag.PrimaryChromaticities]: unknown;
  [TiffTag.ReferenceBlackWhite]: unknown;
  [TiffTag.SMinSampleValue]: unknown;
  [TiffTag.SMaxSampleValue]: unknown;
  [TiffTag.StripRowCounts]: unknown;
  [TiffTag.SubIFDs]: unknown;
  [TiffTag.T4Options]: unknown;
  [TiffTag.T6Options]: unknown;

  [TiffTag.TransferFunction]: unknown;
  [TiffTag.WhitePoint]: unknown;
  [TiffTag.XClipPathUnits]: unknown;
  [TiffTag.XPosition]: unknown;
  [TiffTag.YCbCrCoefficients]: unknown;
  [TiffTag.YCbCrPositioning]: unknown;
  [TiffTag.YCbCrSubSampling]: unknown;
  [TiffTag.YClipPathUnits]: unknown;
  [TiffTag.YPosition]: unknown;
  [TiffTag.ApertureValue]: unknown;
  [TiffTag.ColorSpace]: unknown;
  [TiffTag.DateTimeDigitized]: unknown;
  [TiffTag.DateTimeOriginal]: unknown;
  [TiffTag.ExifIFD]: unknown;
  [TiffTag.ExifVersion]: unknown;
  [TiffTag.ExposureTime]: unknown;
  [TiffTag.FileSource]: unknown;
  [TiffTag.Flash]: unknown;
  [TiffTag.FlashpixVersion]: unknown;
  [TiffTag.FNumber]: unknown;
  [TiffTag.ImageUniqueID]: unknown;
  [TiffTag.LightSource]: unknown;
  [TiffTag.MakerNote]: unknown;
  [TiffTag.ShutterSpeedValue]: unknown;
  [TiffTag.UserComment]: unknown;
  [TiffTag.IPTC]: unknown;
  [TiffTag.ICCProfile]: unknown;
  [TiffTag.XMP]: unknown;
}

/**
 * Geotiff tags as defined by OGC GeoTiff 1.1
 *
 * {@link https://docs.ogc.org/is/19-008r4/19-008r4.html#_summary_of_geokey_ids_and_names}
 */
export enum TiffTagGeo {
  // GeoTIFF Configuration Keys

  /**
   * This GeoKey defines the type of Model coordinate reference system used, to which the transformation from the raster space is made:
   *
   * {@link https://docs.ogc.org/is/19-008r4/19-008r4.html#_requirements_class_gtmodeltypegeokey}
   *
   * {@link ModelTypeCode}
   */
  GTModelTypeGeoKey = 1024,
  /**
   * There are currently only two options: `RasterPixelIsPoint` and `RasterPixelIsArea`
   *
   * {@link https://docs.ogc.org/is/19-008r4/19-008r4.html#_requirements_class_gtrastertypegeokey}
   *
   * {@link RasterTypeKey}
   */
  GTRasterTypeGeoKey = 1025,
  /**
   * ASCII reference to published documentation on the overall configuration of the GeoTIFF file.
   *
   * @example "NZGD2000 / New Zealand Transverse Mercator 2000"
   */
  GTCitationGeoKey = 1026,

  // Geodetic CRS Parameter Keys
  /**
   * Renamed from GeographicTypeGeoKey in OGC GeoTiff
   */
  GeodeticCRSGeoKey = 2048,
  /**
   * Renamed from GeogCitationGeoKey in OGC GeoTiff
   *
   * @example "NZTM"
   */
  GeodeticCitationGeoKey = 2049,
  /**
   * Renamed from GeogGeodeticDatumGeoKey in OGC GeoTiff
   */
  GeodeticDatumGeoKey = 2050,
  /**
   * Renamed from "GeogPrimeMeridianGeoKey" in OGC GeoTiff
   */
  PrimeMeridianGeoKey = 2051,
  /**
   * Linear unit of measure
   * @example 9001 // Metre
   */
  GeogLinearUnitsGeoKey = 2052,
  GeogLinearUnitSizeGeoKey = 2053,
  /**
   * Angular unit of measure
   *
   * @example 9102 // Degree
   */
  GeogAngularUnitsGeoKey = 2054,
  GeogAngularUnitSizeGeoKey = 2055,
  /**
   * Renamed from "GeogEllipsoidGeoKey" in OGC GeoTiff
   */
  EllipsoidGeoKey = 2056,
  /**
   * Renamed from "GeogSemiMajorAxisGeoKey" in OGC GeoTiff
   */
  EllipsoidSemiMajorAxisGeoKey = 2057,
  /**
   * Renamed from "GeogSemiMinorAxisGeoKey" in OGC GeoTiff
   */
  EllipsoidSemiMinorAxisGeoKey = 2058,
  /**
   * Renamed from "GeogInvFlatteningGeoKey" in OGC GeoTiff
   */
  EllipsoidInvFlatteningGeoKey = 2059,
  /**
   *  Renamed from "GeogPrimeMeridianLongGeoKey" in OGC GeoTiff
   */
  PrimeMeridianLongitudeGeoKey = 2061,

  GeogTOWGS84GeoKey = 2062,

  // Projected CRS Parameter Keys
  GeogAzimuthUnitsGeoKey = 2060,

  /**
   * EPSG code of the tiff
   *
   * Renamed from "ProjectedCSTypeGeoKey" in OGC GeoTiff
   *
   * @example
   * ```typescript
   * 2193 // NZTM
   * 3857 // WebMercatorQuad
   * ```
   */
  ProjectedCRSGeoKey = 3072,
  /**
   * ASCII reference to published documentation on the Projected  Coordinate System
   *
   * Renamed from "PCSCitationGeoKey" in OGC GeoTiff
   *
   * @example "UTM Zone 60 N with WGS 84"
   */
  ProjectedCitationGeoKey = 3073,

  /**
   * Specifies a map projection from the GeoTIFF CRS register or to indicate that the map projection is user-defined.
   *
   * {@link https://docs.ogc.org/is/19-008r4/19-008r4.html#_map_projection_geokeys}
   *
   * @example 2193
   */
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

  /**
   * This key is provided to specify the vertical coordinate reference system from the GeoTIFF CRS register or to indicate that the CRS is a user-defined vertical coordinate reference system. The value for VerticalGeoKey should follow the
   *
   * {@link https://docs.ogc.org/is/19-008r4/19-008r4.html#_requirements_class_verticalgeokey}
   *
   * @example 4979
   */
  VerticalGeoKey = 4096,
  /**
   *
   * @example "Geographic 3D WGS 84, Ellipsoidal height"
   */
  VerticalCitationGeoKey = 4097,
  /**
   * vertical datum for a user-defined vertical coordinate reference system.
   */
  VerticalDatumGeoKey = 4098,
  /**
   * Linear Unit for vertical CRS
   *
   * @example 9001
   */
  VerticalUnitsGeoKey = 4099,
}

/**
 * Define the types for all the geo tiff tags
 *
 * {@link https://docs.ogc.org/is/19-008r4/19-008r4.html#_summary_of_geokey_ids_and_names}
 */
export interface TiffTagGeoType {
  // GeoTIFF Configuration Keys
  [TiffTagGeo.GTModelTypeGeoKey]: ModelTypeCode;
  [TiffTagGeo.GTRasterTypeGeoKey]: RasterTypeKey;
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
  [TiffTagGeo.GeogTOWGS84GeoKey]: number | number[];

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

/**
 * EPSG Angular Units. exist between [9100,  9199]
 *
 * Taken from libgeotiff
 */
export enum AngularUnit {
  Radian = 9101,
  Degree = 9102,
  ArcMinute = 9103,
  ArcDegree = 9104,
  Grad = 9105,
  Gon = 9106,
  Dms = 9107,
}

/**
 * ESPG Liner units exist between [9000,  9099]
 *
 * Taken from libgeotiff
 */
export enum LinearUnit {
  Metre = 9001,
  Foot = 9002,
  FootUsSurvey = 9003,
  FootModifiedAmerican = 9004,
  FootClarke = 9005,
  FootIndian = 9006,
  Link = 9007,
  LinkBenoit = 9008,
  LinkSears = 9009,
  ChainBenoit = 9010,
  ChainSears = 9011,
  YardSears = 9012,
  YardIndian = 9013,
  Fathom = 9014,
  MileInternationalNautical = 9015,
}

/**
 * Convert tiff tag values when being read.
 */
export const TiffTagConvertArray: Partial<Record<TiffTag, boolean>> = {
  [TiffTag.TileByteCounts]: true,
  [TiffTag.TileOffsets]: true,
  [TiffTag.StripOffsets]: true,
  [TiffTag.StripByteCounts]: true,
  [TiffTag.BitsPerSample]: true,
  [TiffTag.SampleFormat]: true,
  [TiffTag.GeoKeyDirectory]: true,
  [TiffTag.GeoDoubleParams]: true,
};
