export interface Source {
  /** Where the source is located */
  url: URL;
  /** Optional metadata about the source including the size which */
  metadata?: {
    /** Number of bytes in the file if known */
    size?: number;
  };
  /** Fetch bytes from a source */
  fetch(offset: number, length?: number): Promise<ArrayBuffer>;

  /** Optionally close the source, useful for sources that have open connections of file descriptors */
  close?(): Promise<void>;
}
