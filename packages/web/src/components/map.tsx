import { GoogleTms } from '@basemaps/geo/build/tms/google';
import * as L from 'leaflet';
import { Component, ComponentChild, Fragment } from 'preact';
import { style } from 'typestyle';
import { Cogs } from '../service/cogs';
import { Url } from '../service/url';
import { CanvasTiler } from '../tiles/canvas.layer';
import { CogLayer, DebugLayer } from '../tiles/leaflet.layer';
import { CogInfo } from './cog.info';
import { SideBar, SideBarCss } from './side.bar';

export enum WebMapView {
    Cog = 'cog',
    World = 'world',
}

interface WebMapState {
    isDebug: boolean;
    view: WebMapView;
}

export type CogActions = 'delete' | 'up' | 'down';
interface WebMapProps {
    cogs: string[];
}

export const MapCss = {
    container: style({ display: 'grid', gridTemplateColumns: '0.5fr 3fr', height: '100%' }),
    map: {
        container: style({ height: '100%', width: '100%' }),
    },
};

function getView(view: string | null, defaultValue = WebMapView.World): WebMapView {
    console.log('GetView', { view });
    if (view == null) return defaultValue;
    if (view == WebMapView.Cog) return WebMapView.Cog;
    if (view == WebMapView.World) return WebMapView.World;
    return defaultValue;
}

export class WebMap extends Component<WebMapProps, WebMapState> {
    map?: L.Map;
    isMounted = false;

    layerOsm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });

    ct = new CanvasTiler();
    layerCog: L.GridLayer = new CogLayer(this.ct);
    layerDebug: L.GridLayer = new DebugLayer();

    constructor() {
        super();
        Url.onSearchChange('view', () => this.changeState('view', getView(Url.search.get('view'))));
        Url.onSearchChange('debug', () => this.changeState('isDebug', Url.search.has('debug')));
        this.setState({ view: getView(Url.search.get('view')), isDebug: Url.search.has('debug') });
    }
    changeState<K extends keyof WebMapState>(key: K, value: WebMapState[K]): void {
        if (this.state[key] == value) return;
        this.setState({ ...this.state, [key]: value });
    }

    componentWillUnmount(): void {
        this.isMounted = false;
    }

    componentDidMount(): void {
        this.isMounted = true;
        this.map = L.map('map', { worldCopyJump: true });
        setTimeout(() => this.map?.invalidateSize(), 200);
        this.resetMap();
        this.map.addEventListener('moveend', () => this.setState({ ...this.state }));
    }

    resetMap(): void {
        this.map?.setView({ lat: 0, lng: 0 }, 2);
    }

    updateLayers(): void {
        if (this.map == null) return;
        const beforeCogs = this.ct.id;
        const state = this.state;

        const startTms = this.ct.tms;
        this.ct.tms = state.view === 'world' ? GoogleTms : undefined;

        this.ct.cogs = [];
        for (const cogId of this.props.cogs) {
            const cogLoad = Cogs.get(cogId);
            if (cogLoad == null || cogLoad.isLoading) continue;
            const cog = cogLoad.v;
            if (!cog.isInitialized) continue;
            const img = cog.getImage(0);
            if (this.state.view == 'world' && img.epsg != 3857) continue;
            this.ct.cogs.push(cog);
        }

        const afterCogs = this.ct.id;
        if (afterCogs != beforeCogs) {
            this.layerCog.removeFrom(this.map);
            this.layerCog = new CogLayer(this.ct);
            this.layerCog.addTo(this.map);
            if (this.ct.tms !== startTms) {
                this.map.setView({ lat: 0, lng: 0 }, 2);
            }
        }

        state.view == 'world' ? this.map.addLayer(this.layerOsm) : this.map.removeLayer(this.layerOsm);
        state.isDebug ? this.map.addLayer(this.layerDebug) : this.map.removeLayer(this.layerDebug);

        this.layerOsm.bringToBack();
        this.layerCog.bringToFront();
        this.layerDebug.bringToFront();
    }

    render(p: WebMapProps, s: WebMapState): ComponentChild {
        this.updateLayers();

        const cogs = p.cogs;
        return (
            <div className={MapCss.container}>
                <div className={SideBarCss.container}>
                    <div className={SideBarCss.group}>
                        <div className={SideBarCss.groupTile}>Map</div>
                        {this.renderMapButtons(s)}
                        {this.renderDebugButtons(s)}
                    </div>
                    {...cogs.map((url, index) => <CogInfo url={url} index={index} total={p.cogs.length} />)}
                </div>
                <div id="map" className={MapCss.map.container}></div>
            </div>
        );
    }

    renderDebugButtons(s: WebMapState): ComponentChild {
        return SideBar.renderLine(
            'Show Tiles',
            <button title="Show debug tiles" onClick={this.onToggleDebug}>
                {s.isDebug ? 'On' : 'Off'}
            </button>,
        );
    }

    renderMapButtons(s: WebMapState): ComponentChild {
        return SideBar.renderLine(
            'View',
            <Fragment>
                <button onClick={this.onToggleGoogle} title="Show COG with world overlay" disabled={s.view === 'world'}>
                    World
                </button>
                <button onClick={this.onToggleGoogle} title="Show raw COG tiles" disabled={s.view === 'cog'}>
                    Cog
                </button>
            </Fragment>,
        );
    }

    onToggleDebug = (): void => Url.updateUrl('debug', !this.state.isDebug);
    onToggleGoogle = (): void => {
        if (this.state.view == WebMapView.World) Url.updateUrl('view', WebMapView.Cog);
        else Url.updateUrl('view', WebMapView.World);
    };
}
