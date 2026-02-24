const faqDatabase = [
  // Booking
  {
    keywords: ['book', 'booking', 'reserve', 'reservation', 'make a booking'],
    response: 'To book a room: 1) Log in to your account, 2) Go to Dashboard, 3) Select your desired date and time, 4) Choose an available room, 5) Submit your booking request.',
    language: 'en'
  },
  {
    keywords: ['available', 'availability', 'free', 'open', 'schedule'],
    response: 'You can view room availability on the Dashboard. All rooms show their current schedule and availability status. Green indicates available, red means booked.',
    language: 'en'
  },
  {
    keywords: ['cancel', 'cancellation', 'cancel booking', 'cancel reservation'],
    response: 'You can cancel your booking from the Dashboard. Go to your bookings list and click cancel on the booking you wish to cancel. Please cancel at least 30 minutes before your scheduled time.',
    language: 'en'
  },
  {
    keywords: ['reschedule', 'change time', 'modify booking', 'edit booking'],
    response: 'To modify your booking, please cancel the current booking and create a new one with your preferred time. This ensures accurate availability tracking.',
    language: 'en'
  },
  // Rooms
  {
    keywords: ['room', 'rooms', 'space', 'spaces', 'meeting room'],
    response: 'SwahiliPot Hub has multiple rooms available including the Meeting Room, Creative Space, Training Room, and Co-working Area. Each room has different capacity and facilities.',
    language: 'en'
  },
  {
    keywords: ['capacity', 'how many', 'people', 'size', 'seats'],
    response: 'Room capacity varies: Meeting Room (10 people), Creative Space (8 people), Training Room (20 people), Co-working Area (15 people). You can view capacity details on each room listing.',
    language: 'en'
  },
  {
    keywords: ['facilities', 'amenities', 'features', 'equipment', 'projector', 'wifi', 'ac'],
    response: 'Room facilities include: WiFi, Air Conditioning, Projector, Whiteboard, Video Conferencing, and Smart TV. Not all rooms have all facilities - check each room listing for specific amenities.',
    language: 'en'
  },
  {
    keywords: ['price', 'cost', 'pricing', 'fee', 'charge', 'how much'],
    response: 'Room pricing varies by room type and duration. Standard rooms start from $20/hour. Premium rooms with more amenities are $40/hour. Members receive a 20% discount.',
    language: 'en'
  },
  // Account
  {
    keywords: ['register', 'sign up', 'create account', 'signup'],
    response: 'To register: Click Sign Up on the login page, enter your email, password, full name, and department. You will receive a verification email to activate your account.',
    language: 'en'
  },
  {
    keywords: ['login', 'log in', 'sign in', 'access', 'password'],
    response: 'Log in with your email and password at /login. If you forgot your password, click "Forgot Password" to reset it.',
    language: 'en'
  },
  {
    keywords: ['forgot password', 'reset password', 'reset', 'forgotten'],
    response: 'Click "Forgot Password" on the login page, enter your email, and you will receive a reset code. Use the code to create a new password.',
    language: 'en'
  },
  {
    keywords: ['verify', 'verification', 'email', 'confirm email'],
    response: 'After registration, check your email for a verification link. Click the link to verify your account. If you did not receive it, check your spam folder or contact support.',
    language: 'en'
  },
  // Approval
  {
    keywords: ['approve', 'approval', 'pending', 'waiting', 'confirmed'],
    response: 'Bookings may require admin approval depending on the room and time. Pending bookings show as "Pending Approval" until an admin reviews and approves them.',
    language: 'en'
  },
  {
    keywords: ['reject', 'rejected', 'denied', 'declined'],
    response: 'Your booking may be rejected if: 1) Room is already booked, 2) Requested time conflicts with another booking, 3) Insufficient permissions. You will receive a notification with the reason.',
    language: 'en'
  },
  // Admin
  {
    keywords: ['admin', 'administration', 'manage', 'dashboard'],
    response: 'Admin features include: managing rooms (add/edit/delete), viewing all bookings, approving/rejecting requests, and viewing analytics. Admin dashboard is at /admin/dashboard.',
    language: 'en'
  },
  {
    keywords: ['add room', 'create room', 'new room', 'room management'],
    response: 'Only admins can add rooms. Go to Admin Dashboard > Rooms > Add Room. Specify room name, capacity, facilities, and pricing.',
    language: 'en'
  },
  // Notifications
  {
    keywords: ['notification', 'notify', 'alert', 'email notification', 'reminder'],
    response: 'You will receive email notifications for: booking confirmation, approval/rejection, upcoming reminders (30 minutes before), and any changes to your booking.',
    language: 'en'
  },
  {
    keywords: ['reminder', 'upcoming', 'soon'],
    response: 'You will receive a reminder 30 minutes before your booking starts. This gives you time to prepare and ensures you do not miss your reservation.',
    language: 'en'
  },
  // Contact
  {
    keywords: ['contact', 'support', 'help', 'phone', 'email', 'reach'],
    response: 'For support, contact SwahiliPot Hub management: Email support@swahilipothub.com or call +255 700 000 000 during business hours.',
    language: 'en'
  },
  {
    keywords: ['location', 'address', 'where', 'directions'],
    response: 'SwahiliPot Hub is located in Zanzibar, Tanzania. Full address: Beach Road, Stone Town, Zanzibar.',
    language: 'en'
  },
  // Hours
  {
    keywords: ['hours', 'time', 'open', 'closing', 'business hours'],
    response: 'SwahiliPot Hub is open Monday-Friday 8:00 AM - 8:00 PM, Saturday 9:00 AM - 6:00 PM. Room booking is available 24/7 for members.',
    language: 'en'
  },
  // Payment
  {
    keywords: ['payment', 'pay', 'credit card', 'cash', 'mpesa', 'mobile money'],
    response: 'We accept credit/debit cards (Visa, Mastercard), mobile money (M-Pesa), and cash payments at the front desk. Payment is collected after approval.',
    language: 'en'
  },
  {
    keywords: ['refund', 'money back', 'reimburse'],
    response: 'Refunds are available for cancellations made 24+ hours before the booking time. Refunds take 5-7 business days to process.',
    language: 'en'
  },
  // General
  {
    keywords: ['what is', 'about', 'explain', 'tell me about'],
    response: 'SwahiliPot Hub Room Booking System (BS1) is a digital platform for reserving rooms and spaces at SwahiliPot Hub. It allows users to book rooms while admins manage availability and approvals.',
    language: 'en'
  },
  {
    keywords: ['how to', 'how does', 'instructions', 'guide'],
    response: 'Here is how to use BS1: 1) Create an account or log in, 2) View available rooms on Dashboard, 3) Select date, time, and room, 4) Submit booking request, 5) Wait for approval (if required), 6) Receive confirmation.',
    language: 'en'
  },
  {
    keywords: ['my bookings', 'history', 'past bookings', 'view bookings'],
    response: 'View all your bookings in the Dashboard under "My Bookings". This shows past, upcoming, pending, and cancelled bookings with their status.',
    language: 'en'
  },
  // Swahili
  {
    keywords: ['chapa', 'angalia', 'nafasi', 'available'],
    una: 'Unaweza kuangalia nafasi zinazopatikana kwenye Dashboard. Chumba cheusi kinaonyesha kimechukuliwa, kijani kinaonyesha inapatikana.',
    language: 'sw'
  },
  {
    keywords: ['kuhusu', 'ni nini', 'system'],
    response: 'SwahiliPot Hub Room Booking System (BS1) ni mfumo wa kidigitali kwa ajili ya kuhifadhi vyumba na nafasi katika SwahiliPot Hub.',
    language: 'sw'
  }
];

const defaultResponse = {
  response: "I couldn't find information about that. Try asking about: booking a room, checking availability, room capacity, facilities, pricing, login, or contact support@swahilipothub.com",
  matchedKeyword: null
};

const quickReplies = [
  'How do I book a room?',
  'How do I check room availability?',
  'What rooms are available?',
  'How do I cancel my booking?',
  'What facilities do rooms have?',
  'How do I contact support?'
];

function findResponse(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') {
    return defaultResponse;
  }

  const normalizedMessage = userMessage.toLowerCase().trim();

  for (const entry of faqDatabase) {
    for (const keyword of entry.keywords) {
      if (normalizedMessage.includes(keyword.toLowerCase())) {
        return {
          response: entry.response || entry.una,
          matchedKeyword: keyword
        };
      }
    }
  }

  return defaultResponse;
}

function getQuickReplies() {
  return quickReplies;
}

module.exports = {
  findResponse,
  getQuickReplies,
  faqDatabase
};
