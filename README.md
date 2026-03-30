# 🎬 BookYourBrand Studio

> **A full-stack SaaS platform for managing video production workflows** — built for agencies, editors, and their clients. Real-time collaboration, smart file management, and a seamless client experience, all in one place.



## ✨ What is BookYourBrand Studio?

BookYourBrand Studio is a production management platform where **clients, editors, and admins** each have a dedicated workspace. Clients submit projects and track progress. Editors manage deliverables. Admins control everything — all in real time.

No more chasing emails. No more lost files. Just clean, professional workflow.

---

##  Role-Based Portals

###  Client Portal
Everything the client needs — nothing they don't.

| Feature | Description |
|---|---|
| **Project Creation** | Clients create new projects with briefs, references, and deadlines |
| **Progress Tracking** | Live project status — from brief received to final delivery |
| **File Access** | View and download deliverables directly from the portal |
| **Payments** | Integrated payment flow — clients pay directly within the platform |
| **Support Chat** | Real-time support chat with the team, with file attachment support |
| **Notifications** | Email alerts via Gmail OAuth2 for project updates and messages |

---

###  Editor Portal
Built for the people doing the actual work.

| Feature | Description |
|---|---|
| **Project Dashboard** | See all assigned projects with status, deadlines, and client briefs |
| **File Manager** | Upload, manage, and stream large video files via Synology NAS |
| **Project Chat** | Per-project chat thread — communicate with clients and admins |
| **Deliverable Upload** | Push final files directly to the client's portal |
| **Real-time Updates** | Firestore listeners — changes appear instantly without refresh |

---

###  Admin Panel
Full control over the entire platform.

| Feature | Description |
|---|---|
| **User Management** | Create and manage client and editor accounts |
| **Project Oversight** | View all projects across all clients and editors |
| **Assignment** | Assign projects to specific editors |
| **Support Chat Management** | Monitor and respond to all support conversations |
| **Global Chat View** | Access all project threads and communications |
| **Email Configuration** | CLI-based Gmail OAuth2 setup for automated notifications |
| **Platform Settings** | Firebase Remote Config for dynamic feature toggling |

---

##  Architecture Overview

```
BookYourBrand Studio
│
├── Client Layer (Next.js + TypeScript)
│   ├── /app/(app)/client      → Client portal pages
│   ├── /app/(app)/editor      → Editor workspace
│   ├── /app/(app)/admin       → Admin dashboard
│   └── /app/(app)/support     → Support chat (all roles)
│
├── Backend (Firebase)
│   ├── Firestore              → Real-time database (projects, chats, users)
│   ├── Cloud Functions        → Server-side logic & triggers
│   ├── Firebase Storage       → File storage
│   ├── Firebase Auth          → Role-based authentication
│   └── App Hosting            → Production deployment
│
└── Infrastructure
    ├── Synology NAS           → Direct large file streaming (no buffering)
    └── Gmail OAuth2           → Automated client email notifications
```

---

## 📁 Key Files

```
src/                    → All frontend source code (Next.js app router)
functions/              → Firebase Cloud Functions
dataconnect/            → Firebase Data Connect config
firestore.rules         → Security rules (role-based access)
storage.rules           → File access permissions
scripts/                → CLI tools (email config, NAS testing)
apphosting.yaml         → Firebase App Hosting config
```

---

## ⚡ Highlights

- 🔴 **Real-time everything** — Firestore listeners power live chat, project updates, and status changes without page refresh
- 📦 **NAS-powered file streaming** — Large video files stream directly from Synology NAS with no buffering delay
- 🔐 **Strict role-based access** — Firestore security rules enforce that clients only see their own projects, editors see assigned work, admins see all
- 📧 **Automated email flow** — Gmail OAuth2 integration sends notifications automatically on project events
- 🧱 **Production-grade TypeScript** — Fully typed codebase with strict tsconfig, Cloud Functions, and shared type definitions

---

## 🛠️ Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/Hemang1122/studio-app.git
cd studio-app

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your Firebase config values

# 4. Run the development server
npm run dev
```

> Requires Node.js 18+, a Firebase project, and a configured Synology NAS for file features.

---

## 📸 Screenshots<img width="1920" height="1080<img width="1920" height="1080" alt="Screenshot (1552)" src="https://github.com/user-attachments/assets/5710191c-2482-4f78-af5e-00f76ae0d14a" />





---

## 👨‍💻 Built By

**Hemang Tripathi** — CS Student @ SRH Munich  
[LinkedIn](https://www.linkedin.com/in/hemang-tripathi-b2979339a/) · [GitHub](https://github.com/Hemang1122)

---

> *BookYourBrand Studio is a real production tool used by an active agency. Built solo over 5 months with 300+ commits.*
