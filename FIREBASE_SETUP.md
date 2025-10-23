# 🔥 Firebase Setup Guide

## Quick Setup Steps

### 1. **Go to Firebase Console**

- Visit: https://console.firebase.google.com/
- Select project: `my-every-todo`

### 2. **Enable Authentication**

- Go to **Authentication** → **Sign-in method**
- Click **Google** provider
- Toggle **Enable**
- Set **Project support email** to your email
- Click **Save**

### 3. **Create Realtime Database**

- Go to **Realtime Database** → **Create Database**
- Choose **Start in test mode**
- Select **asia-southeast1** region
- Click **Done**

### 4. **Add Authorized Domains**

- Go to **Authentication** → **Settings** → **Authorized domains**
- Add `localhost` (for development)
- Add your production domain (when deployed)

### 5. **Test Your Setup**

- Refresh your app at http://localhost:3000
- Check the Firebase Status section
- Should show: ✅ Authentication working | ✅ Database working

## Common Issues

### ❌ "auth/configuration-not-found"

- **Solution**: Enable Google Authentication in Firebase Console

### ❌ "Database not found"

- **Solution**: Create Realtime Database in Firebase Console

### ❌ "Permission denied"

- **Solution**: Check database rules in `database.rules.json`

## Your Current Configuration

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD0iY0xzRj2aj4iUuJOMJ1nq_PW9JQUuUY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-every-todo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://my-every-todo-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-every-todo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-every-todo.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=858688109235
NEXT_PUBLIC_FIREBASE_APP_ID=1:858688109235:web:4e4c4f73465e0a57d9cec6
```

## Next Steps

1. Complete Firebase Console setup
2. Test authentication
3. Deploy to Vercel
4. Enjoy your PWA! 🚀
