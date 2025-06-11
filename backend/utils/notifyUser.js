// utils/notifyUser.js
import Notification from '../models/Notification.js';
import UserSettings from '../models/UserSettings.js';
import { sendEmail } from './sendEmail.js';
import { sendSMS } from './sendSMS.js';
import logger from './logger.js';

export const notifyUser = async ({ username = 'user', userId, type, title, message, meta = {} }) => {
    try {
        const settings = await UserSettings.findOne({ userId });

        if (!settings) {
            console.warn(`No settings found for userId: ${userId}`);
            logger.warn(`No settings found for userId: ${userId} or Username: ${username}`);
            return;
        }

        const { notifications } = settings;
        // Check if the specific notification type is enabled

        // const isNotificationEnabled = notifications[type];
        // if (!isNotificationEnabled) {
        //     console.log(`Notification type '${type}' is disabled for userId: ${userId}`);
        //     return;
        // }


        // In-App Notification
        if (notifications.types.inApp) {
            try {
                await Notification.create({
                    userId,
                    type,
                    title,
                    message,
                    meta,
                });
                console.log(`✅ In-app notification sent to userId: ${userId}`);
                logger.info(`✅ In-app notification sent to userId: ${userId} or Username: ${username}`);
            } catch (err) {
                console.error(`❌ Failed to send in-app notification to userId: ${userId}`, err);
                logger.error(`❌ Failed to send in-app notification to userId: ${userId} or Username: ${username}`, err);
            }
        }

        // Email Notification
        if (notifications.types.email) {
            const userEmail = meta.email;
            if (userEmail) {
                try {
                    await sendEmail({
                        to: userEmail,
                        subject: title,
                        html: `<p>${message}</p>`,
                    });
                } catch (err) {

                }
            } else {
                console.warn(`⚠️ Email not provided for userId: ${userId}`);
                logger.warn(`⚠️ Email not provided for userId: ${userId} or Username: ${username}`);
            }
        }

        // SMS Notification
        if (notifications.smsAlerts) {
            const userPhone = meta.phone;
            if (userPhone) {
                try {
                    await sendSMS({
                        to: userPhone,
                        body: message,
                    });
                } catch (err) {
                }
            } else {
                console.warn(`⚠️ Phone number not provided for userId: ${userId}`);
                logger.warn(`⚠️ Phone number not provided for userId: ${userId} or Username: ${username}`);
            }
        }
    } catch (error) {
        console.error(`❌ Fatal error in notifyUser for userId: ${userId}`, error);
        logger.error(`❌ Fatal error in notifyUser for userId: ${userId} or Username: ${username}`, error);
    }
};
