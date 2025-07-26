# HotelTasker - Hotel Task Management System

HotelTasker is a web application designed to solve task management challenges in hotels. It allows guests to submit service requests, automatically assigns tasks to department staff, and provides administrators with tools to monitor performance and manage departments.

## Features

### For Hotel Guests:
- Submit service requests to specific departments
- Track status of submitted requests
- Simple and intuitive interface

### For Department Staff:
- Receive task assignments automatically based on workload
- Accept or reject tasks within a time limit
- Mark tasks as completed
- View task history and performance metrics

### For Administrators:
- Dashboard with employee performance metrics
- Department management (create, edit, delete)
- Employee assignment to departments
- View comprehensive activity logs

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Firebase (Authentication, Realtime Database)
- **State Management:** React Context API

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd dsj-hotel-task-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password method)
   - Create a Realtime Database
   - Set up database rules for security

4. Create a `.env.local` file in the root directory with the following content:
   ```
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url

   # NextAuth Configuration
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Initial Setup

1. Register an admin user through the signup form
2. Create departments from the admin dashboard
3. Register department staff users and assign them to departments
4. Register guest users with room numbers

## Project Structure

```
/src
  /app                  # Next.js App Router pages
  /components           # Reusable UI components
    /auth               # Authentication components
    /navigation         # Navigation components
    /ui                 # UI components (buttons, inputs, etc.)
  /context              # React Context providers
  /firebase             # Firebase configuration
  /models               # TypeScript interfaces and types
  /services             # Firebase service functions
```

## Deployment

This application can be deployed to Vercel with the following steps:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deploy

## License

This project is licensed under the MIT License.
