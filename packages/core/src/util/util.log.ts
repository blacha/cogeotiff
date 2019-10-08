/** Interface required for a logger, should match common loggers, bunyan, pino, bblog */
export interface CogLogger {
    trace(data: Record<string, any> | string, msg?: string): void;
    debug(data: Record<string, any> | string, msg?: string): void;
    info(data: Record<string, any> | string, msg?: string): void;
    warn(data: Record<string, any> | string, msg?: string): void;
    error(data: Record<string, any> | string, msg?: string): void;
    fatal(data: Record<string, any> | string, msg?: string): void;
    child(keys: Record<string, any>): CogLogger;
}

export const LoggerConfig: { log: CogLogger | null } = { log: null };

/**
 * Get the current logger
 */
export function getLogger(keys?: Record<string, any>) {
    if (keys && LoggerConfig.log != null) {
        return LoggerConfig.log.child(keys);
    }
    return LoggerConfig.log;
}
/** Set a logger to be used */
export function setLogger(l: CogLogger) {
    LoggerConfig.log = l;
}

export const Log = {
    get: getLogger,
    set: setLogger,
};
