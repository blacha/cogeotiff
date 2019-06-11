import { CogSourceFile } from "./source/cog.source.file";
import { CogTif } from "./cog.tif";
import * as arg from 'arg';
import chalk from 'chalk';

const helpMessage = chalk`
  {bold USAGE}

      {dim $} {bold cog-dump} [--help] --file {underline COG File} --xyz {underline offset}

  {bold OPTIONS}
      --help                      Shows this help message
      --file {underline COG File}           File to process
`;

const args = arg({
    '--help': Boolean,
    '--file': String,

    '-f': '--file',
    '-h': '--help'
})

async function run() {
    if (args['--help']) {
        console.log(helpMessage)
        process.exit();
    }
    const fileName = args['--file'];
    if (fileName == null) {
        console.log(helpMessage)
        process.exit();
    }
    console.log(args);
    const source = new CogSourceFile(process.argv[2]);
    const tif = new CogTif(source);

    await tif.init();
}

run().catch(e => console.error(e));

