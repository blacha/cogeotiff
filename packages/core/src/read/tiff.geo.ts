export interface GeoTag {
    [key: number]: number | string;
}
/**
 * Parse static keys from geoTags
 * TODO this should also lookup values from other values inside the header
 */
export function parseGeoTags(geoTags: number[]): GeoTag {
    const output: GeoTag = {};
    for (let i = 4; i <= geoTags[3] * 4; i += 4) {
        const key = geoTags[i];
        const location = geoTags[i + 1];
        const offset = geoTags[i + 3];

        if (location == 0) {
            output[key] = offset;
        }
    }
    return output;
}
