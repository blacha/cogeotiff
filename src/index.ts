import 'source-map-support/register'

import { CogFileSource } from "./cog.source.file";
import { CogLayer } from "./cog.layer";
import { writeFileSync } from "fs";

async function run() {
    const cl = new CogLayer(new CogFileSource('/home/blacha/Downloads/tif/land_shallow_topo_east_webp.tif'))
    await cl.init();

    const y = 5;
    const z = 0;

    for (let x = 0; x < 10; x++) {
        const tile = await cl.getTileRaw(x, 5, 0)
        console.log('tile', x, y, z, tile.mimeType, Buffer.from(tile.bytes).length)
        writeFileSync(`output/${x}_${y}_${z}.webp`, Buffer.from(tile.bytes))
    }
}

run().catch(console.error.bind(console))
