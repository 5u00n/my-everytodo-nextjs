# EveryTodo - Next.js PWA with Firebase

A comprehensive alarm, todo, and calendar application built with Next.js 16, Firebase, and Tailwind CSS. Features persistent alarms that won't stop until tasks are completed.

## 🚀 Features

### Core Features

- **Google Authentication Only** - Secure login with Google OAuth
- **Persistent Alarms** - Alarms that continue ringing/vibrating until tasks are completed
- **Todo Management** - Create, edit, and manage todo lists with checkboxes
- **Calendar Integration** - View todos and alarms in calendar format (month/week/day views)
- **Activity Reports** - Generate comprehensive reports of your activity
- **PWA Support** - Install as a native app on mobile devices

### Alarm System

- **Set Time** - Schedule alarms for specific times
- **Task Lists** - Add multiple tasks with checkboxes for each alarm
- **Repeat Options** - Today, tomorrow, all days, exclude weekdays
- **Alarm Controls** - Enable/disable alarm, vibration, sound
- **Notification Popup** - Browser notifications (enabled by default)
- **Snooze Function** - 1-minute snooze option
- **Persistent Behavior** - Alarms continue until all tasks are checked off

### Calendar Views

- **Month View** - See all todos and alarms for the month
- **Week View** - Focused weekly view
- **Day View** - Detailed daily schedule

## 🛠️ Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Modern styling
- **Lucide React** - Beautiful icons
- **React Big Calendar** - Calendar component

### Backend & Database

- **Firebase Authentication** - Google OAuth
- **Firebase Realtime Database** - Real-time data sync
- **Firebase Cloud Messaging** - Push notifications

### PWA Features

- **Service Workers** - Background tasks and caching
- **Web App Manifest** - App installation
- **Push Notifications** - Browser notifications
- **Offline Support** - Basic offline functionality

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project
- Google Cloud Console project

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd my-everytodo-nextjs
npm install
```

### 2. Firebase Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "everytodo-app"
4. Enable Google Analytics (optional)
5. Click "Create project"

#### Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Add your domain to authorized domains

#### Create Realtime Database

1. Go to "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location close to your users
5. Click "Done"

#### Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web app" icon
4. Register app with name "EveryTodo Web"
5. Copy the config object

### 3. Environment Variables

```bash
cp env.example .env.local
```

Edit `.env.local` with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── LoginPage.tsx      # Authentication page
│   └── Dashboard.tsx      # Main dashboard
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utilities
│   └── firebase.ts        # Firebase configuration
└── types/                 # TypeScript types
    └── index.ts           # Type definitions
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

#### AuthContext

Manages Firebase authentication state and provides:

- User login/logout
- Authentication state
- Loading states

#### Firebase Configuration

Conditional Firebase initialization that:

- Only initializes when valid config is present
- Prevents build errors with missing environment variables
- Provides fallback for development

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Manual Deployment

```bash
npm run build
npm run start
```

## 🔒 Security

### Database Rules

The app uses Firebase Realtime Database with security rules:

- Users can only access their own data
- Authentication required for all operations
- Data is organized by user ID

### Environment Variables

- All Firebase config is public (required for client-side)
- No sensitive server-side secrets
- Environment variables are validated

## 📱 PWA Features

### Installation

- Install button appears in supported browsers
- Works on mobile and desktop
- Offline functionality for basic features

### Notifications

- Browser notifications for alarms
- Persistent until tasks are completed
- Snooze functionality
- Custom notification actions

## 🐛 Troubleshooting

### Common Issues

#### Firebase Not Initialized

- Check environment variables are set correctly
- Verify Firebase project configuration
- Ensure Google Authentication is enabled

#### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`

#### Authentication Issues

- Verify Google OAuth is enabled in Firebase Console
- Check authorized domains include your domain
- Clear browser cache and cookies

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:

- Check the troubleshooting section
- Open an issue on GitHub
- Review Firebase documentation

---

**Built with ❤️ using Next.js 16, Firebase, and Tailwind CSS**
