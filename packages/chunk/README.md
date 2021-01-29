# Chunked object reading

Split up a file into chunks and then read the chunks as needed.

## Example Sources
- File - [@cogeotiff/source-file](https://www.npmjs.com/package/@cogeotiff/source-file)
- AWS - [@cogeotiff/source-aws](https://www.npmjs.com/package/@cogeotiff/source-aws)
- Url - [@cogeotiff/source-url](https://www.npmjs.com/package/@cogeotiff/source-url)

### Example Usage
Fetching Data
```typescript
const source = new SourceUrl('https://example.com/foo')
// Read 1KB chunks
source.chunkSize = 1024;

// Read the first 2KB of the file, or two chunks of data, this will be one HTTP Range requests
if (!source.hasBytes(0, 2048)) await source.loadBytes(0, 2048)

const bytes = source.bytes(0, 2048);
```

Fetching multiple ranges at the same time

```typescript
const source = new SourceUrl('https://example.com/foo')
// Read 1KB chunks
source.chunkSize = 1024;

// Read in the first two KB and 1KB starting at 4KB
// This will do one HTTP Range request for all of the data even though 2048-4096 has not been requested
// Chunks 0 (0-1024), 1 (1024-2048), 2 (2048-3096) 3 (3096-4096) and 4 (4096 - 5120) will be fetched
await Promise.all([
    source.loadBytes(0, 2048), 
    source.loadBytes(4096, 1024)
]) 

const bytes = source.bytes(0, 5120);
```


Reading raw bytes
```typescript
const source = new SourceUrl('https://example.com/foo')

if (!source.hasBytes(0, 1024)) await source.loadBytes(0, 1024)
// Read a UInt8 starting at offset 0
const firstNumber = source.uint8(0);
// Read a buffer from offset 10, with length of 100
const firstBuffer = source.bytes(10, 100)
```