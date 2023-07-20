/**
 * Convert a number to a formatted hex string
 *
 * @param num number to convert
 * @param padding number of 0's to pad the digit with
 * @param prefix should a `0x` be prefixed to the string
 *
 * @returns hex string eg 0x0015
 **/
export function toHex(num: number, padding = 4, prefix = true): string {
  const hex = num.toString(16).padStart(padding, '0');
  if (prefix) return '0x' + hex;
  return hex;
}
