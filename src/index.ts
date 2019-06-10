// import 'source-map-support/register';
import { CogLayer } from "./cog.layer";
import { CogSourceUrl } from './cog.source.web';


async function run() {
    //     const cl = new CogLayer(new CogFileSource('/home/blacha/Downloads/tif/land_shallow_topo_east_webp.tif'))
    const cl = new CogLayer(new CogSourceUrl('/land_shallow_topo_east_webp.tif'))

    await cl.init();

    for (let y = 0; y < 10; y++) {
        const div = document.createElement('div');
        div.style.display = 'flex'
        div.style.flexDirection = 'column';
        for (let x = 0; x < 10; x++) {
            const tile = await cl.getTileRaw(y, x, 0)
            const img = document.createElement('img');
            img.style.width = '64px';
            img.style.height = '64px';
            img.style.border = '1px solid black';
            const blob = new Blob([tile.bytes], { type: 'image/webp' });
            img.src = URL.createObjectURL(blob);
            div.appendChild(img);
        }
        document.getElementById('container').appendChild(div);

    }



    //     const y = 5;
    //     const z = 0;

    //     for (let x = 0; x < 10; x++) {
    //         const tile = await cl.getTileRaw(x, 5, 0)
    //         console.log('tile', x, y, z, tile.mimeType, Buffer.from(tile.bytes).length)
    //         writeFileSync(`output/${x}_${y}_${z}.webp`, Buffer.from(tile.bytes))
    //     }
}



run().catch(console.error.bind(console))
