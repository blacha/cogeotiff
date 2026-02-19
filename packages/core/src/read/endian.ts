
const buffer = new ArrayBuffer(4);
const uint32 = new Uint32Array(buffer);
const uint8 = new Uint8Array(buffer);
uint32[0] = 1;

export const isLittleEndian = uint8[0] === 1;
