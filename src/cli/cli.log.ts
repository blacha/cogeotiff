import { Log, LogLevel, LogMessage } from "bblog";
import chalk from "chalk";
import { LoggerConfig } from "../util/util.log";

function getLogStatus(level: LogLevel | number) {
    if (level <= Log.TRACE) {
        return chalk.gray('TRACE');
    }
    if (level <= Log.DEBUG) {
        return chalk.yellowBright('DEBUG');
    }
    if (level <= Log.INFO) {
        return chalk.cyan('INFO');
    }
    if (level <= Log.WARN) {
        return chalk.yellow('WARN');
    }
    if (level <= Log.ERROR) {
        return chalk.red('ERROR');
    }
    return chalk.bgRed('FATAL');

}

/** Dont print these keys */
const IGNORE_KEYS = {
    pid: true,
    time: true,
    hostname: true,
    level: true,
    v: true,
    name: true,
    msg: true
}

/**
 * check if a object looks like a hex string
 * starts with `0x`
 *
 * @param s object to check
 */
function isHex(s: any): s is string {
    if (typeof s !== 'string') {
        return false;
    }
    return s.charAt(0) === '0' && s.charAt(1) === 'x'
}

export const ChalkLogStream = {
    level: Log.ERROR,
    setLevel(level: LogLevel) {
        LoggerConfig.level = level;
    },
    write(msg: LogMessage) {
        if (msg.level < LoggerConfig.level) {
            return;
        }
        const output = `[${msg.time.toISOString()}] ${getLogStatus(msg.level)} ${chalk.blue(msg.msg)}`
        const kvs = [];
        for (const key of Object.keys(msg)) {
            let value = msg[key]
            if (value == null || value === '') {
                continue;
            }
            if (IGNORE_KEYS[key]) {
                continue;
            }
            const typeofValue = typeof value;
            if (typeofValue === 'number' || isHex(value)) {
                value = chalk.yellow(String(value));
            } else if (typeofValue === 'string') {
                value = chalk.green(value)
            }

            kvs.push(`${chalk.dim(key)}=${value}`)
        }
        const kvString = kvs.join(', ')
        // if (kvString.length > 0) {
        //     console.log(`${output} ${kvString}`)
        // } else {
        console.log(`${output} ${kvString}`)
        // }
    }
}
