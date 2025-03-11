# Interview Scheduler

A Calendly-like application for scheduling interviews. This application allows users to connect their Google Calendar and Zoom accounts, set their availability, and let interviewees book interview slots.

## Features

- **User Authentication**: Sign in with Google
- **Google Calendar Integration**: Sync your availability with Google Calendar
- **Zoom Integration**: Automatically create Zoom meetings for scheduled interviews
- **Availability Management**: Set your weekly availability and exception dates
- **Interview Settings**: Configure maximum interviews per day, advance booking days, meeting duration, and buffer time
- **Booking Management**: View, confirm, and cancel interview bookings
- **Public Booking Page**: Share a unique link for interviewees to book interviews

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (via Prisma)
- **Authentication**: NextAuth.js
- **API Integrations**: Google Calendar API, Zoom API

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/interview-scheduler.git
   cd interview-scheduler
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   # NextAuth
   NEXTAUTH_URL="http://localhost:3001"
   NEXTAUTH_SECRET="your-nextauth-secret-key"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Zoom OAuth
   ZOOM_CLIENT_ID="your-zoom-client-id"
   ZOOM_CLIENT_SECRET="your-zoom-client-secret"
   ZOOM_REDIRECT_URI="http://localhost:3001/api/auth/callback/zoom"
   ```

4. Set up the database:
   ```
   npx prisma db push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Usage

1. **Sign In**: Sign in with your Google account
2. **Connect Accounts**: Connect your Google Calendar and Zoom accounts in the Settings page
3. **Set Availability**: Configure your weekly availability and exception dates
4. **Share Booking Link**: Share your unique booking link with interviewees
5. **Manage Bookings**: View and manage your interview bookings

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Headless UI](https://headlessui.dev/)
- [Heroicons](https://heroicons.com/)
