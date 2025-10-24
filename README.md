# EveryTodo - Next.js PWA with Firebase

A comprehensive alarm, todo, and calendar application built with Next.js 16, Firebase, and Tailwind CSS. Features persistent alarms that won't stop until tasks are completed, with advanced UI/UX enhancements and smart loading states.

## 📱 Mobile API Integration

### Mobile API Branch (`mobile-api-integration`)

This repository includes a comprehensive mobile API infrastructure for future native mobile app development. The mobile API is available in the `mobile-api-integration` branch and provides:

#### 🚀 Mobile API Features

- **Complete REST API** - Full CRUD operations for todos, tasks, alarms, and notifications
- **Firebase Authentication** - Secure token-based authentication for mobile apps
- **Push Notifications** - VAPID-based push notification support
- **Offline Sync** - Conflict resolution and offline data synchronization
- **Analytics & Reports** - Comprehensive reporting endpoints for mobile analytics
- **Calendar Integration** - Event-based calendar data for mobile apps
- **Health Monitoring** - API health check endpoints

#### 📋 API Endpoints

- **Authentication**: `/api/mobile/auth/*`
- **Todos**: `/api/mobile/todos/*`
- **Tasks**: `/api/mobile/todos/[id]/tasks/*`
- **Alarms**: `/api/mobile/alarms/*`
- **Notifications**: `/api/mobile/notifications/*`
- **Reports**: `/api/mobile/reports/*`
- **Calendar**: `/api/mobile/calendar`
- **Sync**: `/api/mobile/sync`
- **Health**: `/api/mobile/health`

#### 📚 Documentation

- **API Documentation**: `MOBILE_API_DOCUMENTATION.md` - Complete API reference
- **Setup Guide**: `MOBILE_API_SETUP.md` - Configuration and integration guide
- **TypeScript Types**: `src/types/mobile-api.ts` - Type definitions for mobile API

#### 🔧 Getting Started with Mobile API

1. **Switch to Mobile Branch**:
   ```bash
   git checkout mobile-api-integration
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   - Set up Firebase Admin SDK credentials
   - Configure VAPID keys for push notifications
   - See `MOBILE_API_SETUP.md` for detailed instructions

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Test API Endpoints**:
   - Health check: `GET /api/mobile/health`
   - Authentication: `POST /api/mobile/auth/login`
   - See documentation for complete examples

#### 🏗️ Mobile App Integration

The mobile API is designed to work with:
- **React Native** - Complete integration examples provided
- **Flutter** - Dart/Flutter examples included
- **Native iOS/Android** - REST API compatible with any HTTP client

#### 📝 Branch Status

- **Main Branch**: Clean web application without mobile API
- **Mobile Branch**: `mobile-api-integration` - Complete mobile API infrastructure
- **Documentation**: Comprehensive guides and examples included

---

## 🚀 Features

### Core Features

- **Google Authentication Only** - Secure login with Google OAuth
- **Persistent Alarms** - Alarms that continue ringing/vibrating until tasks are completed
- **Todo Management** - Create, edit, and manage todo lists with checkboxes
- **Calendar Integration** - View todos and alarms in calendar format (month/week/day views)
- **Activity Reports** - Generate comprehensive reports of your activity
- **PWA Support** - Install as a native app on mobile devices
- **Smart Loading States** - Skeleton loading instead of spinners for better UX
- **Dynamic Text Colors** - Automatic text color adjustment based on background brightness
- **Responsive Design** - Optimized for mobile and desktop with compact navigation

### Alarm System

- **Set Time** - Schedule alarms for specific times
- **Task Lists** - Add multiple tasks with checkboxes for each alarm
- **Repeat Options** - Today, tomorrow, all days, exclude weekends
- **Alarm Controls** - Enable/disable alarm, vibration, sound
- **Notification Popup** - Browser notifications (enabled by default)
- **Snooze Function** - 1-minute snooze option
- **Persistent Behavior** - Alarms continue until all tasks are checked off
- **Realistic Ringing Sound** - "Ring-ring-pause" pattern using Web Audio API
- **Enhanced Vibration** - Advanced vibration patterns for better attention
- **Locked Phone Support** - Alarms work even when phone is locked
- **Repeating Notifications** - Additional notifications every 10 seconds for 2 minutes
- **Elegant Alarm Popup** - Beautiful, classy alarm dialog with glassmorphism design

### Todo Management

- **Cross-off from Home** - Complete todos directly from the home page
- **Upcoming Tasks View** - Home page shows only upcoming todos
- **Smart Filtering** - Filter by status, priority, and date
- **Quick Actions** - Fast todo creation and management
- **Real-time Sync** - Instant updates across all devices
- **Task Details** - Detailed task information with descriptions
- **Priority Levels** - Organize tasks by importance
- **Due Dates** - Set and track task deadlines

### Calendar Views

- **Month View** - See all todos and alarms for the month
- **Week View** - Focused weekly view
- **Day View** - Detailed daily schedule
- **Interactive Calendar** - Click dates to view details
- **Task Indicators** - Visual indicators for tasks and alarms
- **Date Navigation** - Easy month/week/day switching

### UI/UX Enhancements

- **Skeleton Loading** - No more loading spinners, only realistic skeleton placeholders
- **Dynamic Text Colors** - Text automatically adjusts color based on background brightness
- **Compact Mobile Navigation** - Icon-only navigation bar for mobile devices
- **Glassmorphism Design** - Modern glass-like UI elements
- **Smooth Animations** - Fluid transitions and micro-interactions
- **Dark/Light Theme** - Automatic theme switching with system preference
- **Responsive Layout** - Optimized for all screen sizes
- **Touch-Friendly** - Large touch targets for mobile devices

### PWA Features

- **Service Workers** - Background tasks and intelligent caching
- **Web App Manifest** - App installation with custom icons
- **Push Notifications** - Browser notifications with VAPID keys
- **Offline Support** - Basic offline functionality
- **Install Prompts** - Smart installation prompts for different platforms
- **Update Notifications** - Automatic app update notifications
- **Cache Management** - Intelligent cache busting for development

### Advanced Features

- **Version Management** - Automatic version tracking and updates
- **Debug Tools** - Development-specific debugging features
- **Cache Busting** - Smart cache management for development
- **Error Handling** - Comprehensive error handling and recovery
- **Performance Optimization** - Optimized loading and rendering
- **Accessibility** - WCAG compliant with keyboard navigation
- **SEO Optimized** - Meta tags and structured data

## 🛠️ Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router and Turbopack
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS v4** - Modern utility-first styling
- **Lucide React** - Beautiful, consistent icons
- **React Big Calendar** - Advanced calendar component
- **Framer Motion** - Smooth animations and transitions
- **React Hook Form** - Efficient form handling

### Backend & Database

- **Firebase Authentication** - Google OAuth integration
- **Firebase Realtime Database** - Real-time data synchronization
- **Firebase Cloud Messaging** - Push notifications with VAPID
- **Firebase Hosting** - Fast, secure hosting

### PWA & Performance

- **Service Workers** - Background sync and caching
- **Web App Manifest** - Native app-like experience
- **Push API** - Browser push notifications
- **Web Audio API** - Custom alarm sounds
- **Vibration API** - Mobile vibration patterns
- **ResizeObserver** - Dynamic UI adjustments
- **MutationObserver** - Real-time DOM monitoring

### Development Tools

- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Next.js DevTools** - Development utilities
- **Firebase CLI** - Firebase development tools

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project
- Google Cloud Console project
- Modern browser with PWA support

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

#### Enable Cloud Messaging

1. Go to "Cloud Messaging"
2. Generate VAPID keys
3. Add your domain to authorized domains
4. Configure notification settings

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
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
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
│   ├── layout.tsx         # Root layout with providers and SW
│   ├── page.tsx           # Main page with auth routing
│   ├── globals.css        # Global styles and animations
│   └── favicon.ico        # App icon
├── components/            # React components
│   ├── LoginPage.tsx      # Authentication page
│   ├── Dashboard.tsx      # Main dashboard with navigation
│   ├── TodoList.tsx       # Todo management interface
│   ├── TodoModal.tsx      # Todo creation/editing modal
│   ├── TaskDetailModal.tsx # Task details and editing
│   ├── CalendarView.tsx   # Calendar interface
│   ├── ReportsView.tsx    # Activity reports
│   ├── AlarmPopup.tsx     # Elegant alarm dialog
│   ├── AnimatedHero.tsx   # Dynamic home page hero
│   ├── CustomFloatingDock.tsx # macOS-style navigation
│   ├── ProfileModal.tsx   # User profile and settings
│   ├── PushNotificationTest.tsx # Debug notifications
│   ├── PWAInstallPrompt.tsx # App installation prompts
│   ├── UpdateNotification.tsx # App update notifications
│   ├── UserAvatar.tsx     # User avatar component
│   ├── VersionDisplay.tsx # Version information
│   ├── Skeleton.tsx       # Loading skeleton components
│   ├── DynamicTextColor.tsx # Smart text color adjustment
│   ├── theme-provider.tsx # Theme management
│   ├── theme-toggle.tsx   # Theme switching
│   └── ui/                # Reusable UI components
│       ├── button.tsx     # Button component
│       ├── dropdown-menu.tsx # Dropdown menu
│       └── floating-dock.tsx # Dock component
├── contexts/              # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   └── NotificationContext.tsx # Notification management
├── lib/                   # Utilities and services
│   ├── firebase.ts        # Firebase configuration
│   ├── alarmManager.ts    # Alarm management system
│   ├── notificationService.ts # Notification handling
│   ├── pushNotificationService.ts # Push notification service
│   ├── alarmManager.ts    # Alarm scheduling and management
│   ├── utils.ts           # Utility functions
│   └── version.ts         # Version management
├── types/                 # TypeScript types
│   └── index.ts           # Type definitions
└── scripts/               # Build and utility scripts
    ├── generate-sw.js     # Service worker generation
    ├── generate-vapid-keys.js # VAPID key generation
    └── version-manager.js # Version management
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run generate-sw` - Generate service worker
- `npm run generate-vapid` - Generate VAPID keys

### Key Components

#### AuthContext

Manages Firebase authentication state and provides:

- User login/logout with Google OAuth
- Authentication state management
- Loading states and error handling
- User profile management

#### AlarmManager

Comprehensive alarm system with:

- Time-based alarm scheduling
- Task list management
- Vibration and sound controls
- Persistent alarm behavior
- Browser notification integration

#### DynamicTextColor

Smart text color adjustment:

- Automatic background brightness detection
- Real-time color adjustment
- Performance optimized with observers
- Customizable thresholds

#### Skeleton Components

Modern loading states:

- Realistic content placeholders
- No blocking loading screens
- Context-aware skeletons
- Smooth transitions

### Firebase Configuration

Conditional Firebase initialization that:

- Only initializes when valid config is present
- Prevents build errors with missing environment variables
- Provides fallback for development
- Handles authentication state changes

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically with preview deployments

### Firebase Hosting

```bash
npm run build
firebase deploy
```

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
- Input validation and sanitization

### Environment Variables

- All Firebase config is public (required for client-side)
- VAPID keys are public (required for push notifications)
- No sensitive server-side secrets
- Environment variables are validated

### PWA Security

- HTTPS required for PWA features
- Secure service worker implementation
- Content Security Policy compliance
- XSS protection

## 📱 PWA Features

### Installation

- Install button appears in supported browsers
- Works on mobile and desktop
- Custom app icons and splash screens
- Offline functionality for basic features

### Notifications

- Browser notifications for alarms
- Persistent until tasks are completed
- Snooze functionality
- Custom notification actions
- VAPID-based push notifications

### Service Worker

- Intelligent caching strategy
- Background sync
- Update notifications
- Offline fallbacks

## 🎨 UI/UX Features

### Design System

- **Glassmorphism** - Modern glass-like UI elements
- **Dynamic Colors** - Automatic text color adjustment
- **Smooth Animations** - Framer Motion powered transitions
- **Responsive Design** - Mobile-first approach
- **Dark/Light Theme** - System preference detection

### Mobile Optimization

- **Compact Navigation** - Icon-only mobile navigation
- **Touch-Friendly** - Large touch targets
- **Gesture Support** - Swipe and tap interactions
- **Performance** - Optimized for mobile devices

### Loading States

- **Skeleton Loading** - No more loading spinners
- **Progressive Loading** - Content appears as it loads
- **Smart Caching** - Intelligent cache management
- **Error Handling** - Graceful error recovery

## 🐛 Troubleshooting

### Common Issues

#### Firebase Not Initialized

- Check environment variables are set correctly
- Verify Firebase project configuration
- Ensure Google Authentication is enabled
- Check VAPID keys are configured

#### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`
- Verify all environment variables

#### Authentication Issues

- Verify Google OAuth is enabled in Firebase Console
- Check authorized domains include your domain
- Clear browser cache and cookies
- Check Firebase project settings

#### PWA Issues

- Ensure HTTPS is enabled
- Check service worker registration
- Verify manifest.json configuration
- Test on different browsers

#### Alarm Issues

- Check notification permissions
- Verify VAPID keys are correct
- Test on different devices
- Check browser notification settings

### Development Tools

#### Cache Clearing

- Use `Ctrl+Shift+C` to clear development cache
- Clear browser cache manually
- Use incognito mode for testing
- Check service worker updates

#### Debug Mode

- Enable debug notifications in development
- Check browser console for errors
- Use React DevTools
- Monitor Firebase console

## 📊 Performance

### Optimization Features

- **Code Splitting** - Automatic route-based splitting
- **Image Optimization** - Next.js image optimization
- **Bundle Analysis** - Webpack bundle analyzer
- **Lazy Loading** - Component lazy loading
- **Caching Strategy** - Intelligent service worker caching

### Metrics

- **Lighthouse Score** - 90+ performance score
- **Core Web Vitals** - Optimized for all metrics
- **Bundle Size** - Minimized JavaScript bundle
- **Load Time** - Fast initial page load

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
- Check Next.js documentation

## 🔄 Changelog

### Latest Updates

- ✅ Removed all loading spinners - skeleton loading only
- ✅ Dynamic text color adjustment based on background
- ✅ Compact mobile navigation with icons only
- ✅ Enhanced alarm popup with elegant design
- ✅ Realistic "ring-ring" alarm sound
- ✅ Improved vibration patterns for locked phones
- ✅ Cross-off todos from home page
- ✅ Upcoming tasks view on home page
- ✅ Modal positioning fixes for mobile
- ✅ Service worker optimization for development
- ✅ Cache busting improvements
- ✅ PWA manifest fixes

---

**Built with ❤️ using Next.js 16, Firebase, Tailwind CSS, and modern web technologies**
