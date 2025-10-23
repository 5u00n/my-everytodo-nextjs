# Quick Setup Guide

## 1. Firebase Setup (5 minutes)

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name: `everytodo-app`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Enable Google Authentication

1. Go to "Authentication" → "Get started"
2. Click "Sign-in method" tab
3. Enable "Google" provider
4. Add your domain to authorized domains

### Create Database

1. Go to "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode"
4. Select location (closest to you)
5. Click "Done"

### Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web app" icon
4. Register app: "EveryTodo Web"
5. Copy the config object

## 2. Environment Setup (2 minutes)

```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local with your Firebase config
nano .env.local
```

Add your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 3. Run the App (1 minute)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 4. Test Authentication

1. Click "Continue with Google"
2. Sign in with your Google account
3. You should see the dashboard

## 5. Deploy to Vercel (3 minutes)

1. Push to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard
5. Deploy!

## ✅ You're Done!

Your EveryTodo app is now running with:

- ✅ Google Authentication
- ✅ Firebase Realtime Database
- ✅ Modern Next.js 16 setup
- ✅ Ready for deployment

## 🔧 Next Steps

- Add your first todo with alarm
- Test the calendar view
- Generate activity reports
- Customize the UI to your liking

## 🆘 Need Help?

- Check the main README.md for detailed instructions
- Review Firebase Console setup
- Check browser console for errors
- Verify environment variables are correct
