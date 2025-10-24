# EveryTodo Mobile API Documentation

## Overview

The EveryTodo Mobile API provides comprehensive endpoints for mobile app integration, enabling native mobile applications to interact with the EveryTodo web application's features including todos, alarms, notifications, and analytics.

## Base URL

```
https://your-domain.com/api/mobile
```

## Authentication

All API endpoints require Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": { ... },
  "error": "Error message (if success is false)",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Codes

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Authentication Endpoints

### POST /auth/login

Authenticate user with Firebase ID token and create/retrieve user profile.

**Request Body:**

```json
{
  "idToken": "firebase-id-token"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "displayName": "User Name",
      "photoURL": "https://...",
      "createdAt": 1640995200000
    },
    "token": "firebase-id-token"
  }
}
```

### GET /auth/profile

Get current user profile information.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "User Name",
    "photoURL": "https://...",
    "preferences": {
      "theme": "system",
      "notifications": {
        "enabled": true,
        "sound": true,
        "vibrate": true
      },
      "alarms": {
        "defaultSnoozeMinutes": 5,
        "defaultDuration": 5,
        "defaultRepeatCount": 3
      }
    },
    "createdAt": 1640995200000,
    "updatedAt": 1640995200000
  }
}
```

### PUT /auth/profile

Update user profile information.

**Request Body:**

```json
{
  "displayName": "New Name",
  "preferences": {
    "theme": "dark",
    "notifications": {
      "enabled": true,
      "sound": false,
      "vibrate": true
    }
  }
}
```

### DELETE /auth/account

Delete user account and all associated data.

---

## Todo Management Endpoints

### GET /todos

Get paginated list of todos with filtering options.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `filter` (optional): Filter type (`all`, `today`, `upcoming`, `completed`, `active`)
- `sortBy` (optional): Sort field (default: `scheduledTime`)
- `sortOrder` (optional): Sort order (`asc`, `desc`)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "todo-id",
      "title": "Todo Title",
      "description": "Todo description",
      "tasks": [
        {
          "id": "task-id",
          "text": "Task text",
          "isCompleted": false,
          "createdAt": 1640995200000
        }
      ],
      "scheduledTime": 1640995200000,
      "repeatPattern": {
        "type": "none",
        "days": [],
        "interval": 1
      },
      "alarmSettings": {
        "enabled": true,
        "vibrate": true,
        "sound": true,
        "notification": true,
        "snoozeMinutes": 5,
        "duration": 5,
        "repeatCount": 3
      },
      "isCompleted": false,
      "isActive": true,
      "createdAt": 1640995200000,
      "updatedAt": 1640995200000,
      "completedAt": null,
      "userId": "user-id"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### POST /todos

Create a new todo.

**Request Body:**

```json
{
  "title": "Todo Title",
  "description": "Optional description",
  "scheduledTime": 1640995200000,
  "tasks": [
    {
      "text": "Task 1",
      "isCompleted": false
    }
  ],
  "repeatPattern": {
    "type": "daily",
    "days": [],
    "interval": 1
  },
  "alarmSettings": {
    "enabled": true,
    "vibrate": true,
    "sound": true,
    "notification": true,
    "snoozeMinutes": 5,
    "duration": 5,
    "repeatCount": 3
  },
  "isActive": true
}
```

### GET /todos/{id}

Get a specific todo by ID.

### PUT /todos/{id}

Update a specific todo.

### DELETE /todos/{id}

Delete a specific todo and all associated alarms.

---

## Task Management Endpoints

### POST /todos/{todoId}/tasks

Add a new task to a todo.

**Request Body:**

```json
{
  "text": "New task text",
  "isCompleted": false
}
```

### PUT /todos/{todoId}/tasks/{taskId}

Update a specific task.

**Request Body:**

```json
{
  "text": "Updated task text",
  "isCompleted": true
}
```

### DELETE /todos/{todoId}/tasks/{taskId}

Delete a specific task.

---

## Alarm Management Endpoints

### GET /alarms

Get paginated list of alarms with filtering options.

**Query Parameters:**

- `page`, `limit`, `sortBy`, `sortOrder`: Same as todos
- `filter`: Filter type (`all`, `active`, `triggered`, `upcoming`, `past`)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "alarm-id",
      "todoId": "todo-id",
      "title": "Alarm Title",
      "body": "Alarm description",
      "scheduledTime": 1640995200000,
      "isActive": true,
      "createdAt": 1640995200000
    }
  ],
  "pagination": { ... }
}
```

### POST /alarms

Create a new alarm.

**Request Body:**

```json
{
  "todoId": "todo-id",
  "title": "Alarm Title",
  "body": "Optional alarm description",
  "scheduledTime": 1640995200000
}
```

### GET /alarms/{id}

Get a specific alarm by ID.

### PUT /alarms/{id}

Update a specific alarm.

### DELETE /alarms/{id}

Delete a specific alarm.

### POST /alarms/{id}/snooze

Snooze an alarm for specified minutes.

**Request Body:**

```json
{
  "minutes": 5
}
```

### POST /alarms/{id}/dismiss

Dismiss an alarm (mark as inactive).

---

## Push Notification Endpoints

### POST /notifications/subscribe

Subscribe to push notifications.

**Request Body:**

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "key-value",
    "auth": "auth-value"
  }
}
```

### DELETE /notifications/unsubscribe

Unsubscribe from push notifications.

### GET /notifications/subscription

Get current push subscription status.

### POST /notifications/test

Send a test push notification.

**Request Body:**

```json
{
  "title": "Test Notification",
  "body": "This is a test",
  "icon": "/icon-192.svg",
  "data": {
    "custom": "data"
  }
}
```

---

## Reports and Analytics Endpoints

### GET /reports

Get various types of reports and analytics.

**Query Parameters:**

- `type`: Report type (`productivity`, `completion`, `alarms`, `tasks`)
- `startDate`: Start date timestamp
- `endDate`: End date timestamp

#### Productivity Report

**Response:**

```json
{
  "success": true,
  "data": {
    "totalTodos": 100,
    "completedTodos": 75,
    "completionRate": 75.0,
    "averageCompletionTime": 3600000,
    "mostProductiveHour": 14,
    "mostProductiveDay": "Tuesday",
    "tasksCompleted": 300,
    "totalTasks": 400,
    "taskCompletionRate": 75.0
  }
}
```

#### Completion Report

**Response:**

```json
{
  "success": true,
  "data": {
    "dailyCompletions": [
      {
        "date": "2024-01-01",
        "completed": 5,
        "total": 8
      }
    ],
    "weeklyCompletions": [
      {
        "week": "2024-01-01",
        "completed": 25,
        "total": 35
      }
    ],
    "monthlyCompletions": [
      {
        "month": "2024-01",
        "completed": 100,
        "total": 150
      }
    ]
  }
}
```

#### Alarm Report

**Response:**

```json
{
  "success": true,
  "data": {
    "totalAlarms": 50,
    "triggeredAlarms": 40,
    "snoozedAlarms": 10,
    "dismissedAlarms": 30,
    "averageSnoozeCount": 2.5,
    "mostFrequentAlarmTime": 8
  }
}
```

#### Task Report

**Response:**

```json
{
  "success": true,
  "data": {
    "totalTasks": 400,
    "completedTasks": 300,
    "averageTasksPerTodo": 4.0,
    "mostCommonTaskTypes": [
      {
        "text": "call client",
        "count": 15
      }
    ]
  }
}
```

---

## Calendar Endpoints

### GET /calendar

Get calendar events (todos and alarms) for a date range.

**Query Parameters:**

- `startDate`: Start date timestamp
- `endDate`: End date timestamp
- `view`: View type (`month`, `week`, `day`)

**Response:**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event-id",
        "title": "Event Title",
        "start": 1640995200000,
        "end": 1640998800000,
        "type": "todo",
        "todoId": "todo-id",
        "isCompleted": false,
        "isActive": true
      }
    ],
    "view": "month",
    "startDate": 1640995200000,
    "endDate": 1641081600000
  }
}
```

---

## Sync Endpoints

### POST /sync

Synchronize offline changes with server and get server updates.

**Request Body:**

```json
{
  "lastSyncTime": 1640995200000,
  "changes": [
    {
      "type": "create",
      "entity": "todo",
      "id": "todo-id",
      "data": { ... },
      "timestamp": 1640995200000
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "serverTime": 1640995200000,
    "changes": [
      {
        "type": "update",
        "entity": "todo",
        "id": "server-todo-id",
        "data": { ... },
        "timestamp": 1640995200000
      }
    ],
    "conflicts": [
      {
        "entity": "todo",
        "id": "conflict-id",
        "localData": { ... },
        "serverData": { ... }
      }
    ]
  }
}
```

---

## Utility Endpoints

### GET /health

Health check endpoint.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": 1640995200000,
    "version": "1.0.0",
    "services": {
      "database": "connected",
      "notifications": "available",
      "authentication": "active"
    }
  }
}
```

---

## Rate Limiting

- **Authentication endpoints**: 10 requests per minute
- **CRUD operations**: 100 requests per minute
- **Reports**: 20 requests per minute
- **Notifications**: 50 requests per minute

## Best Practices

1. **Authentication**: Always include the Firebase ID token in the Authorization header
2. **Error Handling**: Check the `success` field and handle errors appropriately
3. **Pagination**: Use pagination parameters for large datasets
4. **Offline Support**: Use the sync endpoint to handle offline scenarios
5. **Push Notifications**: Subscribe to notifications for real-time updates
6. **Caching**: Cache frequently accessed data locally
7. **Rate Limiting**: Respect rate limits and implement exponential backoff

## SDK Examples

### React Native Example

```javascript
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCredential, GoogleAuthProvider } from "firebase/auth";

const API_BASE_URL = "https://your-domain.com/api/mobile";

class EveryTodoAPI {
  constructor() {
    this.auth = getAuth();
  }

  async authenticate(googleCredential) {
    const userCredential = await signInWithCredential(this.auth, googleCredential);
    const idToken = await userCredential.user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    return response.json();
  }

  async getTodos(page = 1, filter = "all") {
    const idToken = await this.auth.currentUser.getIdToken();

    const response = await fetch(`${API_BASE_URL}/todos?page=${page}&filter=${filter}`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    return response.json();
  }

  async createTodo(todoData) {
    const idToken = await this.auth.currentUser.getIdToken();

    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(todoData),
    });

    return response.json();
  }
}
```

### Flutter Example

```dart
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

class EveryTodoAPI {
  static const String baseUrl = 'https://your-domain.com/api/mobile';

  Future<Map<String, dynamic>> authenticate() async {
    final user = FirebaseAuth.instance.currentUser;
    final idToken = await user?.getIdToken();

    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'idToken': idToken}),
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> getTodos({int page = 1, String filter = 'all'}) async {
    final user = FirebaseAuth.instance.currentUser;
    final idToken = await user?.getIdToken();

    final response = await http.get(
      Uri.parse('$baseUrl/todos?page=$page&filter=$filter'),
      headers: {'Authorization': 'Bearer $idToken'},
    );

    return jsonDecode(response.body);
  }
}
```

This comprehensive API provides everything needed for mobile app integration with the EveryTodo web application, including authentication, CRUD operations, real-time notifications, analytics, and offline synchronization support.
