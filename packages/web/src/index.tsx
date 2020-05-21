import { CogTiff } from '@cogeotiff/core';
import { Component, ComponentChild, Fragment, render } from 'preact';
import { style } from 'typestyle';
import { CogAdd } from './components/cog.add.button';
import { WebMap } from './components/map';
import { Cogs } from './service/cogs';
import { Url } from './service/url';
export const CogCache: Map<string, CogTiff> = new Map();

interface MainPageState {
    cogs: string[];
}

const MainCss = {
    container: style({
        fontFamily: 'Roboto Condensed',
        display: 'grid',
        height: '100%',
        gridGap: '1em',
        gridTemplateRows: '5vh 90vh',
    }),
    header: {
        container: style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }),
        link: style({ fontWeight: 'bold', alignItems: 'center' }),
    },
};

export class MainPage extends Component<unknown, MainPageState> {
    componentDidMount(): void {
        Url.search.getAll('i').forEach((url) => Cogs.add(url));

        Cogs.onChange(() => {
            Url.updateUrl('i', Cogs.cogs);
            this.setState({ cogs: Cogs.cogs });
        });
    }

    render(x: unknown, { cogs }: MainPageState): ComponentChild {
        console.log('Render', cogs);
        return (
            <Fragment>
                <header className={MainCss.header.container}>
                    <div>
                        <a className={MainCss.header.link} href="https://github.com/blacha/cogeotiff/">
                            @cogeotiff
                        </a>
                    </div>
                    <CogAdd defaultUrl="https://public.lo.chard.com/2019-new-zealand-sentinel.3857.lzw.cog.tiff" />
                </header>
                <WebMap cogs={cogs ?? []} />
            </Fragment>
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const main = document.getElementById('main');
    if (main == null) {
        document.body.innerText = 'Failed to load #main';
        return;
    }

    main.className = MainCss.container;
    render(<MainPage />, main);
});
