// utils/sendSMS.js
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSMS = async ({ to, body }) => {
    try {
        const message = await client.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
        });
        console.log('SMS sent:', message.sid);
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
};
