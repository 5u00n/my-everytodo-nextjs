# Mobile API Environment Configuration

## Required Environment Variables

Add these environment variables to your `.env.local` file for mobile API functionality:

```bash
# Firebase Admin SDK (for server-side authentication)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Optional: Rate Limiting
API_RATE_LIMIT_PER_MINUTE=100
API_RATE_LIMIT_BURST=200
```

## Firebase Admin SDK Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Extract the values and add them to your environment variables

## VAPID Keys Setup

1. Install web-push: `npm install web-push`
2. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```
3. Add the keys to your environment variables

## Mobile App Integration

### React Native Setup

```bash
npm install @react-native-firebase/app @react-native-firebase/auth
npm install @react-native-google-signin/google-signin
npm install @react-native-async-storage/async-storage
```

### Flutter Setup

Add to `pubspec.yaml`:

```yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_auth: ^4.15.3
  google_sign_in: ^6.2.1
  http: ^1.1.0
```

### iOS Configuration

1. Add Firebase configuration files to iOS project
2. Configure URL schemes for Google Sign-In
3. Enable Push Notifications capability

### Android Configuration

1. Add Firebase configuration files to Android project
2. Configure Google Sign-In in `google-services.json`
3. Add internet permission to `AndroidManifest.xml`

## API Testing

Use the provided Postman collection or test with curl:

```bash
# Test authentication
curl -X POST https://your-domain.com/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "your-firebase-id-token"}'

# Test todos endpoint
curl -X GET https://your-domain.com/api/mobile/todos \
  -H "Authorization: Bearer your-firebase-id-token"
```

## Deployment Considerations

1. **Environment Variables**: Ensure all required environment variables are set in production
2. **Firebase Rules**: Update Firebase security rules for mobile access
3. **CORS**: Configure CORS for mobile app domains
4. **Rate Limiting**: Implement rate limiting middleware
5. **Monitoring**: Set up API monitoring and logging
6. **Backup**: Regular database backups for user data

## Security Best Practices

1. **Token Validation**: Always validate Firebase ID tokens on the server
2. **User Isolation**: Ensure users can only access their own data
3. **Input Validation**: Validate all input parameters
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **HTTPS Only**: Use HTTPS for all API communications
6. **Error Handling**: Don't expose sensitive information in error messages

## Performance Optimization

1. **Pagination**: Use pagination for large datasets
2. **Caching**: Implement caching for frequently accessed data
3. **Compression**: Enable gzip compression for API responses
4. **CDN**: Use CDN for static assets
5. **Database Indexing**: Optimize database queries with proper indexing

## Monitoring and Analytics

1. **API Metrics**: Track API usage and performance
2. **Error Tracking**: Monitor and alert on API errors
3. **User Analytics**: Track mobile app usage patterns
4. **Performance Monitoring**: Monitor response times and throughput

## Support and Maintenance

1. **API Versioning**: Implement API versioning for future updates
2. **Documentation**: Keep API documentation up to date
3. **Testing**: Maintain comprehensive test coverage
4. **Updates**: Regular security and feature updates
