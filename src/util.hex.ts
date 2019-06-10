export function toHexString(num: number, padding = 2, raw = false): string {
    let hex = num.toString(16)
    while (hex.length < padding) {
        hex = '0' + hex;
    }
    if (raw) {
        return hex;
    }
    return '0x' + hex;
}
