import { Log, LogMessage, LogLevel } from 'bblog';

export enum LoggerType {
    JSON,
    WEB
}
export const LoggerConfig = { level: Log.TRACE, type: LoggerType.JSON }
export const Logger = Log.createLogger({
    name: 'cogview',
    hostname: '',
    streams: [{
        setLevel(l: LogLevel) {
            LoggerConfig.level = l;
        },
        write(msg: LogMessage) {
            if (msg.level < LoggerConfig.level) {
                return;
            }
            if (LoggerConfig.type == LoggerType.JSON) {
                console.log(JSON.stringify(msg));
                return;
            }
            const time = msg.time;

            delete msg.hostname
            delete msg.pid;
            delete msg.v;
            delete msg.time;
            console.log(time.toISOString(), msg);
        }
    }]
})
