declare namespace Ieee754 {
    interface Static {
        read(buffer: number[] | Uint8Array, offset: number, isLe: boolean, mLen: number, nBytes: number): number;
        write(
            buffer: number[] | Uint8Array,
            value: number,
            offset: number,
            isLE: boolean,
            mLen: number,
            nBytes: number,
        ): void;
    }
}

declare module 'ieee754' {
    const ieee754: Ieee754.Static;
    export = ieee754;
}
