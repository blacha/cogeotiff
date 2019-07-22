// import { performance } from 'perf_hooks';

export class Timer {
    static startTimes: { [key: string]: number } = {};
    static times: { [key: string]: number } = {};

    static reset() {
        this.startTimes = {};
        this.times = {};
    }

    /** Track the time since the last .track() call */
    static end(timerName: string) {
        // let now = performance.now();
        // let duration = now - this.startTimes[timerName];
        // if (isNaN(duration)) {
        //     return;
        // }
        // this.times[timerName] = duration;
    }

    static start(timerName: string) {
        // this.startTimes[timerName] = performance.now();
    }
}
