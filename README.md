# Mood Tracker

A personal mood tracking web application with Firebase backend.

## 🚀 Quick Start Guide for New Users

### Prerequisites

- A Google account (for Firebase)
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Basic understanding of copy-pasting text

---

## 📋 Setup Instructions

### Step 1: Create Firebase Project

#### 1.1 Go to Firebase Console

- Visit [Firebase Console](https://console.firebase.google.com/)
- Sign in with your Google account

#### 1.2 Create a New Project

1. Click **"Add project"** or **"Create a project"**
2. Enter a project name (e.g., "My Mood Tracker")
3. (Optional) Disable Google Analytics if you don't need it
4. Click **"Create project"** and wait for it to finish
5. Click **"Continue"** when ready

#### 1.3 Register Your Web App

1. On the project overview page, click the **Web icon** `</>` (labeled "Add app")
2. Enter an app nickname (e.g., "Mood Tracker Web")
3. **Do NOT check** "Set up Firebase Hosting" (not needed)
4. Click **"Register app"**
5. You'll see your Firebase configuration - **keep this page open**, we'll need it later
6. Click **"Continue to console"**

---

### Step 2: Setup Firestore Database

#### 2.1 Create Firestore Database

1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development - we'll secure it later)
4. Click **"Next"**
5. Choose your Cloud Firestore location (pick the region closest to you)
   - Example: `us-central`, `europe-west`, `asia-southeast`
6. Click **"Enable"** and wait for the database to be created

#### 2.2 Important: Understand Test Mode

⚠️ **Test mode** allows anyone to read/write for 30 days. After setup, update security rules (see Step 4).

---

### Step 3: Create Your User Account

Since this app uses a simple custom authentication system, you need to manually create your account in Firestore:

#### 3.1 Create the Accounts Collection

1. In **Firestore Database**, click **"Start collection"**
2. Collection ID: Enter `accounts`
3. Click **"Next"**

#### 3.2 Create Your First User Document

1. **Document ID**: Enter your desired username (e.g., `john` or `mary`)
   - Use only lowercase letters and numbers (no spaces)
   - This will be your login username
2. Click **"Add field"**:
   - Field name: `password`
   - Field type: `string`
   - Field value: Enter your desired password
3. Click **"Save"**

📝 **Example:**

```
Collection: accounts
Document ID: john
  └─ password: "mySecurePassword123"
```

> 💡 **Tip**: You can create multiple user accounts by adding more documents to the `accounts` collection.

---

### Step 4: Setup Security Rules

#### 4.1 Update Firestore Rules

1. In **Firestore Database**, click on the **"Rules"** tab
2. Replace the existing rules with the contents from `firestore.rules` file in this project
3. Click **"Publish"**

**The rules should look like this:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /accounts/{username} {
      allow read, write: if false;

      match /entries/{entryId} {
        allow read, write: if request.auth == null || request.auth.uid == username;
      }
    }
  }
}
```

---

### Step 5: Get Your Firebase Configuration

#### 5.1 Find Your Firebase Config

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. You should see your web app listed
5. Look for **"SDK setup and configuration"**
6. Select **"Config"** radio button (not npm)
7. Copy the entire `firebaseConfig` object

**It should look like this:**

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
};
```

#### 5.2 Format as JSON

Convert the config to JSON format (remove `const firebaseConfig =` and the semicolon):

```json
{
  "apiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "123456789012",
  "appId": "1:123456789012:web:abcdef123456"
}
```

---

### Step 6: Using the App

#### 6.1 First Time Login

1. Open `index.html` in your web browser
   - You can simply double-click the file, or
   - Use a local web server (recommended)
2. You'll see a login modal
3. **Username**: Enter the username you created (e.g., `john`)
4. **Password**: Enter the password you set
5. **Firebase Config**: Paste your Firebase config JSON from Step 5.2
6. Click **"Sign In"**

#### 6.2 Subsequent Logins

After the first login, the Firebase config is saved in your browser's localStorage:

1. Open the app
2. Enter username and password
3. Click **"Sign In"** (no need to paste config again!)

#### 6.3 Using a Local Web Server (Recommended)

For better compatibility, use a local web server:

**Option A: Python**

```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

**Option B: Node.js**

```bash
# Install http-server globally
npm install -g http-server

# Run in project folder
http-server -p 8000

# Then open: http://localhost:8000
```

**Option C: VS Code Live Server Extension**

1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

---

## 🎯 Using the Mood Tracker

### Log Your Daily Mood

1. Click on a mood emoji (😢 😔 😐 😊 😄)
2. (Optional) Add a note about your day
3. Your mood is automatically saved!

### View Calendar

- Click **"Calendar"** to see your mood history
- Click any date with a mood to view/edit
- Different colored backgrounds show different moods

### View Insights

- Click **"Insights"** to see statistics
- View streaks, mood distribution, and trends
- Track your emotional patterns over time

---

## 📊 Data Structure

## 📊 Data Structure

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
```

---

## 😊 Mood Types

| Number | Emoji | Description |
| ------ | ----- | ----------- |
| 1      | 😢    | Very Bad    |
| 2      | 😔    | Bad         |
| 3      | 😐    | Okay        |
| 4      | 😊    | Good        |
| 5      | 😄    | Great       |

---

## ✨ Features

- **Today View**: Log your daily mood with optional notes
- **Calendar View**: View mood history by month with color-coded days
- **Insights Dashboard**: Analytics, streaks, and trends
- **Streak Tracking**: See your longest and current logging streaks
- **Mobile-first Design**: Fully responsive on all devices
- **Offline Support**: Firebase config saved locally in browser
- **Simple Authentication**: No email verification needed

---

## 🔒 Security & Privacy

### Important Security Notes

1. **Test Mode Expiration**: Firebase test mode expires after 30 days. Update your security rules using the `firestore.rules` file.

2. **Password Storage**: Currently, passwords are stored in plain text in Firestore. For production use, consider implementing proper authentication.

3. **Local Storage**: Firebase config is stored in browser's localStorage. Clear browser data if you want to reset the config.

### Recommended Security Practices

- Use strong, unique passwords
- Don't share your Firebase config publicly
- Update Firestore rules after initial setup
- Regularly backup your data
- Consider Firebase Authentication for production

---

## 🐛 Troubleshooting

### "Permission Denied" Error

- Check that your Firestore rules are correctly published
- Verify your username exists in the `accounts` collection
- Make sure you're using the correct username and password

### "Failed to Load Firebase Config"

- Ensure your Firebase config JSON is properly formatted
- Check that all required fields are present
- Try clearing browser cache and localStorage

### App Not Loading

- Make sure you're using a modern browser
- Check browser console for errors (F12)
- Try using a local web server instead of opening file directly
- Verify your Firebase project is active

### Can't See My Moods

- Ensure you're logged in with the correct username
- Check Firestore Database to verify entries exist
- Verify Firestore rules allow reading your data

---

## 🤝 Contributing

Feel free to fork this project and customize it to your needs!

### Ideas for Enhancement

- Add mood categories/tags
- Export data to CSV/JSON
- Add mood prediction based on patterns
- Implement Firebase Authentication
- Add social features (optional sharing)
- Dark mode toggle
- More detailed analytics

---

## 📝 License

This project is open source and available for personal use.

---

## 📁 File Structure

```
mood_tracker/
├── index.html              # Main HTML file
├── firestore.rules         # Firebase security rules (IMPORTANT!)
├── firestore.rules.dev     # Development rules
├── README.md               # This documentation
├── css/
│   ├── variables.css       # CSS custom properties
│   ├── base.css           # Base styles & resets
│   ├── components.css     # Reusable UI components
│   ├── login.css          # Login modal styles
│   ├── today.css          # Today view styles
│   ├── calendar.css       # Calendar view styles
│   ├── dashboard.css      # Dashboard/insights styles
│   ├── navigation.css     # Navigation bar styles
│   └── states.css         # Loading/error states
└── js/
    ├── storage.js         # LocalStorage utilities
    ├── firebase-config.js # Firebase initialization
    ├── auth.js            # Authentication logic
    ├── app.js             # Main application logic
    ├── today.js           # Today view functionality
    ├── calendar.js        # Calendar view functionality
    ├── dashboard.js       # Dashboard/insights functionality
    ├── stats.js           # Statistics calculations
    ├── streak-manager.js  # Streak tracking logic
    ├── navigation.js      # Navigation handling
    ├── ui.js              # UI helper functions
    └── utils.js           # Utility functions
```

---

## 📞 Support

If you encounter any issues:

1. Check the Troubleshooting section above
2. Review the Firebase Console for errors
3. Check browser console (F12) for JavaScript errors
4. Verify all setup steps were completed correctly

---

**Happy mood tracking! 😊📊**
