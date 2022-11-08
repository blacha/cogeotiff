import { CogTiff } from '@cogeotiff/core';

/** Loads a single tile from a COG and renders it as a <img /> element */
export async function loadSingleTile(tiff: CogTiff): Promise<HTMLElement> {
    const startTime = performance.now();
    const img = tiff.images[tiff.images.length - 1];
    const tile = await img.getTile(0, 0);
    if (tile == null) throw new Error('Failed to load tile from tiff');

    const imgEl = document.createElement('img');
    imgEl.src = URL.createObjectURL(new Blob([tile.bytes], { type: tile.mimeType }));

    const divEl = document.createElement('div');
    const titleEl = document.createElement('div');
    titleEl.innerText = 'Single Tile Example';
    divEl.appendChild(titleEl);
    divEl.appendChild(imgEl);

    const duration = performance.now() - startTime;
    console.log(`Single Tile example rendered duration: ${Number(duration.toFixed(4))} ms`);

    return divEl;
}
