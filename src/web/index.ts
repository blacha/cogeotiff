import { CogSourceUrl } from "../source/cog.source.web";
import { CogTif } from "../cog.tif";
import { CogViewer } from "..";

CogSourceUrl.fetch = (a, b) => fetch(a, b);

const MAX_SIZE = 10;

let map: L.Map;
let cog: CogTif;
let geoTiffLayer: L.Layer;

async function getTile(img: HTMLImageElement, x: number, y: number, z: number) {
    if (cog == null) {
        return;
    }
    // console.log('LoadingTile', x, y, z);
    const tileRaw = await cog.getTileRaw(x, y, 0)
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
    cog = await CogViewer.fromUrl(url);
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
    map = L.map('container').setView([6, 50], 7);

    const inputEl = document.getElementById('url') as HTMLInputElement;
    inputEl.value = 'https://blayne.chard.com/land_shallow_topo_east_webp.tif'
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


