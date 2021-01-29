// import { Fetchable } from '@cogeotiff/fetchable';
// import { ChunkSource } from './chunk.source';

// /**
//  * A chunk of data inside of a COG
//  */
// export class Chunk {
//     /** Id of the chunk, the index of the chunk starting at 0 */
//     id: number;
//     /** Lazy load the chunk when requested */
//     fetchable: Fetchable<Chunk>;
//     /** Raw buffer object, often is null @see this.buffer */
//     private _buffer: ArrayBuffer | null = null;
//     /** Raw view, often is null @see this.view */
//     private _view: DataView | null = null;
//     source: ChunkSource;

//     constructor(source: ChunkSource, id: number) {
//         this.source = source;
//         this.id = id;
//         this.fetchable = new Fetchable(async () => {
//             // Sometimes things will init the chunk without a fetch being needed.
//             if (this._buffer != null) {
//                 return this;
//             }

//             const buffer = await this.source.fetchBytes(this.offset, this.source.chunkSize);
//             this.init(buffer);
//             return this;
//         });
//     }

//     /**
//      * Initialize the chunk with some data
//      * @param buffer initial chunk data
//      */
//     init(buffer: ArrayBuffer): void {
//         this._buffer = buffer;
//     }

//     /**
//      * Load the chunk data from the source
//      */
//     fetch(): Promise<Chunk> {
//         if (this._buffer == null) return this.fetchable.fetch();
//         return Promise.resolve(this);
//     }

//     /**
//      * Has this chunk fetched it's data
//      */
//     get isReady(): boolean {
//         return this._buffer != null;
//     }

//     /**
//      * Get or create the DataView if the chunk has loaded
//      * @throws if the chunk has not been loaded
//      */
//     get view(): DataView {
//         if (this._buffer != null) {
//             if (this._view == null) this._view = new DataView(this._buffer);
//             return this._view;
//         }
//         throw new Error(`Chunk:${this.id} is not ready`);
//     }

//     /**
//      * Get the chunk buffer the chunk has loaded
//      * @throws if the chunk has not been loaded
//      */
//     get buffer(): ArrayBuffer {
//         if (this._buffer != null) return this._buffer;
//         throw new Error(`Chunk:${this.id} is not ready`);
//     }

//     /**
//      * Byte offset for this chunk
//      */
//     get offset(): number {
//         return this.id * this.source.chunkSize;
//     }

//     /**
//      * Byte offset that is where this chunk ends
//      */
//     get offsetEnd(): number {
//         return this.offset + this.source.chunkSize;
//     }

//     /**
//      * Number of bytes currently ready to be read
//      */
//     get length(): number | undefined {
//         if (this._buffer != null) return this._buffer.byteLength;
//     }

//     /**
//      * Does this chunk contain the byte offset
//      * @param offset byte offset to check
//      */
//     contains(offset: number): boolean {
//         if (offset < this.offset) return false;
//         if (offset >= this.offsetEnd) return false;
//         return true;
//     }

//     toString(): string {
//         return `<Chunk:${this.id} offset:${this.offset} length:${this.length}>`;
//     }
// }
