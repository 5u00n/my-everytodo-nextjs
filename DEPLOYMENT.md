# EveryTodo Deployment Guide

## 🚀 Quick Deployment to Vercel

### Prerequisites

- Firebase project configured
- Environment variables ready
- Vercel account

### Step 1: Configure Environment Variables

1. Copy your Firebase configuration to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID

# Deploy to production
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Add environment variables in project settings
5. Deploy

### Step 3: Configure Firebase Security Rules

1. Go to Firebase Console → Realtime Database → Rules
2. Replace with:

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
    }
  }
}
```

### Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Test Google authentication
3. Create a test todo with alarm
4. Verify notifications work
5. Test calendar views
6. Check reports functionality

## 🔧 Troubleshooting

### Common Issues

1. **Firebase Authentication not working**

   - Check environment variables are set correctly
   - Verify Google provider is enabled in Firebase
   - Check authorized domains include your Vercel domain

2. **Database permission denied**

   - Verify security rules are correct
   - Check if user is authenticated

3. **Notifications not working**

   - Ensure HTTPS (Vercel provides this automatically)
   - Check browser notification permissions
   - Verify service worker is registered

4. **Build errors**
   - Check all environment variables are set
   - Verify Firebase configuration is correct

### Environment Variables Checklist

- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Configuration Checklist

- [ ] Google Authentication enabled
- [ ] Realtime Database created
- [ ] Security rules configured
- [ ] Web app added to project
- [ ] Authorized domains updated

## 📱 PWA Installation

### For Users

1. Visit your deployed app
2. Look for "Install" button in browser
3. Or use browser menu → "Install EveryTodo"
4. App will be added to home screen

### For Testing

1. Use Chrome DevTools → Application → Manifest
2. Check PWA audit in Lighthouse
3. Test offline functionality
4. Verify service worker registration

## 🎯 Production Checklist

- [ ] Firebase project configured
- [ ] Environment variables set in Vercel
- [ ] Security rules configured
- [ ] PWA manifest updated
- [ ] Icons generated and uploaded
- [ ] Notifications tested
- [ ] Authentication tested
- [ ] Database operations tested
- [ ] Mobile responsiveness tested
- [ ] Offline functionality tested

## 🔄 Updates and Maintenance

### Updating the App

1. Make changes to your code
2. Push to Git repository
3. Vercel will automatically redeploy
4. Test the new deployment

### Monitoring

- Check Vercel function logs
- Monitor Firebase usage
- Check browser console for errors
- Use Firebase Analytics (optional)

## 📊 Performance Optimization

### Vercel Optimizations

- Static generation for better performance
- CDN distribution worldwide
- Automatic HTTPS
- Image optimization

### Firebase Optimizations

- Efficient database queries
- Proper indexing
- Security rules optimization
- Connection pooling

## 🆘 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Firebase console for errors
3. Test locally with `npm run dev`
4. Verify environment variables
5. Check browser console for client-side errors

## 🎉 Success!

Once deployed, your EveryTodo app will be available at your Vercel URL with:

- ✅ Google OAuth authentication
- ✅ Persistent alarm system
- ✅ Calendar views
- ✅ Todo management
- ✅ Activity reports
- ✅ PWA capabilities
- ✅ Offline functionality
