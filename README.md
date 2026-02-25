# FlowState

**FlowState** is a real-time collaborative architecture diagramming tool powered by AI. Draw system architectures, flowcharts, and brainstorm ideas with your team — all in sync, in real-time.

Built with [Excalidraw](https://excalidraw.com/), Firebase, and Gemini AI.

---

## ✨ Features

- 🎨 **Infinite canvas** via Excalidraw — draw anything
- 🤝 **Real-time collaboration** — see live cursors, colored selections, and presence avatars for every collaborator
- 🔒 **Permission-based sharing** — generate signed Editor links or Viewer-only links per workspace
- 🤖 **AI assistant** — voice-powered Gemini AI that draws nodes on command
- 📚 **Component library** — reusable architecture node library synced per user
- ☁️ **Auto-save** — all changes are continuously synced to Firestore

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Vishal-V-D/FlowState.git
cd FlowState
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Copy the example env file and fill in your Firebase project credentials:

```bash
cp .env.example .env.local
```

Then open `.env.local` and add your values (see the [Firebase setup](#firebase-setup) section below).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔥 Firebase Setup

This project uses:
- **Firebase Auth** — for user sign-in (Email/Password)
- **Firestore** — for workspace data, user library items, and share tokens
- **Realtime Database (RTDB)** — for live cursor/presence data

### Steps

1. Go to [Firebase Console](https://console.firebase.google.com/) and **create a new project**
2. Enable **Authentication** → Email/Password
3. Enable **Firestore Database** (start in production mode, then update rules)
4. Enable **Realtime Database** and set a region
5. Go to **Project Settings → Your apps → Web app** and register a web app
6. Copy the config values into your `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com/
```

### Recommended Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /workspaces/{workspaceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Recommended Realtime Database Rules

```json
{
  "rules": {
    "rooms": {
      "$workspaceId": {
        "collaborators": {
          "$uid": {
            ".read": "auth != null",
            ".write": "auth != null && auth.uid == $uid"
          }
        }
      }
    }
  }
}
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Canvas | Excalidraw |
| Styling | Tailwind CSS |
| Auth & DB | Firebase Auth + Firestore |
| Realtime | Firebase Realtime Database |
| AI | Gemini Live API (via `useAISession`) |
| Icons | Lucide React |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── workspace/[id]/      # Workspace canvas page + ExcalidrawWrapper
│   ├── library/             # Library page (list of workspaces)
│   ├── signin/ signup/      # Auth pages
│   └── page.tsx             # Landing page
├── components/
│   ├── workspace/           # InviteModal, NewWorkspaceModal
│   └── landing/             # Landing page sections
├── hooks/
│   ├── useAuth.ts           # Firebase auth hook
│   └── useAISession.ts      # Gemini AI voice session hook
└── lib/
    └── firebase.ts          # Firebase initialization (reads from env)
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firestore project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID (optional) |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Realtime Database URL |

> ⚠️ Never commit `.env.local` to version control. It is already listed in `.gitignore`.

---

## 📄 License

MIT
