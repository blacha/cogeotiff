import { CogTif } from "../cog.tif";
import { CogSourceUrl } from "../source/cog.source.web";
import * as L from 'leaflet';
import { LoggerConfig, LoggerType } from "../util/util.log";

LoggerConfig.level = 20
LoggerConfig.type = LoggerType.WEB;


let map: L.Map;
let cog: CogTif;
let geoTiffLayer: L.Layer;

async function getTile(img: HTMLImageElement, x: number, y: number, z: number) {
    if (cog == null) {
        return;
    }
    if (z >= cog.images.length) {
        return null;
    }
    console.log(x, y, z, cog.images.length - z - 1);
    const tileRaw = await cog.getTileRaw(x, y, cog.images.length - z - 1)
    if (tileRaw == null) {
        img.style.backgroundColor = 'rgba(0,0,0,0.87)';
        img.style.outline = '1px solid red';
        return;
    }
    img.style.outline = '1px solid black';
    const blob = new Blob([tileRaw.bytes], { type: 'image/webp' });
    img.onload = () => URL.revokeObjectURL(img.src);
    img.src = URL.createObjectURL(blob);
}

async function loadAndRender(url: string) {
    const statusEl = document.getElementById('status');

    if (url == null || !url.startsWith('http')) {
        statusEl.innerHTML = 'Invalid URL, needs to start with http://...';
        return;
    }

    statusEl.innerHTML = 'Loading...';
    console.time('loadCog')
    cog = await new CogTif(new CogSourceUrl(url)).init();
    console.timeEnd('loadCog');
    const GeoTiffLayer = L.GridLayer.extend({
        createTile: function(coords, done) {
            var tile = document.createElement('img') as HTMLImageElement;
            getTile(tile, coords.x, coords.y, coords.z).then(() => done(null, tile));
            tile.style.outline = '1px solid blue';
            return tile;
        }
    })

    if (geoTiffLayer != null) {
        map.removeLayer(geoTiffLayer)
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

    document.getElementById('button').addEventListener('click', e => {
        loadAndRender(inputEl.value)
        e.preventDefault();
        return false;
    })

    const DebugLayer = L.GridLayer.extend({
        createTile: function(coords) {
            var tile = document.createElement('div');
            tile.innerHTML = [coords.x, coords.y, coords.z].join(', ');
            tile.style.outline = '1px solid red';
            return tile;
        }
    });

    map.addLayer(new DebugLayer());

});


