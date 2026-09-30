# TaskFlow – Team Project & Task Management Platform

TaskFlow is a full-stack **MERN (MongoDB, Express.js, React.js, Node.js)** web application designed to help teams manage projects, tasks, members, and collaboration from a single platform.

It provides project-based access control, task management, comments, search and filtering, and project progress tracking.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- User registration and login
- Password hashing using `bcryptjs`
- JWT-based authentication
- Protected routes
- Project-level Role-Based Access Control (RBAC)
- Admin and Member roles

### 📁 Project Management
- Create and manage projects
- Add members to projects
- Project-based access control
- Manage project members and roles

### ✅ Task Management
- Create, update, and delete tasks
- Task statuses:
  - To Do
  - In Progress
  - Done
- Assign tasks to team members
- Task priority management
- Task due dates
- Search tasks
- Filter tasks by status/priority
- Sort tasks
- Pagination

### 💬 Collaboration
- Add comments to tasks
- View task discussions
- Collaborate with project members

### 📊 Project Progress
- Track project progress
- View task statistics
- MongoDB aggregation used for progress calculations

### 🛡️ Validation & Security
- Server-side input validation
- Protected API routes
- JWT authentication
- Password hashing
- Environment variables for sensitive configuration

### 📱 Responsive UI
- React-based frontend
- Responsive design
- Simple and clean dashboard interface

---

# 🛠️ Tech Stack

## Frontend

- React 18
- React Router 6
- Context API
- Vite
- JavaScript
- CSS

## Backend

- Node.js
- Express.js
- JWT
- bcryptjs
- REST APIs

## Database

- MongoDB
- Mongoose
- MongoDB Atlas

---

# 📂 Project Structure

```text
TaskFlow/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── seed.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
