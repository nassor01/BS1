const BookingModel = require('../models/bookingModel');
const RoomModel = require('../models/roomModel');
const UserModel = require('../models/userModel');
const SettingsModel = require('../models/settingsModel');
const mailerService = require('../services/mailerService');

const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const bookingController = {
    // BOOK ROOM
    async createBooking(req, res) {
        const { userId, roomId, date, startTime, endTime, type, dates } = req.body;

        const bookingType = type === 'reservation' ? 'reservation' : 'booking';

        // Check if maintenance mode is enabled
        try {
            const isMaintenanceMode = await SettingsModel.isMaintenanceMode();
            if (isMaintenanceMode) {
                return res.status(503).json({ 
                    error: 'System is under maintenance. Bookings are currently disabled. Please try again later.',
                    code: 'MAINTENANCE_MODE'
                });
            }
        } catch (err) {
            console.error('Error checking maintenance mode:', err);
        }

        // Check working hours for regular users
        const userRole = req.user?.role;
        if (userRole !== 'admin' && userRole !== 'super_admin') {
            try {
                const config = await SettingsModel.getWorkingHoursConfig();
                if (!config.withinHours) {
                    return res.status(403).json({
                        error: config.message,
                        code: 'OUTSIDE_WORKING_HOURS',
                        workingHours: {
                            start: config.start,
                            end: config.end
                        }
                    });
                }
            } catch (err) {
                console.error('Error checking working hours:', err);
            }
        }

        // For reservations, accept either single date or multiple dates array
        const dateList = bookingType === 'reservation' && dates && Array.isArray(dates) && dates.length > 0
            ? dates
            : (date ? [date] : []);

        if (!userId || !roomId || dateList.length === 0 || !startTime || !endTime) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        try {
            // Check if room exists
            const rooms = await RoomModel.findById(roomId);

            if (rooms.length === 0) {
                return res.status(404).json({ error: 'Room not found' });
            }

            const room = rooms[0];

            // Get user details
            const users = await UserModel.findById(userId);

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = users[0];

            // Check for conflicts and get queue positions
            const conflicts = [];
            const queueInfo = [];

            for (const d of dateList) {
                const existingBookings = await BookingModel.findConflicting(roomId, d, startTime, endTime);
                
                // Filter to only pending bookings for queue position
                const pendingBookings = existingBookings.filter(b => b.status === 'pending');
                
                if (pendingBookings.length > 0 || existingBookings.some(b => b.status === 'confirmed')) {
                    // There's a conflict - get queue position
                    const queue = await BookingModel.getQueuePosition(roomId, d, startTime, endTime);
                    queueInfo.push({
                        date: d,
                        queuePosition: queue.length + 1,
                        hasConfirmed: existingBookings.some(b => b.status === 'confirmed')
                    });
                    conflicts.push({
                        date: d,
                        hasConfirmed: existingBookings.some(b => b.status === 'confirmed'),
                        queuePosition: queue.length + 1
                    });
                }
            }

            // If booking type and there are confirmed conflicts, reject
            if (bookingType === 'booking') {
                const confirmedConflicts = conflicts.filter(c => c.hasConfirmed);
                if (confirmedConflicts.length > 0) {
                    return res.status(409).json({
                        error: 'Room is already confirmed for this time slot',
                        conflictingDates: confirmedConflicts.map(c => c.date)
                    });
                }
            }

            // Create bookings for all dates
            const bookingsToCreate = dateList.map(d => ({
                userId,
                roomId,
                date: d,
                startTime,
                endTime,
                type: bookingType
            }));

            const results = await BookingModel.createMany(bookingsToCreate);

            console.log(`✅ ${bookingType === 'reservation' ? 'Reservation' : 'Booking'} created: Room ${room.name} by ${user.email} for ${dateList.length} date(s)`);

            // Prepare queue position response
            const queuePositions = {};
            for (const qi of queueInfo) {
                queuePositions[qi.date] = qi.queuePosition;
            }

            // Build dates HTML for email
            const datesHtml = dateList.map(d => `<li style="margin: 5px 0;">${formatDateDisplay(d)}</li>`).join('');
            const datesText = dateList.map(d => formatDateDisplay(d)).join('\n');

            // Send email to admin
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                mailerService.sendMail(
                    adminEmail,
                    `New Room ${bookingType === 'reservation' ? 'Reservation' : 'Booking'} Request`,
                    `New ${bookingType} request:\n\nRoom: ${room.name}\nUser: ${user.full_name} (${user.email})\nDates:\n${datesText}\nTime: ${startTime} - ${endTime}`,
                    `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #0B4F6C;">New Room ${bookingType === 'reservation' ? 'Reservation' : 'Booking'} Request</h2>
                        <p>A user has placed a new ${bookingType} request.</p>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Room:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${room.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>User:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${user.full_name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${user.email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; vertical-align: top;"><strong>Date${dateList.length > 1 ? 's' : ''}:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                    <ul style="margin: 0; padding-left: 20px;">${datesHtml}</ul>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Time:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${startTime} - ${endTime}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Type:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; text-transform: capitalize;">${bookingType}</td>
                            </tr>
                        </table>
                        <div style="margin-top: 20px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL}/admin-dashboard" style="background: #0B4F6C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage in Dashboard</a>
                        </div>
                    </div>
                    `
                ).catch(err => console.error('Failed to send admin notification email:', err));
            }

            // Build queue notification HTML if needed
            let queueNotificationHtml = '';
            let queueNotificationText = '';
            if (Object.keys(queuePositions).length > 0) {
                const queueItems = Object.entries(queuePositions).map(([d, pos]) => 
                    `<li style="margin: 5px 0;"><strong>${formatDateDisplay(d)}:</strong> Position #${pos} in queue</li>`
                ).join('');
                queueNotificationHtml = `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
                        <p style="margin: 0 0 10px 0; font-weight: bold;">⚠️ Queue Position Notice:</p>
                        <ul style="margin: 0; padding-left: 20px;">${queueItems}</ul>
                        <p style="margin: 10px 0 0 0; font-size: 14px;">Someone else has already requested this room for the above date(s). Your request has been added to the queue and will be processed in order.</p>
                    </div>
                `;
                queueNotificationText = `\n\nNote: You are in the queue for the following dates:\n${Object.entries(queuePositions).map(([d, pos]) => `- ${formatDateDisplay(d)}: Position #${pos}`).join('\n')}`;
            }

            // Send confirmation email to user
            mailerService.sendMail(
                user.email,
                `Room ${bookingType === 'reservation' ? 'Reservation' : 'Booking'} Confirmation`,
                `Hello ${user.full_name},\n\nYour ${bookingType} request has been received!\n\nRoom: ${room.name}\nDates:\n${datesText}\nTime: ${startTime} - ${endTime}\n\nYou will receive a confirmation once reviewed.${queueNotificationText}\n\nBest regards,\nSwahilipot Hub Team`,
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #0B4F6C; border-bottom: 2px solid #0B4F6C; padding-bottom: 10px;">${bookingType === 'reservation' ? 'Reservation' : 'Booking'} Received!</h2>
                    <p>Hello <strong>${user.full_name}</strong>,</p>
                    <p>Thank you for choosing Swahilipot Hub. Your request for a room ${bookingType} is being processed.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">Summary:</h3>
                        <p style="margin: 5px 0;"><strong>Space:</strong> ${room.name}</p>
                        <p style="margin: 5px 0; vertical-align: top;"><strong>Date${dateList.length > 1 ? 's' : ''}:</strong></p>
                        <ul style="margin: 5px 0; padding-left: 30px;">${datesHtml}</ul>
                        <p style="margin: 5px 0;"><strong>Time Slot:</strong> ${startTime} - ${endTime}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> Pending Approval</p>
                    </div>

                    ${queueNotificationHtml}

                    <p>Our administration team will review your request and get back to you shortly.</p>
                    <div style="margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px;">
                        This is an automated message from Swahilipot Hub Room Booking System.
                    </div>
                </div>
                `
            ).catch(err => console.error('Failed to send confirmation email:', err));

            res.status(201).json({
                message: `${bookingType === 'reservation' ? 'Reservation' : 'Booking'} created successfully`,
                booking: {
                    ids: results.map(r => r.id),
                    roomName: room.name,
                    dates: dateList,
                    startTime,
                    endTime,
                    type: bookingType,
                    status: 'pending',
                    queuePositions
                }
            });

        } catch (error) {
            console.error('Booking error:', error);
            res.status(500).json({ error: 'Booking failed' });
        }
    },

    // UPDATE BOOKING STATUS (Approve/Reject)
    async updateBookingStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;

        if (!['confirmed', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be confirmed or rejected' });
        }

        try {
            const bookings = await BookingModel.findByIdWithDetails(id);

            if (bookings.length === 0) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            const booking = bookings[0];

            // Update status
            await BookingModel.updateStatus(id, status);

            console.log(`✅ Booking #${id} ${status} by admin`);

            // Send email to user
            const subject = status === 'confirmed'
                ? ` START PACKING! Your ${booking.type} is Confirmed`
                : ` Update regarding your ${booking.type} request`;

            const htmlContent = status === 'confirmed'
                ? `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #4CAF50; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #4CAF50;"> Awesome News, ${booking.full_name}!</h2>
                    <p>Your <strong>${booking.type} for ${booking.room_name}</strong> has been officially <strong>APPROVED</strong>.</p>
                    
                    <div style="background: #f0f9f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking.booking_date).toDateString()}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</p>
                        <p style="margin: 5px 0;"><strong>Location:</strong> SwahiliPot Hub</p>
                    </div>

                    <p>We're excited to host you! See you there.</p>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${process.env.FRONTEND_URL}/bookings" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Details</a>
                    </div>
                </div>`
                : `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f44336; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #f44336;">Update Regarding Your Request</h2>
                    <p>Hello ${booking.full_name},</p>
                    <p>We received your request for <strong>${booking.room_name}</strong> on ${new Date(booking.booking_date).toDateString()}.</p>
                    <p>Unfortunately, we are unable to approve this specific request at this time.</p>
                    <p>This could be due to a scheduling conflict or maintenance. Please try booking a different room or time slot.</p>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${process.env.FRONTEND_URL}" style="background: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Browse Available Rooms</a>
                    </div>
                </div>`;

            mailerService.sendMail(
                booking.email,
                subject,
                `Your booking status has been updated to: ${status}`,
                htmlContent
            ).catch(err => console.error('Failed to send status update email:', err));

            res.json({ message: `Booking ${status} successfully`, bookingId: id, newStatus: status });

        } catch (error) {
            console.error('Update status error:', error);
            res.status(500).json({ error: 'Failed to update booking status' });
        }
    },

    // GET ALL BOOKINGS (Admin Only)
    async getAdminBookings(req, res) {
        try {
            const bookings = await BookingModel.findAll();
            res.json(bookings);
        } catch (error) {
            console.error('Get admin bookings error:', error);
            res.status(500).json({ error: 'Failed to fetch admin bookings' });
        }
    },

    // GET USER BOOKINGS
    async getUserBookings(req, res) {
        const { userId } = req.params;

        if (req.user.id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        try {
            const bookings = await BookingModel.findByUserId(userId);
            res.json(bookings);
        } catch (error) {
            console.error('Get bookings error:', error);
            res.status(500).json({ error: 'Failed to fetch bookings' });
        }
    },

    // CANCEL BOOKING
    async cancelBooking(req, res) {
        const { id } = req.params;
        const { reason } = req.body;

        try {
            const bookings = await BookingModel.findByIdWithDetails(id);

            if (bookings.length === 0) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            const booking = bookings[0];

            if (booking.user_id !== req.user.id) {
                return res.status(403).json({ error: 'You can only cancel your own bookings' });
            }

            if (booking.status === 'cancelled') {
                return res.status(400).json({ error: 'Booking is already cancelled' });
            }

            await BookingModel.updateStatusWithReason(id, 'cancelled', reason);

            console.log(`✅ Booking #${id} cancelled by user ${req.user.id}`);

            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                mailerService.sendMail(
                    adminEmail,
                    'Booking Cancelled by User',
                    `A user has cancelled their booking.\n\nUser: ${booking.full_name} (${booking.email})\nRoom: ${booking.room_name}\nDate: ${formatDateDisplay(booking.booking_date)}\nTime: ${booking.start_time} - ${booking.end_time}\nCancellation Reason: ${reason}`,
                    `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #f44336;">Booking Cancelled by User</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>User:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${booking.full_name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${booking.email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Room:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${booking.room_name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDateDisplay(booking.booking_date)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Time:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${booking.start_time} - ${booking.end_time}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; vertical-align: top;"><strong>Cancellation Reason:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${reason}</td>
                            </tr>
                        </table>
                    </div>
                    `
                ).catch(err => console.error('Failed to send admin cancellation email:', err));
            }

            mailerService.sendMail(
                booking.email,
                'Booking Cancelled - SwahiliPot Hub',
                `Hello ${booking.full_name},\n\nYour booking has been cancelled.\n\nRoom: ${booking.room_name}\nDate: ${formatDateDisplay(booking.booking_date)}\nTime: ${booking.start_time} - ${booking.end_time}\nCancellation Reason: ${reason}\n\nIf you have any questions, please contact us.\n\nBest regards,\nSwahiliPot Hub Team`,
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #f44336;">Booking Cancelled</h2>
                    <p>Hello <strong>${booking.full_name}</strong>,</p>
                    <p>Your booking has been cancelled as requested.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Room:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${booking.room_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDateDisplay(booking.booking_date)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Time:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${booking.start_time} - ${booking.end_time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; vertical-align: top;"><strong>Cancellation Reason:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${reason}</td>
                        </tr>
                    </table>
                    <p>If you have any questions, please contact us.</p>
                    <div style="margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px;">
                        This is an automated message from SwahiliPot Hub Room Booking System.
                    </div>
                </div>
                `
            ).catch(err => console.error('Failed to send user cancellation email:', err));

            res.json({ message: 'Booking cancelled successfully', bookingId: id });

        } catch (error) {
            console.error('Cancel booking error:', error);
            res.status(500).json({ error: 'Failed to cancel booking' });
        }
    }
};

module.exports = bookingController;
