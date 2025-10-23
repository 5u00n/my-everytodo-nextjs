# Quick Start Guide

## 🚀 Get EveryTodo Running in 5 Minutes

### Step 1: Configure Firebase

1. **Create a Firebase Project:**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Name it "everytodo-app" (or your choice)
   - Enable Google Analytics (optional)

2. **Enable Authentication:**

   - Go to "Authentication" → "Sign-in method"
   - Enable "Google" provider
   - Add `localhost` to authorized domains

3. **Create Realtime Database:**

   - Go to "Realtime Database" → "Create Database"
   - Choose "Start in test mode"
   - Select a location (closest to you)

4. **Get Configuration:**
   - Go to Project Settings → General
   - Scroll to "Your apps" → Add app → Web
   - Copy the Firebase configuration

### Step 2: Set Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 3: Start the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Step 4: Test Features

1. **Authentication:** Click "Continue with Google"
2. **Create Todo:** Click "Add Todo" button
3. **Set Alarm:** Enable alarm and set time
4. **Calendar:** Switch to Calendar view
5. **Reports:** Check Reports for analytics

## 🔧 Troubleshooting

### "Firebase not initialized" Error

- Check your `.env.local` file has correct values
- Make sure Firebase project is created
- Verify Google Authentication is enabled

### Icons Not Loading

- Icons are automatically generated
- If issues persist, check browser console

### Notifications Not Working

- Allow notifications when prompted
- Ensure you're using HTTPS in production
- Check browser notification settings

## 📱 PWA Features

- **Install:** Look for "Install" button in browser
- **Offline:** App works without internet
- **Notifications:** Persistent alarms with snooze
- **Mobile:** Optimized for mobile devices

## 🚀 Deploy to Production

1. **Push to GitHub:**

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

## 🎯 What You Get

- ✅ **Persistent Alarms** - Don't stop until tasks are done
- ✅ **Google Authentication** - Secure login
- ✅ **Calendar Views** - Month, week, day views
- ✅ **Todo Management** - Full CRUD with tasks
- ✅ **Activity Reports** - Analytics and insights
- ✅ **PWA Support** - Installable and offline
- ✅ **Mobile Responsive** - Works on all devices

## 📚 Next Steps

- Customize the design
- Add more notification sounds
- Implement additional features
- Set up analytics
- Configure custom domains

**Happy Todo-ing!** 🎉
