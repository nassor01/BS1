const nodeCron = require('node-cron');
const BookingModel = require('../models/bookingModel');
const mailerService = require('../services/mailerService');

function startReminderCron() {
    // Send reminders every 30 minutes
    nodeCron.schedule('*/30 * * * *', async () => {
        console.log('⏰ Running booking reminder check...');
        try {
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));

            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0];
            const futureTimeStr = oneHourFromNow.toTimeString().split(' ')[0];

            const upcoming = await BookingModel.findUpcomingConfirmed(dateStr, timeStr, futureTimeStr);

            for (const booking of upcoming) {
                console.log(`📧 Sending reminder to ${booking.email} for ${booking.room_name}`);
                mailerService.sendMail(
                    booking.email,
                    'Upcoming Room Booking Reminder',
                    `Reminder: Your booking for ${booking.room_name} is starting at ${booking.start_time}.`,
                    `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #0B4F6C; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #0B4F6C;">Reminder: Upcoming Booking</h2>
                        <p>Hello <strong>${booking.full_name}</strong>,</p>
                        <p>This is a friendly reminder that your booking/reservation for <strong>${booking.room_name}</strong> is starting within the hour.</p>
                        
                        <div style="background: #f0f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</p>
                            <p style="margin: 5px 0;"><strong>Location:</strong> SwahiliPot Hub</p>
                        </div>

                        <p>We look forward to seeing you!</p>
                    </div>
                    `
                ).catch(err => console.error('Failed to send reminder email:', err));
            }
        } catch (error) {
            console.error('Reminder cron error:', error);
        }
    });
}

module.exports = startReminderCron;
