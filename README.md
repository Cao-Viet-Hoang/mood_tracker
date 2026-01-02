# Mood Tracker

A personal mood tracking web application with Firebase backend.

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Once created, click on "Web" icon to add a web app
4. Copy the Firebase configuration object

### 2. Setup Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll update rules later)
4. Select your preferred region

### 3. Create User Account

Since we're using custom authentication, you need to manually create user accounts in Firestore:

1. In Firestore, create a collection called `accounts`
2. Add a document with the document ID as the username (e.g., `john`)
3. Add a field `password` with the user's password (string)

Example document structure:
```
accounts/
  john/
    password: "your_password_here"
```

### 4. Setup Security Rules

1. In Firebase Console, go to "Firestore Database" > "Rules"
2. Copy the contents from `firestore.rules` file
3. Click "Publish"

### 5. Get Firebase Config

Your Firebase config should look like this:
```json
{
  "apiKey": "your-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "your-app-id"
}
```

### 6. Using the App

1. Open `index.html` in a web browser
2. Enter your username and password
3. Paste your Firebase config JSON (only required on first login)
4. Click "Sign In"

The Firebase config will be saved locally for future logins.

## Data Structure

### Accounts Collection
```
accounts/{username}
  - password: string
```

### Entries Subcollection
```
accounts/{username}/entries/{dateKey}
  - dateKey: string (YYYY-MM-DD)
  - moodType: number (1-5)
  - note: string (optional)
  - createdAt: timestamp
  - updatedAt: timestamp
```

## Mood Types

1. 😢 Very Bad
2. 😔 Bad
3. 😐 Okay
4. 😊 Good
5. 😄 Great

## Features

- **Today View**: Log your daily mood with optional notes
- **Calendar View**: View mood history by month
- **Insights Dashboard**: Analytics and trends
- **Mobile-first**: Responsive design for all devices
- **Offline Support**: Firebase config saved locally

## File Structure

```
mood_tracker/
├── index.html              # Main HTML file
├── firestore.rules         # Firebase security rules
├── README.md               # This file
├── css/
│   ├── variables.css       # CSS variables
│   ├── base.css           # Base styles
│   ├── components.css     # UI components
│   ├── login.css          # Login modal
│   ├── today.css          # Today view
│   ├── calendar.css       # Calendar view
│   ├── dashboard.css      # Dashboard view
│   ├── navigation.css     # Navigation
│   └── states.css         # Loading/error states
└── js/
    ├── storage.js         # LocalStorage utilities
    ├── firebase-config.js # Firebase initialization
    ├── auth.js            # Authentication logic
    └── app.js             # Main application
```
