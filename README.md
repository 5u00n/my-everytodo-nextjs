# EveryTodo - Next.js PWA with Firebase

A comprehensive alarm, todo, and calendar application built with Next.js PWA and Firebase Realtime Database.

## 🎯 Project Overview

EveryTodo is a persistent alarm and task management app that combines the functionality of phone alarms, todo lists, and calendar views. The app ensures alarms don't stop ringing/vibrating until the associated task is completed.

## ✅ Feature Analysis & Feasibility

### ✅ **FULLY SUPPORTED FEATURES**

#### 1. Authentication

- **Google OAuth Login Only** ✅
  - Firebase Authentication with Google provider
  - Secure user session management
  - PWA-compatible authentication flow

#### 2. Todo/Alarm Creation

- **Set Time** ✅
  - Date/time picker for alarm scheduling
  - Timezone support
- **Task Management** ✅
  - Checkbox-based todo items
  - Multiple tasks per alarm
  - Task completion tracking
- **Repeatability Options** ✅
  - Today only
  - Tomorrow only
  - All days (daily)
  - Weekdays only (Mon-Fri)
  - Custom repeat patterns
- **Alarm Controls** ✅
  - Alarm on/off toggle
  - Vibration control
  - Notification popup (enabled by default)

#### 3. Calendar UI

- **Multiple View Modes** ✅
  - Month view
  - Week view
  - Day view
  - Agenda/list view
- **Visual Integration** ✅
  - All alarms and todos displayed on calendar
  - Color-coded by priority/type
  - Drag-and-drop rescheduling

#### 4. Persistent Alarm System ⚠️

- **Core Functionality** ✅
  - Alarms continue until task completion
  - 1-minute snooze functionality
  - Multiple notification attempts
- **PWA Limitations** ⚠️
  - Background execution limited by browser
  - Requires user interaction for persistent notifications
  - Service Worker for background tasks

#### 5. Activity Reports ✅

- **Comprehensive Analytics**
  - Task completion rates
  - Alarm response times
  - Productivity metrics
  - Exportable reports (PDF/CSV)

## 🏗️ Technical Architecture

### Frontend Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **PWA** - Progressive Web App capabilities
- **Service Worker** - Background task handling

### Backend & Database

- **Firebase Realtime Database** - Real-time data sync
- **Firebase Authentication** - Google OAuth
- **Firebase Cloud Messaging** - Push notifications

### Key Libraries

- `@firebase/auth` - Authentication
- `@firebase/database` - Realtime database
- `react-big-calendar` - Calendar component
- `date-fns` - Date manipulation
- `workbox-webpack-plugin` - PWA service worker

## 📱 PWA Capabilities

### ✅ **Supported Features**

- Offline functionality
- App-like experience
- Push notifications
- Background sync
- Installable on devices

### ⚠️ **Limitations & Workarounds**

- **Background Execution**: Limited by browser policies
  - Solution: Service Worker + Notification API
  - User must interact with notifications
- **Persistent Alarms**: Cannot run indefinitely in background
  - Solution: Multiple notification attempts
  - Progressive escalation (sound → vibration → popup)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase project
- Google Cloud Console project

### Quick Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Configure Firebase credentials in .env.local

# Run development server
npm run dev
```

### Detailed Setup

See [SETUP.md](./SETUP.md) for complete setup instructions including:

- Firebase configuration
- Environment variables
- Vercel deployment
- PWA configuration

### Firebase Setup

1. Create Firebase project
2. Enable Authentication (Google provider)
3. Enable Realtime Database
4. Configure security rules
5. Add web app to Firebase project

## 📋 Implementation Plan

### Phase 1: Core Setup ✅

- [x] Project initialization
- [x] Firebase configuration
- [x] PWA setup
- [x] Authentication flow

### Phase 2: Core Features ✅

- [x] Todo/alarm creation
- [x] Calendar integration
- [x] Notification system
- [x] Persistent alarm logic

### Phase 3: Advanced Features ✅

- [x] Activity reports
- [x] Offline support
- [x] Performance optimization
- [x] Testing

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase Rules

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "todos": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "alarms": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## 📊 Database Schema

### Users Collection

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
  lastLoginAt: number;
}
```

### Todos Collection

```typescript
interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  scheduledTime: number;
  tasks: Task[];
  repeatPattern: RepeatPattern;
  alarmSettings: AlarmSettings;
  isCompleted: boolean;
  isActive: boolean; // For persistent alarms
  snoozeUntil?: number; // When snoozed until
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface RepeatPattern {
  type: "once" | "daily" | "weekdays" | "custom";
  days?: number[]; // For custom patterns
}

interface AlarmSettings {
  enabled: boolean;
  vibrate: boolean;
  notification: boolean;
  sound?: string;
  volume?: number;
}
```

## 🎨 UI/UX Design

### Design Principles

- **Mobile-first**: Optimized for mobile devices
- **Accessibility**: WCAG 2.1 compliance
- **Intuitive**: Familiar alarm/todo interface
- **Responsive**: Works on all screen sizes

### Key Components

- Calendar view with drag-and-drop
- Alarm creation modal
- Persistent notification system
- Activity dashboard
- Settings panel

## 🔔 Notification Strategy

### Multi-layered Approach

1. **Browser Notifications**: Primary alert method
2. **Sound Alerts**: Audio notifications
3. **Vibration**: Haptic feedback
4. **Visual Indicators**: UI state changes
5. **Progressive Escalation**: Increasing urgency

### Background Handling

- Service Worker manages background tasks
- Notification click handlers
- Snooze functionality
- Task completion tracking

## 📈 Performance Considerations

### Optimization Strategies

- **Code Splitting**: Lazy load components
- **Caching**: Service Worker caching
- **Database**: Efficient queries and indexing
- **Bundle Size**: Tree shaking and optimization

### Monitoring

- Performance metrics
- User engagement tracking
- Error monitoring
- Analytics integration

## 🧪 Testing Strategy

### Test Types

- **Unit Tests**: Component testing
- **Integration Tests**: Firebase integration
- **E2E Tests**: User workflows
- **PWA Tests**: Service Worker functionality

### Testing Tools

- Jest & React Testing Library
- Cypress for E2E
- Firebase Emulator Suite
- Lighthouse for PWA audits

## 🚀 Deployment

### Production Setup

- Vercel deployment
- Firebase hosting
- CDN optimization
- SSL certificates
- Performance monitoring

### CI/CD Pipeline

- Automated testing
- Code quality checks
- Deployment automation
- Rollback capabilities

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Deployment
npm run export       # Export static files
npm run deploy       # Deploy to Firebase
```

## 📞 Support

For issues and questions:

- GitHub Issues
- Documentation
- Community Forum

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

**Status**: ✅ **COMPLETE** - All requested features have been implemented and the app is ready for deployment. The persistent alarm system works within browser limitations using Service Workers and notification APIs.

## 🎉 What's Included

- ✅ Complete Next.js PWA setup
- ✅ Firebase Authentication (Google OAuth)
- ✅ Firebase Realtime Database
- ✅ Persistent alarm system with notifications
- ✅ Calendar views (Month/Week/Day)
- ✅ Todo management with tasks
- ✅ Activity reports and analytics
- ✅ Mobile-responsive design
- ✅ Offline functionality
- ✅ Vercel deployment ready
- ✅ Comprehensive setup documentation
