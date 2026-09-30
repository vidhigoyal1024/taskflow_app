# TaskFlow – Team Project & Task Management Platform

A full-stack **MERN** (MongoDB, Express.js, React.js, Node.js) application where teams create projects, assign tasks, set priorities and deadlines, and track progress across **To-Do, In progress and Done**.

**Live demo:** _add your deployed URL here_

## Features

- **Authentication:** register and log in with hashed passwords (bcrypt) and JWT sessions; protected routes on the frontend and protected endpoints on the backend.
- **Role-based access control (per project):**
  - *Admin*: edit or delete the project, add/remove members, change roles, edit or delete any task.
  - *Member*: create tasks, edit or move tasks they created or are assigned to, comment on any task.
- **Projects & members:** invite teammates by email, promote/demote roles, leave a project (a project always keeps at least one admin).
- **Task board:** three status columns, priority colours, due dates with overdue highlighting, assignees, and one-click status changes.
- **Search, filter, sort, paginate:** search by title/description, filter by status, priority, assignee or overdue, six sort orders, server-side pagination (12 tasks per page).
- **Comments:** threaded discussion on every task.
- **Progress stats:** per-project completion bar and overdue count from a single MongoDB aggregation.
- **Server-side validation** on every write endpoint, plus consistent JSON error responses.
- Responsive layout, keyboard-accessible dialogs and controls.

## Tech stack

| Layer    | Tools |
|----------|-------|
| Frontend | React 18, React Router 6, Context API, Vite, plain CSS |
| Backend  | Node.js, Express.js, JSON Web Tokens, bcryptjs |
| Database | MongoDB with Mongoose (references, compound indexes, aggregation pipeline) |

## Project structure

```
taskflow/
├── client/                     # React frontend (Vite)
│   ├── public/_redirects       # SPA fallback for Netlify
│   ├── vercel.json             # SPA fallback for Vercel
│   └── src/
│       ├── api.js              # fetch wrapper (adds JWT, handles errors)
│       ├── context/AuthContext.jsx
│       ├── components/         # Navbar, ProtectedRoute, TaskCard, TaskModal, MembersPanel
│       └── pages/              # Login, Register, Dashboard, ProjectDetail
└── server/                     # Express API
    ├── server.js               # entry point
    └── src/
        ├── app.js              # middleware + route mounting
        ├── config/db.js
        ├── models/             # User, Project, Task, Comment
        ├── controllers/        # auth, project, task, comment logic
        ├── routes/
        ├── middleware/         # auth (JWT), validate, error handler
        ├── utils/              # ApiError, asyncHandler, access-control helpers
        └── seed.js             # demo data (development only)
```

## Run it locally

**Prerequisites:** Node.js 18+ and MongoDB (local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
# 1. Backend
cd server
npm install
cp .env.example .env        # then edit MONGO_URI and JWT_SECRET
npm run dev                 # API on http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev                 # App on http://localhost:5173
```

Optional demo data (**wipes the database**, so use a development database only):

```bash
cd server && npm run seed
# log in as asha@taskflow.dev / password123 (admin), rohan@taskflow.dev or meera@taskflow.dev (members)
```

## Environment variables

| File | Variable | Purpose |
|------|----------|---------|
| `server/.env` | `MONGO_URI` | MongoDB connection string |
| | `JWT_SECRET` | Long random string used to sign tokens |
| | `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| | `CLIENT_URL` | Allowed frontend origin(s), comma-separated |
| | `PORT` | API port (default `5000`) |
| `client/.env` | `VITE_API_URL` | Deployed API URL (leave empty in development) |

## API reference

All routes except `register` and `login` need the header `Authorization: Bearer <token>`.

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Create account | Public |
| POST | `/api/auth/login` | Log in, receive token | Public |
| GET | `/api/auth/me` | Current user | Any user |
| GET | `/api/projects` | My projects with progress stats | Any user |
| POST | `/api/projects` | Create project (creator becomes admin) | Any user |
| GET | `/api/projects/:id` | Project with members | Member |
| PUT | `/api/projects/:id` | Update name/description | Admin |
| DELETE | `/api/projects/:id` | Delete project, tasks and comments | Admin |
| GET | `/api/projects/:id/stats` | Task counts by status, overdue | Member |
| POST | `/api/projects/:id/members` | Add member by email | Admin |
| PATCH | `/api/projects/:id/members/:userId` | Change member role | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member / leave | Admin or self |
| GET | `/api/projects/:projectId/tasks` | List tasks (search, filter, sort, paginate) | Member |
| POST | `/api/projects/:projectId/tasks` | Create task | Member |
| GET | `/api/tasks/mine` | Open tasks assigned to me | Any user |
| GET | `/api/tasks/:id` | Task details | Member |
| PUT | `/api/tasks/:id` | Update task | Admin, creator or assignee |
| PATCH | `/api/tasks/:id/status` | Move task between columns | Admin, creator or assignee |
| DELETE | `/api/tasks/:id` | Delete task and its comments | Admin or creator |
| GET | `/api/tasks/:id/comments` | List comments | Member |
| POST | `/api/tasks/:id/comments` | Add comment | Member |
| DELETE | `/api/comments/:id` | Delete comment | Author or admin |

**Task list query parameters:** `q`, `status` (`todo|in-progress|done`), `priority` (`low|medium|high`), `assignee` (`me|unassigned|<userId>`), `overdue=true`, `sort` (`newest|oldest|due-soon|due-late|priority|title`), `page`, `limit` (max 50).

## Design notes

- **Data model:** `Project.members` embeds `{ user, role }`; tasks and comments reference their parent by ObjectId. Deleting a project or task cascades to its children.
- **Indexes:** `{project, status, createdAt}`, `{project, assignee}`, `{project, dueDate}`, `{assignee, status}` on tasks; `{members.user, updatedAt}` on projects; `{task, createdAt}` on comments.
- **Task listing** uses an aggregation pipeline so tasks without a due date always sort last and priority sorts high → low.
- **Authorization** is enforced on the server in one place (`utils/access.js`), never trusting the UI.

## Deployment (free tiers)

1. **Database:** create a MongoDB Atlas cluster, add a database user, allow network access, copy the connection string.
2. **API (Render):** New Web Service → root directory `server`, build command `npm install`, start command `npm start`. Set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` (your frontend URL).
3. **Frontend (Vercel or Netlify):** root directory `client`, build command `npm run build`, output directory `dist`. Set `VITE_API_URL` to your Render URL.
4. Put the live link at the top of this README and on your resume.

## Ideas for future work

Drag-and-drop between columns, real-time updates, file attachments, email notifications, automated tests.

## License

MIT
