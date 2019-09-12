import { CogTif } from '@cogeotiff/core/src/cog.tiff';
import { CogSourceFetch } from '@cogeotiff/source-url';
import * as L from 'leaflet';
import { LoggerConfig, LoggerType } from '../util/util.log';
import { Vector } from '../../core/src/vector';

LoggerConfig.level = 30;
LoggerConfig.type = LoggerType.WEB;

let map: L.Map;
let cog: CogTif;
let geoTiffLayer: L.Layer;

let debugCanvas = true;

async function getTile(canvas: HTMLCanvasElement, x: number, y: number, z: number) {
    if (cog == null) {
        return;
    }
    const ctx = canvas.getContext('2d');
    if (ctx == null) {
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (z >= cog.images.length) {
        return;
    }

    const zoom = cog.images.length - z - 1;
    const tileRaw = await cog.getTileRaw(x, y, zoom);

    if (tileRaw == null) {
        ctx.fillStyle = 'rgba(200,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    const img = new Image();
    img.style.outline = '1px solid black';
    const blob = new Blob([tileRaw.bytes], { type: 'image/webp' });
    img.onload = () => {
        URL.revokeObjectURL(img.src);
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
        ctx.textBaseline = 'top';
        ctx.font = '20px "Roboto Condensed"';
        ctx.fillStyle = 'rgba(255,255,255,0.87)';

        if (debugCanvas) {
            ctx.fillText(`${x},${y} z${z}`, 4, 10);
            ctx.strokeStyle = 'rgba(255,0,0,0.87)';
            ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
        }
    };
    img.src = URL.createObjectURL(blob);
}

async function loadAndRender(url: string) {
    const statusEl = document.getElementById('status');
    if (statusEl == null) {
        throw new Error('Missing status element');
    }

    if (url == null || !url.startsWith('http')) {
        statusEl.innerHTML = 'Invalid URL, needs to start with http://...';
        return;
    }

    statusEl.innerHTML = 'Loading...';
    console.time('loadCog');
    cog = await new CogTif(new CogSourceFetch(url)).init();
    console.timeEnd('loadCog');
    const GeoTiffLayer = L.GridLayer.extend({
        options: {
            minZoom: 0,
            maxNativeZoom: cog.images.length - 1,
            maxZoom: cog.images.length + 1,
        },

        createTile: function(coords: Vector, done: Function) {
            const canvas = document.createElement('canvas') as HTMLCanvasElement;
            // Overscale things to make font rendering a little less blury
            canvas.width = 512;
            canvas.height = 512;

            getTile(canvas, coords.x, coords.y, coords.z).then(() => done(null, canvas));
            return canvas;
        },
    });

    if (geoTiffLayer != null) {
        map.removeLayer(geoTiffLayer);
    }
    geoTiffLayer = new GeoTiffLayer();

    map.addLayer(geoTiffLayer);
    statusEl.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Loaded');
    map = L.map('container').setView([6, 50], 0);

    const inputEl = document.getElementById('url') as HTMLInputElement;
    inputEl.value = 'https://public.lo.chard.com/bg43_2017-2018.webp.cog.tif';
    const btn = document.getElementById('button');
    if (btn == null) {
        throw new Error('Unable to find button');
    }

    btn.addEventListener('click', e => {
        loadAndRender(inputEl.value);
        e.preventDefault();
        return false;
    });
});
