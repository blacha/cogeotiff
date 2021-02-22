import { Vector } from '@cogeotiff/core';
import * as L from 'leaflet';
import { CanvasTiler } from './canvas.layer';

let CanvasCounter = 0;

export class CogLayer extends L.GridLayer {
    ct: CanvasTiler;
    constructor(ct: CanvasTiler) {
        super();
        this.ct = ct;
    }

    protected createTile(coords: Vector, done: (e?: Error, canvas?: HTMLElement) => void): HTMLElement {
        const el = document.createElement('canvas') as HTMLCanvasElement;
        el.id = `canvas-${CanvasCounter++}`;
        el.width = 256;
        el.height = 256;
        this.ct.drawTile(el, coords.x, coords.y, coords.z).then(() => done(undefined, el));
        return el;
    }
}

export class DebugLayer extends L.GridLayer {
    createTile(coords: Vector, done: (e?: Error, canvas?: HTMLElement) => void): HTMLElement {
        const el = document.createElement('div') as HTMLDivElement;
        el.style.outline = '0.5px solid rgba(255,0,255,0.87)';
        el.style.color = 'rgba(255,0,255,0.87)';
        el.style.width = '256px';
        el.style.height = '256px';
        el.style.font = "16px 'Roboto Condensed'";

        const textDiv = document.createElement('div');
        textDiv.style.padding = '4px';
        textDiv.innerHTML = `${coords.z}/${coords.x}/${coords.y}`;
        el.appendChild(textDiv);
        setTimeout(() => done(undefined, el), 1);
        return el;
    }
}
