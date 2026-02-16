/**
 * This is a partial re-implementation of @chunkd/source
 * this is defined here so that @cogeotiff/core does not have any external dependencies
 */
export interface Source {
  /** Where the source is located */
  url: URL;

  /** Optional metadata about the source including the size in bytes of the file */
  metadata?: {
    /** Number of bytes in the file if known */
    size?: number;
  };

  /** Fetch bytes from a source */
  fetch(offset: number, length?: number, options?: {signal?: AbortSignal}): Promise<ArrayBuffer>;

  /** Optionally close the source, useful for sources that have open connections of file descriptors */
  close?(): Promise<void>;
}
