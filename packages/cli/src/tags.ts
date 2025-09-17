import type { TiffTagGeoType, TiffTagType } from '@cogeotiff/core';
import {
  AngularUnit,
  Compression,
  LinearUnit,
  ModelTypeCode,
  Orientation,
  Photometric,
  PlanarConfiguration,
  RasterTypeKey,
  SampleFormat,
  SubFileType,
  TiffTag,
  TiffTagGeo,
} from '@cogeotiff/core';

/** Convert enum values back to strings */
export const TagGeoFormatters = {
  [TiffTagGeo.GTRasterTypeGeoKey]: (v: TiffTagGeoType[TiffTagGeo.GTRasterTypeGeoKey]) => RasterTypeKey[v],
  [TiffTagGeo.GTModelTypeGeoKey]: (v: TiffTagGeoType[TiffTagGeo.GTModelTypeGeoKey]) => ModelTypeCode[v],
  [TiffTagGeo.GeogAngularUnitsGeoKey]: (v: TiffTagGeoType[TiffTagGeo.GeogAngularUnitsGeoKey]) => AngularUnit[v],
  [TiffTagGeo.ProjLinearUnitsGeoKey]: (v: TiffTagGeoType[TiffTagGeo.ProjLinearUnitsGeoKey]) => LinearUnit[v],
  [TiffTagGeo.VerticalUnitsGeoKey]: (v: TiffTagGeoType[TiffTagGeo.VerticalUnitsGeoKey]) => LinearUnit[v],
} as Record<number, (v: number | number[]) => string>;

export const TagFormatters = {
  [TiffTag.LercParameters]: (value: TiffTagType[TiffTag.LercParameters]): string => {
    return `v${value[0]} - ${Compression[value[1]] ?? '??'}`;
  },
  [TiffTag.SubFileType]: (value: TiffTagType[TiffTag.SubFileType]): string => SubFileType[value],
  [TiffTag.Compression]: (value: TiffTagType[TiffTag.Compression]): string => Compression[value],
  [TiffTag.Orientation]: (value: TiffTagType[TiffTag.Orientation]): string => Orientation[value],
  [TiffTag.SampleFormat]: (value: TiffTagType[TiffTag.SampleFormat]): string => {
    return value.map((m) => SampleFormat[m]).join(', ');
  },
  [TiffTag.Photometric]: (value: TiffTagType[TiffTag.Photometric]): string => Photometric[value],
  [TiffTag.PlanarConfiguration]: (value: TiffTagType[TiffTag.PlanarConfiguration]): string => {
    return PlanarConfiguration[value];
  },
} as Record<number, (v: number | number[]) => string>;
