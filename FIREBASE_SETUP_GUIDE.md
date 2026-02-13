# 🔥 Firebase Setup Guide — StudyVerse

Follow these steps to connect your StudyVerse app to Firebase. It takes about **5 minutes**!

---

## Step 1: Create a Firebase Project

1. Go to **[Firebase Console](https://console.firebase.google.com/)**
2. Click **"Add project"** (or "Create a project")
3. Enter a project name (e.g. `studyverse`)
4. You can disable Google Analytics (it's optional), then click **Create Project**
5. Wait for it to finish, then click **Continue**

---

## Step 2: Register a Web App

1. On your project dashboard, click the **Web icon** (`</>`) to add a web app
2. Give it a nickname (e.g. `StudyVerse Web`)
3. You do NOT need Firebase Hosting — leave it unchecked
4. Click **Register app**
5. You'll see a code block with your **Firebase config** — it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "studyverse-xxxxx.firebaseapp.com",
  projectId: "studyverse-xxxxx",
  storageBucket: "studyverse-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

6. **Copy these values** — you'll need them in Step 5

---

## Step 3: Enable Google Authentication

1. In the Firebase Console sidebar, click **Build → Authentication**
2. Click the **"Get started"** button
3. Under **Sign-in method**, click **Google**
4. Toggle to **Enable**
5. Select your **support email** from the dropdown
6. Click **Save**

✅ Google Authentication is now enabled!

---

## Step 4: Create the Firestore Database

1. In the sidebar, click **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** for now (we'll secure it next)
4. Select your preferred location (any is fine)
5. Click **Enable**

### Set Security Rules

After the database is created:

1. Click the **Rules** tab in Firestore
2. Replace the default rules with this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Each user can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Block all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

🔒 Now each user can ONLY see their own data!

---

## Step 5: Paste Your Config into the App

1. Open `app.js` in any text editor (Notepad, VS Code, etc.)
2. At the very top, find this section:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. Replace each value with the ones you copied from Step 2
4. **Save the file**

---

## Step 6: Run the App!

### Option A: Direct Open (Simplest)
- Just **double-click** `index.html` to open in your browser
- ⚠️ Google Sign-In may not work from `file://` — if it doesn't, use Option B

### Option B: Local Server (Recommended)
1. Open a terminal/command prompt in the project folder
2. Run one of these:

```bash
# If you have Node.js installed:
npx serve .

# Or with Python:
python -m http.server 8000
```

3. Open `http://localhost:3000` (or `http://localhost:8000`) in your browser

### Option C: Firebase Hosting (Free)
To put it online:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select your project, set public directory to "." , choose "No" for SPA
firebase deploy
```

---

## Step 7: Add Your Domain to Authorized Domains

If sign-in fails, add your domain to the allowed list:

1. Go to **Firebase Console → Authentication → Settings**
2. Click **Authorized domains**
3. Add `localhost` (it should be there already)
4. If hosting somewhere else, add that domain too

---

## 🎉 You're Done!

Your StudyVerse app is now connected to Firebase. Open it and sign in with Google!

**Your data is secure** — each user can only see their own entries thanks to the Firestore rules.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Firebase is not defined" | Make sure you have an internet connection (Firebase SDK loads from CDN) |
| Google Sign-In popup closes immediately | Use a local server (Option B) instead of `file://` |
| "Permission denied" errors | Double-check your Firestore rules (Step 4) |
| Images not saving | Make sure images are under 2MB each |
| Blank page after login | Open browser console (F12) and check for errors |
