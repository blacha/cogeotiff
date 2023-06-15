export interface Source {
  /** Fetch bytes from a source */
  fetchBytes(offset: number, length?: number): Promise<ArrayBuffer>;
}
