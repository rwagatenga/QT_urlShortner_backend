import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  level: 'info',
  transports: [new transports.Console()],
  exitOnError: false,
});

export default logger;
