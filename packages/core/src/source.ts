export interface CogSource {
    fetchBytes(offset: number, length?: number): Promise<ArrayBuffer>;
}
