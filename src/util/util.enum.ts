const REVERSE_ENUM_KEY = '__reverse';
export function getReverseEnumValue<T>(e: Record<string, string>, value: string): T {
    if (e[REVERSE_ENUM_KEY] == null) {
        const reverse: Record<string, any> = {};
        for (const key of Object.keys(e)) {
            const val = e[key];
            reverse[val] = key;
        }
        Object.defineProperty(e, REVERSE_ENUM_KEY, { enumerable: false, value: reverse, writable: false });
    }
    return e[REVERSE_ENUM_KEY][value as any] as any;
}
