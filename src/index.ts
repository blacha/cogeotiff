import { CogFileSource } from "./cog.source.file";
import { CogLayer } from "./cog.layer";

async function run() {
    const cl = new CogLayer(new CogFileSource('/home/blacha/Downloads/tif/land_shallow_topo_east_webp.tif'))
    await cl.init();
}

run().catch(console.error.bind(console))
