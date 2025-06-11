import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure log directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Pad helper
const pad = (n) => n.toString().padStart(2, '0');

// Custom timestamp generator for logs and filenames
const getCurrentTimestamps = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());

    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // convert 0 to 12
    const hourStr = pad(hours);

    // Log timestamp format: "YYYY-MM-DD hh:mm:ss AM/PM"
    const logTimestamp = `${year}-${month}-${day} ${hourStr}:${minutes}:${seconds} ${ampm}`;

    // Filename timestamp format (replace spaces and colon with safe chars): "YYYY-MM-DD_hh-mm-ss_AMPM"
    const fileTimestamp = `${year}-${month}-${day}`;

    return { logTimestamp, fileTimestamp };
};

const { logTimestamp, fileTimestamp } = getCurrentTimestamps();

// Custom timestamp format for winston logs
const customTimestamp = winston.format((info) => {
    info.timestamp = logTimestamp;
    return info;
});

// Log message format
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

export default logger;
