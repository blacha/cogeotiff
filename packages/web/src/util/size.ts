const byteSizes = ['B', 'KB', 'MB', 'GB', 'TB'];
export function formatSize(bytes: number): string {
    for (const size of byteSizes) {
        if (bytes < 1024) return `${Number(bytes.toFixed(2))} ${size}`;
        bytes /= 1024;
    }
    return 'Unknown';
}
