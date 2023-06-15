export interface Source {
  url: URL;
  /** Fetch bytes from a source */
  fetch(offset: number, length?: number): Promise<ArrayBuffer>;
}
