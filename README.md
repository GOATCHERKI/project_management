# ProjectFlow - Full-Stack Project Management Platform

A modern, production-style project management app built with React, Node.js, Prisma, and Clerk.

ProjectFlow helps teams plan projects, assign work, track status, and collaborate through role-based workspaces.

**[🚀 Live Demo](https://project-management-system-rosy.vercel.app/)**

## ✨ Why this project stands out

- 🏗️ Real-world architecture: separate frontend and backend with API-first design
- 🔐 Secure authentication and authorization with Clerk
- 👥 Role-based access control (workspace admin/member + project team lead permissions)
- 📊 Scalable relational data modeling with Prisma + PostgreSQL
- ✉️ Invitation workflow with email delivery and acceptance sync
- 🎨 Clean, responsive UI with modern dashboard analytics

## 🎯 Core Features

### 🏢 Workspace & Team Management

- 🔧 Create and manage collaborative workspaces
- 📧 Invite members by email with role assignment (ADMIN / MEMBER)
- ✅ Accept invitations and auto-sync user membership
- 📋 Team page with searchable member directory and contribution stats

### 📁 Project Management

- 📝 Create projects with status, priority, timeline, and progress tracking
- 👤 Assign team lead and manage project members
- 📑 Project tabs: Tasks, Calendar, Analytics, Settings
- 🔒 Team-lead-only controls for sensitive project operations

### ✏️ Task Operations

- 🎯 Create tasks with type, priority, assignee, and due date
- 📊 Update task status from project board
- 🛡️ Permission model supports team leads and assignees for task updates
- 🗑️ Bulk task selection + deletion flow

### 💬 Collaboration

- 🗨️ Comment API for task discussions
- 🔔 Notification/email infrastructure using Nodemailer + Inngest hooks

## 🛠️ Tech Stack

### 🎨 Frontend

- ⚛️ React 19 + Vite
- 🔄 Redux Toolkit for global state
- 🗺️ React Router
- 🎭 Tailwind CSS + Lucide icons
- 📡 Axios + React Hot Toast

### 🖥️ Backend

- 🟩 Node.js + Express
- 📦 Prisma ORM + PostgreSQL
- 🔑 Clerk (Auth + organizations/invitations)
- ✉️ Nodemailer (email invitations)
- ⚡ Inngest (event-driven workflows)

## 🏗️ System Design (High Level)

- 🎨 Frontend consumes REST endpoints from Express backend
- 🔐 Clerk secures routes and provides user identity
- 🛡️ Backend enforces authorization for workspace/project/task actions
- 📊 Prisma models workspace-project-task-member relations in PostgreSQL
- 🔗 Invitation flow bridges Clerk organizations with local DB membership

## 📂 Monorepo Structure

```
project-management/
├─ backend/
│  ├─ controllers/
│  ├─ routes/
│  ├─ prisma/
│  └─ server.js
├─ frontend/
│  ├─ src/components/
│  ├─ src/pages/
│  ├─ src/features/
│  └─ vite.config.js
└─ README.md
```

## 🔌 API Overview

### 🏢 Workspace

- GET /api/workspaces
- POST /api/workspaces/send-invitation
- POST /api/workspaces/sync-member

### 📋 Projects

- POST /api/projects
- PUT /api/projects
- POST /api/projects/:projectId/addMember

### ✅ Tasks

- POST /api/tasks
- PUT /api/tasks/:id
- POST /api/tasks/delete

### 💬 Comments

- POST /api/comments
- GET /api/comments/:taskId

## ⭐ Product Highlights for Recruiters

- 🎯 Built and connected full-stack CRUD + auth flows end-to-end
- 🔑 Implemented role-based access controls at API layer
- 🗄️ Designed normalized relational schema for collaborative workflows
- 📧 Added invitation and onboarding flow integrated with third-party identity provider
- 📦 Structured app for maintainability with modular controllers/components/features

## 🌐 Deployment

Both frontend and backend contain vercel.json files and can be deployed as separate services.

## 🚀 Roadmap

- ⚡ Real-time comments and status updates (WebSocket/SSE)
- 📝 Activity audit logs per workspace
- 📈 Advanced analytics and burndown charts
- ✅ Test suite expansion (API integration + UI testing)

---

Made with ❤️ by Mohamed Zakaria Cherki
