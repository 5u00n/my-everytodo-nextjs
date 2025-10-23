# EveryTodo Setup Guide

This guide will help you set up EveryTodo with Firebase and deploy it to Vercel.

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Vercel CLI installed (`npm install -g vercel`)
- A Google account for Firebase

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `everytodo-app` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication

1. In Firebase Console, go to "Authentication" → "Sign-in method"
2. Enable "Google" provider
3. Add your domain to authorized domains
4. Copy the Web SDK configuration

### 1.3 Enable Realtime Database

1. Go to "Realtime Database" → "Create Database"
2. Choose "Start in test mode" (we'll secure it later)
3. Select a location (choose closest to your users)
4. Copy the database URL

### 1.4 Get Firebase Configuration

1. Go to Project Settings → General
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app
4. Register app with nickname "EveryTodo Web"
5. Copy the Firebase configuration object

## Step 2: Configure Environment Variables

1. Copy the example environment file:

   ```bash
   cp env.example .env.local
   ```

2. Update `.env.local` with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Configure Firebase for Local Development

1. Login to Firebase:

   ```bash
   firebase login
   ```

2. Initialize Firebase in your project:

   ```bash
   firebase init
   ```

   Select:

   - ✅ Realtime Database
   - ✅ Hosting

   Choose your existing project and follow the prompts.

## Step 5: Test Locally

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)
3. Test Google authentication
4. Create a test todo with alarm
5. Verify notifications work (allow notifications when prompted)

## Step 6: Deploy to Vercel

### 6.1 Prepare for Deployment

1. Build the project:

   ```bash
   npm run build
   ```

2. Test the build:
   ```bash
   npm start
   ```

### 6.2 Deploy to Vercel

1. Install Vercel CLI (if not already installed):

   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:

   ```bash
   vercel login
   ```

3. Deploy the project:

   ```bash
   vercel
   ```

   Follow the prompts:

   - Set up and deploy? `Y`
   - Which scope? (select your account)
   - Link to existing project? `N`
   - Project name: `everytodo-app` (or your preferred name)
   - Directory: `.` (current directory)
   - Override settings? `N`

4. Add environment variables in Vercel:

   - Go to your project dashboard on Vercel
   - Go to Settings → Environment Variables
   - Add all the Firebase environment variables from your `.env.local`

5. Redeploy with environment variables:
   ```bash
   vercel --prod
   ```

## Step 7: Configure Firebase Security Rules

1. Go to Firebase Console → Realtime Database → Rules
2. Replace the rules with:

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

3. Click "Publish"

## Step 8: Configure PWA Settings

1. Update `public/manifest.json` with your app details
2. Replace the generated icons with proper PNG versions (192x192 and 512x512)
3. Test PWA installation on mobile devices

## Step 9: Enable Notifications (Optional)

1. Go to Firebase Console → Cloud Messaging
2. Generate a server key (for future push notifications)
3. Update the notification service if needed

## Troubleshooting

### Common Issues

1. **Firebase Authentication not working**

   - Check if Google provider is enabled
   - Verify domain is in authorized domains
   - Check environment variables

2. **Database permission denied**

   - Verify security rules are correct
   - Check if user is authenticated

3. **Notifications not working**

   - Ensure HTTPS (required for notifications)
   - Check browser notification permissions
   - Verify service worker is registered

4. **Build errors**
   - Check all environment variables are set
   - Verify all dependencies are installed
   - Check for TypeScript errors

### Development Tips

1. **Testing notifications locally**

   - Use `localhost` (not `127.0.0.1`)
   - Enable notifications in browser
   - Test with different browsers

2. **Firebase emulator (optional)**

   ```bash
   firebase emulators:start
   ```

   - Use emulator for development
   - Update Firebase config to use emulator URLs

3. **Debugging**
   - Check browser console for errors
   - Use Firebase console to monitor database
   - Check Vercel function logs

## Production Checklist

- [ ] Firebase project created and configured
- [ ] Environment variables set in Vercel
- [ ] Security rules configured
- [ ] PWA manifest updated
- [ ] Icons generated and uploaded
- [ ] Notifications tested
- [ ] Authentication tested
- [ ] Database operations tested
- [ ] Mobile responsiveness tested
- [ ] Offline functionality tested

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are correct
3. Test with Firebase emulator
4. Check Vercel deployment logs
5. Review Firebase console for authentication issues

## Next Steps

After successful setup:

1. Customize the app design
2. Add more notification sounds
3. Implement additional features
4. Set up analytics
5. Configure custom domains
6. Add more authentication providers
7. Implement advanced reporting features
