const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = 'logs';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const pad = (n) => n.toString().padStart(2, '0');

const getCurrentTimestamps = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());

    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hourStr = pad(hours);

    const logTimestamp = `${year}-${month}-${day} ${hourStr}:${minutes}:${seconds} ${ampm}`;
    const fileTimestamp = `${year}-${month}-${day}`;

    return { logTimestamp, fileTimestamp };
};

const { logTimestamp, fileTimestamp } = getCurrentTimestamps();

const customTimestamp = winston.format((info) => {
    info.timestamp = logTimestamp;
    return info;
});

const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
    return stack
        ? `[${timestamp}] ${level.toUpperCase()}: ${message} - Stack: ${stack}`
        : `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        customTimestamp(),
        winston.format.errors({ stack: true }),
        logFormat
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(logDir, `logs-${fileTimestamp}.log`) }),
        new winston.transports.File({ filename: path.join(logDir, `errors-${fileTimestamp}.log`), level: 'error' }),
    ],
});

module.exports = logger;
module.exports.default = logger;
