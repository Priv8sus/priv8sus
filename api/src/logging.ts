type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function format(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  debug: (message: string, meta?: any) => {
    if (levels[currentLevel] <= levels.debug) {
      console.debug(format('debug', message, meta));
    }
  },
  info: (message: string, meta?: any) => {
    if (levels[currentLevel] <= levels.info) {
      console.info(format('info', message, meta));
    }
  },
  warn: (message: string, meta?: any) => {
    if (levels[currentLevel] <= levels.warn) {
      console.warn(format('warn', message, meta));
    }
  },
  error: (message: string, meta?: any) => {
    if (levels[currentLevel] <= levels.error) {
      console.error(format('error', message, meta));
    }
  },
};
