// utils/sendSMS.js
import twilio from 'twilio';
import logger from './logger.js';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSMS = async ({ to, body }) => {
    try {
        if (!to) {
            console.warn('❌ No phone number provided for SMS.');
            logger.warn(`⚠️ No phone number provided for SMS`);
            return;
        }

        const message = await client.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
        });

        console.log(`✅ SMS sent to ${to} [SID: ${message.sid}]`);
        logger.info(`✅ SMS sent to ${to} [SID: ${message.sid}]`);
    } catch (error) {
        console.error(`❌ Failed to send SMS to ${to}: ${error.message}`);
        logger.error(`❌ Failed to send SMS to ${to}: ${error.message}`);
        // Do not throw — fail silently and continue
    }
};
