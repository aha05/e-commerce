// utils/notifyUser.js
import Notification from '../models/Notification.js';
import UserSettings from '../models/UserSettings.js';
import { sendEmail } from './sendEmail.js';
import { sendSMS } from './sendSMS.js';

export const notifyUser = async ({ userId, type, title, message, meta = {} }) => {
    try {
        const settings = await UserSettings.findOne({ userId });

        if (!settings) {
            console.warn(`No settings found for userId: ${userId}`);
            return;
        }

        const { notifications } = settings;

        // Check if the specific notification type is enabled
        const isNotificationEnabled = notifications[type];
        if (!isNotificationEnabled) {
            console.log(`Notification type '${type}' is disabled for userId: ${userId}`);
            return;
        }

        // In-App Notification
        if (notifications.types.inApp) {
            await Notification.create({
                userId,
                type,
                title,
                message,
                meta,
            });
            console.log(`In-app notification sent to userId: ${userId}`);
        }

        // Email Notification
        if (notifications.types.email) {
            const userEmail = meta.email; // Ensure you pass user's email in meta
            if (userEmail) {
                await sendEmail({
                    to: userEmail,
                    subject: title,
                    html: `<p>${message}</p>`,
                });
            } else {
                console.warn(`Email not provided for userId: ${userId}`);
            }
        }

        // SMS Notification
        if (notifications.smsAlerts) {
            const userPhone = meta.phone; // Ensure you pass user's phone in meta
            if (userPhone) {
                await sendSMS({
                    to: userPhone,
                    body: message,
                });
            } else {
                console.warn(`Phone number not provided for userId: ${userId}`);
            }
        }
    } catch (error) {
        console.error('Error in notifyUser:', error);
    }
};
