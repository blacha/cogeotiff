import { CogTiff } from '@cogeotiff/core';
import { SourceUrl } from '@chunkd/source-url';
import { CallBack, fireEvents } from './events';

interface LoadingState<T> {
    v: T;
    isLoading: boolean;
}
export class CogService {
    cache = new Map<string, LoadingState<CogTiff>>();
    cogs: string[] = [];

    onChangeHandlers: CallBack[] = [];
    onChange(cb: CallBack): void {
        this.onChangeHandlers.push(cb);
    }

    get(url: string): LoadingState<CogTiff> | undefined {
        return this.cache.get(url);
    }

    add(url: string): Promise<CogTiff> {
        let existing = this.cache.get(url);
        if (existing == null) {
            const source = new SourceUrl(url);
            source.maxConcurrentRequests = 512;
            existing = {
                v: new CogTiff(source),
                isLoading: true,
            };
            this.cache.set(url, existing);
        }

        if (!this.cogs.includes(url)) {
            this.cogs.push(url);
            fireEvents(this.onChangeHandlers);
        }

        if (existing.v.isInitialized) return Promise.resolve(existing.v);
        return existing.v.init(true).then((c) => {
            if (existing) existing.isLoading = false;
            fireEvents(this.onChangeHandlers);
            return c;
        });
    }

    move(direction: 'up' | 'down', url: string): void {
        const cogIndex = this.cogs.indexOf(url);
        if (cogIndex === -1) return;
        if (direction === 'up' && cogIndex === 0) return;
        if (direction === 'down' && cogIndex === this.cogs.length - 1) return;
        const nextIndex = direction === 'up' ? cogIndex - 1 : cogIndex + 1;
        this.cogs.splice(nextIndex, 0, this.cogs.splice(cogIndex, 1)[0]);
        fireEvents(this.onChangeHandlers);
    }

    delete(url: string): void {
        const cogIndex = this.cogs.indexOf(url);
        if (cogIndex === -1) return;

        this.cogs.splice(cogIndex, 1);
        fireEvents(this.onChangeHandlers);
    }
}

export const Cogs = new CogService();
