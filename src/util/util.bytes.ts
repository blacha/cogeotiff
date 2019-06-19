const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

export function toByteSizeString(bytes: number) {
    if (bytes == 1) return '1 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const output = bytes / Math.pow(1024, i);
    const byteSize = sizes[i];

    if (i == 1) {
        return `${Math.round(output)} ${byteSize}`;
    }
    return `${Math.floor(output * 100) / 100} ${byteSize}`;
}
