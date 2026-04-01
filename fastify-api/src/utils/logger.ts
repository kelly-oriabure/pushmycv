type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
        const timestamp = new Date().toISOString();
        const logMessage = {
            timestamp,
            level,
            message,
            ...(meta && { meta })
        };

        switch (level) {
            case 'error':
                console.error(JSON.stringify(logMessage));
                break;
            case 'warn':
                console.warn(JSON.stringify(logMessage));
                break;
            case 'debug':
                if (process.env.NODE_ENV === 'development') {
                    console.debug(JSON.stringify(logMessage));
                }
                break;
            default:
                console.log(JSON.stringify(logMessage));
        }
    }

    info(message: string, meta?: Record<string, any>): void {
        this.log('info', message, meta);
    }

    warn(message: string, meta?: Record<string, any>): void {
        this.log('warn', message, meta);
    }

    error(message: string, error?: Error | unknown, meta?: Record<string, any>): void {
        const errorMeta = error instanceof Error
            ? { error: error.message, stack: error.stack, ...meta }
            : { error: String(error), ...meta };

        this.log('error', message, errorMeta);
    }

    debug(message: string, meta?: Record<string, any>): void {
        this.log('debug', message, meta);
    }
}

export const logger = new Logger();
export default logger;
