
const REVERSE_ENUM_KEY = '__reverse'
export function getReverseEnumValue<T>(e: Object, value: string): T {
    if (e[REVERSE_ENUM_KEY] == null) {
        const reverse = {};
        for (const key of Object.keys(e)) {
            reverse[e[key]] = key
        }
        Object.defineProperty(e, REVERSE_ENUM_KEY, { enumerable: false, value: reverse, writable: false })
    }
    return e[REVERSE_ENUM_KEY][value];
}
