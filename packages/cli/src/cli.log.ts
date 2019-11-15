import { Log, LogLevel, LogMessage } from 'bblog';
import { PrettySimple } from 'pretty-json-log';

export const ChalkLogStream = {
    pretty: new PrettySimple(Log.ERROR),
    setLevel(level: LogLevel): void {
        ChalkLogStream.pretty.level = level;
    },
    write(msg: LogMessage): void {
        const out = this.pretty.pretty(msg);
        if (out == null) {
            return;
        }
        process.stdout.write(out);
        process.stdout.write('\n');
    },
};

export const CliLogger = Log.createLogger({
    name: 'coginfo',
    hostname: '',
    streams: [ChalkLogStream],
});
