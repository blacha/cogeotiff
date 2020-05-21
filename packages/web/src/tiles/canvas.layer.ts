import { TileMatrixSet } from '@basemaps/geo';
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import { drawTile } from './tile.draw';
import { Tiler } from './tiler';

const BackgroundCanvas = document.createElement('canvas') as HTMLCanvasElement;
const MissingStyle = `rgba(255,0,255,0.1)`;

export const TileCount = new Map<string, Set<string>>();

const SupportedCompression = new Set(['image/jpeg', 'image/webp']);

export class CanvasTiler {
    cogs: CogTiff[] = [];

    tms?: TileMatrixSet;
    tiler?: Tiler;

    get id(): string {
        return this.cogs.map((c) => c.source.uri).join('::') + '::' + this.tms?.def.identifier;
    }

    get name(): string {
        return this.tms?.def.identifier ?? '';
    }

    async drawTile(canvas: HTMLCanvasElement, x: number, y: number, z: number): Promise<void> {
        if (this.tms == null) return this.drawTileCog(canvas, x, y, z);
        return this.drawTileTms(canvas, x, y, z);
    }

    track(source: string, x: number, y: number, z: number): void {
        let counter = TileCount.get(source);
        if (counter == null) {
            counter = new Set();
            TileCount.set(source, counter);
        }
        // Count the number of tiles rendered
        const tileId = `z${z}-${x}-${y}`;
        counter.add(tileId);
    }

    drawUnsupported(img: CogTiffImage, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = MissingStyle;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px "Roboto Condensed"';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.87)';
        ctx.fillText('Unsupported compression:' + img.compression, 128, 128);
        ctx.fillText(img.tif.source.uri, 128, 100);
    }

    async drawTileCog(canvas: HTMLCanvasElement, x: number, y: number, z: number): Promise<void> {
        const ctx = canvas.getContext('2d');
        if (ctx == null) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const cog of this.cogs) {
            const img = cog.images[cog.images.length - 1 - z];
            if (img == null) continue;
            if (!SupportedCompression.has(img.compression!)) {
                this.drawUnsupported(img, canvas, ctx);
                continue;
            }

            const xy = img.tileCount;
            if (x >= xy.x || y >= xy.y) {
                ctx.fillStyle = MissingStyle;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                continue;
            }

            this.track(cog.source.uri, x, y, z);

            const tileData = await img.getTile(x, y);
            if (tileData == null) {
                ctx.fillStyle = MissingStyle;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                continue;
            }

            const imgEl = await this.loadImage(tileData.bytes, tileData.mimeType);
            ctx.drawImage(imgEl, 0, 0, imgEl.width, imgEl.height, 0, 0, canvas.width, canvas.height);
        }
    }

    async drawTileTms(canvas: HTMLCanvasElement, x: number, y: number, z: number): Promise<void> {
        const ctx = canvas.getContext('2d');
        if (ctx == null) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (this.tms == null) throw new Error('TileMatrixSet required for drawing with TMS');
        if (this.tiler == null) this.tiler = new Tiler(this.tms);

        const composition = this.tiler.tile(this.cogs, x, y, z);
        if (composition == null) return;

        const promises = composition.map(async (c) => {
            const tiffImage = c.tiff.getImage(c.source.imageId);
            if (!SupportedCompression.has(tiffImage.compression!)) {
                return async (): Promise<void> => this.drawUnsupported(tiffImage, canvas, ctx);
            }

            const tile = await c.tiff.getTile(c.source.x, c.source.y, c.source.imageId);
            if (tile == null) return null;
            this.track(c.tiff.source.uri, c.source.x, c.source.y, c.source.imageId);

            const img = await this.loadImage(tile.bytes, tile.mimeType);
            return (): Promise<void> => drawTile(ctx, BackgroundCanvas, img, c.tiff, c);
        });

        const funcs = await Promise.all(promises);
        for (const renderTile of funcs) renderTile?.();
    }

    async loadImage(bytes: Uint8Array, mimeType: string): Promise<HTMLImageElement> {
        const img = new Image();
        const blob = new Blob([bytes], { type: mimeType });
        await new Promise<void>((resolve) => {
            img.onload = (): void => {
                URL.revokeObjectURL(img.src);
                resolve();
            };
            img.src = URL.createObjectURL(blob);
        });
        return img;
    }
}
