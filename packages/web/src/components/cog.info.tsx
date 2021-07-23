import { CogTiff } from '@cogeotiff/core';
import { Component, ComponentChild } from 'preact';
import { style } from 'typestyle';
import { Cogs } from '../service/cogs';
import { TileCount } from '../tiles/canvas.layer';
import { round } from '../util/round';
import { formatSize } from '../util/size';
import { IconButton, MaterialIcon } from './icon.button';
import { SideBar } from './side.bar';

export const CogCss = {
    container: style({ position: 'relative', marginBottom: '32px' }),
    title: style({
        padding: '4px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '80%',
    }),
    remove: style({
        position: 'absolute',
        top: '0',
        right: '4px',
        width: '24px',
        height: '24px',
        padding: '4px',
        borderRadius: '4px',
    }),
    buttons: style({}),
};

export interface CogInfoProps {
    url: string;
    index: number;
    total: number;
}

function shortCogName(cog: CogTiff): string {
    const name = cog.source.uri;
    if (name.length < 40) return name;
    return name.includes('/') ? name.slice(name.lastIndexOf('/') + 1) : name;
}

export class CogInfo extends Component<CogInfoProps> {
    render(p: CogInfoProps): ComponentChild | null {
        const state = Cogs.get(p.url);
        if (state == null) return null;
        const cog = state.v;
        const cogName = shortCogName(cog);
        if (state.isLoading) {
            return (
                <div class={CogCss.container}>
                    <div title={cog.source.uri} class={CogCss.title}>
                        {cogName}
                    </div>
                    Loading...
                </div>
            );
        }

        const firstImage = cog.getImage(0);
        if (firstImage.epsg == null) return null;

        const tileCounter = TileCount.get(cog.source.uri);
        return (
            <div class={CogCss.container}>
                <div title={cog.source.uri} class={CogCss.title}>
                    {cogName}
                </div>
                {this.renderCogButtons(cog, p.index, p.total)}

                {firstImage.epsg
                    ? SideBar.renderLine(
                          'EPSG',
                          <a href={`http://epsg.io/${firstImage.epsg}`}> {`EPSG:${firstImage.epsg}`}</a>,
                      )
                    : null}
                {SideBar.renderLine('Compression', firstImage.compression ?? 'Unknown')}
                {SideBar.renderLine('Origin', firstImage.origin.map(round).join(', '))}
                {SideBar.renderLine('Resolution', firstImage.resolution.map(round).join(', '))}
                {SideBar.renderLine('COG Optimized', String(cog.options.isCogOptimized))}
                {SideBar.renderLine(
                    'COG Requests',
                    String(cog.source.requests.length) +
                        ' - ' +
                        formatSize(cog.source.chunks.size * cog.source.chunkSize),
                )}
                {tileCounter != null ? SideBar.renderLine('Tiles Requested', String(tileCounter.size)) : null}
            </div>
        );
    }

    renderCogButtons(cog: CogTiff, index: number, total: number): ComponentChild {
        const buttons = [];
        if (total > 1) {
            buttons.push(
                <IconButton
                    icon={MaterialIcon.ArrowUp}
                    title="Move COG up rendering order"
                    onClick={(): void => Cogs.move('up', cog.source.uri)}
                    disabled={index === 0}
                />,
            );
            buttons.push(
                <IconButton
                    icon={MaterialIcon.ArrowDown}
                    title="Move COG down rendering order"
                    onClick={(): void => Cogs.move('down', cog.source.uri)}
                    disabled={index === total - 1}
                />,
            );
        }

        return (
            <div class={CogCss.buttons}>
                {...buttons}
                <IconButton
                    icon={MaterialIcon.Delete}
                    title="Remove Cog"
                    onClick={(): void => Cogs.delete(cog.source.uri)}
                />
            </div>
        );
    }
}
