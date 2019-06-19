import { Log, LogLevel, LogMessage } from 'bblog';
import chalk from 'chalk';
import { LoggerConfig } from '../util/util.log';

function getLogStatus(level: LogLevel | number): string {
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
const IGNORE_KEYS: { [key: string]: boolean } = {
    pid: true,
    time: true,
    hostname: true,
    level: true,
    v: true,
    name: true,
    msg: true,
};

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
    return s.charAt(0) === '0' && s.charAt(1) === 'x';
}

export const ChalkLogStream = {
    level: Log.ERROR,
    setLevel(level: LogLevel): void {
        LoggerConfig.level = level;
    },
    write(msg: LogMessage): void {
        if (msg.level < LoggerConfig.level) {
            return;
        }
        const output = `[${msg.time.toISOString()}] ${getLogStatus(msg.level)} ${chalk.blue(msg.msg)}`;
        const kvs = [];
        for (const [key, value] of Object.entries(msg)) {
            if (value == null || value === '') {
                continue;
            }
            if (IGNORE_KEYS[key] === true) {
                continue;
            }
            let output = '';
            const typeofValue = typeof value;
            if (typeofValue === 'number' || isHex(value)) {
                output = chalk.yellow(String(value));
            } else if (typeofValue === 'string') {
                output = chalk.green(value);
            } else {
                output = String(value);
            }

            kvs.push(`${chalk.dim(key)}=${output}`);
        }
        const kvString = kvs.join(', ');
        console.log(`${output} ${kvString}`);
    },
};
