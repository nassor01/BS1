const nodemailer = require('nodemailer');

class MailerService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
            console.log('📧 Using configured SMTP service');
        } else {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('📧 Using Ethereal test email service');
        }

        this.initialized = true;
    }

    async sendMail(to, subject, text, html = null) {
        await this.initialize();

        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_USER || '"SwahiliPot Hub" <noreply@swahilipothub.co.ke>',
                to,
                subject,
                text,
                html: html || `<div style="font-family: Arial, sans-serif; padding: 20px;">${text}</div>`,
            });

            console.log("✅ Message sent: %s", info.messageId);

            if (!process.env.SMTP_USER) {
                console.log("📬 Preview URL: %s", nodemailer.getTestMessageUrl(info));
            }

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Email sending failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async sendOtpEmail(to, otp, type = 'verification') {
        const subject = type === 'verification' 
            ? 'Your Verification OTP' 
            : 'Your Password Reset OTP';
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">SwahiliPot Hub</h2>
                <p style="font-size: 16px; color: #555;">Your OTP code is:</p>
                <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
                    ${otp}
                </div>
                <p style="font-size: 14px; color: #888;">This code expires in 10 minutes.</p>
                <p style="font-size: 14px; color: #888;">If you didn't request this, please ignore this email.</p>
            </div>
        `;

        return await this.sendMail(to, subject, `Your OTP: ${otp}`, html);
    }

    async sendBookingConfirmation(to, bookingDetails) {
        const { roomName, date, startTime, endTime, userName } = bookingDetails;
        
        const subject = 'Booking Confirmation - SwahiliPot Hub';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Booking Confirmed!</h2>
                <p>Hi ${userName},</p>
                <p>Your booking has been confirmed. Here are the details:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Room</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${roomName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Time</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${startTime} - ${endTime}</td>
                    </tr>
                </table>
                <p>Thank you for using SwahiliPot Hub!</p>
            </div>
        `;

        return await this.sendMail(to, subject, `Booking confirmed for ${roomName}`, html);
    }

    async sendBookingCancellation(to, bookingDetails) {
        const { roomName, date, startTime, endTime, userName } = bookingDetails;
        
        const subject = 'Booking Cancelled - SwahiliPot Hub';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d33;">Booking Cancelled</h2>
                <p>Hi ${userName},</p>
                <p>Your booking has been cancelled. Here are the details:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Room</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${roomName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Time</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${startTime} - ${endTime}</td>
                    </tr>
                </table>
            </div>
        `;

        return await this.sendMail(to, subject, `Booking cancelled for ${roomName}`, html);
    }
}

module.exports = new MailerService();
