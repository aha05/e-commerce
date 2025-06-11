// utils/sendEmail.js
import nodemailer from 'nodemailer';
import logger from './logger.js';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for others
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmail = async ({ to, subject, html }) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
    };

    try {
        const { messageId } = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to} [messageId: ${messageId}]`);
        logger.info(`✅ Email sent to ${to} [messageId: ${messageId}]`);
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}: ${error.message}`);
        logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
        // Continue silently, no throw
    }
};
