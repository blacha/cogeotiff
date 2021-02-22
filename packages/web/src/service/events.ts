export type CallBack = () => void;
export type CallBackValue<T> = (v: T) => void;

export function fireEvents(events?: CallBack[]): void {
    if (events == null) return;
    for (const handle of events) handle();
}
