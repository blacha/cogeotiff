import { CallBack, fireEvents } from './events';

export type CallBackValue = (k: string) => void;
export class UrlService {
    onSearchChangeHandlers = new Map<string, CallBack[]>();

    private _search?: URLSearchParams;
    get search(): URLSearchParams {
        if (this._search == null) this._search = new URLSearchParams(window.location.search);
        return this._search;
    }

    onSearchChange(key: string, cb: CallBack): void {
        const handlers = this.onSearchChangeHandlers.get(key) ?? [];
        handlers.push(cb);
        this.onSearchChangeHandlers.set(key, handlers);
    }

    fireAll(): void {
        for (const handlers of this.onSearchChangeHandlers.values()) {
            for (const handle of handlers) handle();
        }
    }

    updateUrl(key: string, value: string | string[] | boolean | null): void {
        const oldUrl = window.location.href;
        const search = this.search;
        if (value == null || value === false) {
            search.delete(key);
        } else if (Array.isArray(value)) {
            search.delete(key);
            for (const v of value) search.append(key, v);
        } else search.set(key, String(value));

        const newUrl =
            search.toString() === '' ? window.location.pathname : `${window.location.pathname}?${search.toString()}`;

        if (newUrl === oldUrl) return;
        window.history.pushState(null, '', newUrl);
        fireEvents(this.onSearchChangeHandlers.get(key));
    }
}

export const Url = new UrlService();
