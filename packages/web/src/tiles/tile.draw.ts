import { CogTiff } from '@cogeotiff/core';
import { Composition } from './tiler';

export async function drawTile(
    ctx: CanvasRenderingContext2D,
    canvasB: HTMLCanvasElement,
    imgData: HTMLImageElement,
    cog: CogTiff,
    comp: Composition,
): Promise<void> {
    if (canvasB.width < 1024 || canvasB.height < 1024) {
        canvasB.width = 1024;
        canvasB.height = 1024;
    }
    const s = comp.source;
    const img = cog.getImage(s.imageId);
    const bounds = img.getTileBounds(s.x, s.y);

    const maxSize = { width: bounds.width, height: bounds.height };
    if (comp.extract) {
        if (comp.extract.width === bounds.width && comp.extract.height === bounds.height) {
            comp.extract = undefined;
        } else {
            bounds.width = comp.extract.width;
            bounds.height = comp.extract.height;
        }
    }

    if (comp.resize) {
        maxSize.width = comp.resize.width;
        maxSize.height = comp.resize.height;
    }

    if (comp.crop == null) {
        ctx.drawImage(imgData, 0, 0, bounds.width, bounds.height, comp.x, comp.y, maxSize.width, maxSize.height);
        return;
    }

    if (comp.resize == null && comp.extract == null) {
        ctx.drawImage(
            imgData,
            comp.crop.x,
            comp.crop.y,
            comp.crop.width,
            comp.crop.height,
            comp.x,
            comp.y,
            comp.crop.width,
            comp.crop.height,
        );
        return;
    }

    const ctxB = canvasB.getContext('2d');
    const maxDim = Math.max(maxSize.width, maxSize.height);
    if (maxDim > canvasB.width || maxDim > canvasB.height) {
        canvasB.width = maxDim;
        canvasB.height = maxDim;
        if (maxDim > 2 * 8096) throw new Error('Trying to over zoom too far requested tileZoom: ' + maxDim);
    }
    if (ctxB == null) return;

    ctxB.clearRect(0, 0, canvasB.width, canvasB.height);
    ctxB.drawImage(imgData, 0, 0, bounds.width, bounds.height, 0, 0, maxSize.width, maxSize.height);
    ctx.drawImage(
        ctxB.canvas,
        comp.crop.x,
        comp.crop.y,
        comp.crop.width,
        comp.crop.height,
        comp.x,
        comp.y,
        comp.crop.width,
        comp.crop.height,
    );
}
