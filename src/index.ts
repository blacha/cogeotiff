import { CogTif } from './cog.tif';
import { CogSourceUrl } from './source/cog.source.web';
import { CogSourceFile } from './source/cog.source.file';

export * from './cog.source'
export * from './cog.tif';
export * from './source/cog.source.web';
export * from './source/cog.source.file';

export const CogViewer = {
    fromUrl(url: string): Promise<CogTif> {
        return new CogTif(new CogSourceUrl(url)).init();
    },

    fromFile(fileName: string): Promise<CogTif> {
        return new CogTif(new CogSourceFile(fileName)).init();
    }
}
