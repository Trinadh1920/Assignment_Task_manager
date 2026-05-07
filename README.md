# Team Task Manager

Team Task Manager is a full-stack web application for organizing project work across admins and members. It provides authenticated project spaces, invite-code based membership, role-aware task management, task status updates, and dashboard metrics from a single deployable Node/Express service with a React frontend.

## Links

- Live app: https://team-task-manager-production-1eee.up.railway.app
- GitHub repository: https://github.com/Trinadh1920/Assignment_Task_manager.git

## Features

- User signup and login with hashed passwords and JWT authentication
- Project creation with the creator assigned as project admin
- Invite-code based project joining
- Admin controls for members, task creation, assignment, deletion, and project task management
- Member access limited to assigned projects and assigned tasks
- Task fields for title, description, due date, priority, assignee, and status
- Dashboard metrics for total tasks, status counts, tasks per user, and overdue tasks
- REST API validation with Zod and consistent HTTP errors
- Production build that serves the React app from the Express service

## Tech Stack

- Node.js 20, Express, TypeScript
- React 18, Vite, TypeScript
- Prisma ORM with PostgreSQL
- bcryptjs, jsonwebtoken, Zod
- Vitest for tests

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start PostgreSQL locally. One Docker option is:

```bash
docker run --name team-task-manager-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=team_task_manager \
  -p 5432:5432 \
  -d postgres:16
```

Run database migrations and seed local demo data:

```bash
npm run migrate
npm run seed
```

Start the development servers:

```bash
npm run dev
```

The API runs on `http://localhost:3000`, and the Vite frontend runs on `http://localhost:5173`.

## Local Demo Credentials

These credentials are created only when `npm run seed` is run against a local database:

- Admin: `admin@example.com`
- Member: `member@example.com`
- Password: `Password123!`
- Demo invite code: `DEMO-TEAM`

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs |
| `PORT` | No | Express server port; defaults to `3000` locally |
| `VITE_API_URL` | No | Development API base URL; leave blank in production for same-origin `/api` calls |

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Runs the API and Vite dev server together |
| `npm run migrate` | Applies Prisma migrations in local development |
| `npm run migrate:deploy` | Applies Prisma migrations in production/deployment |
| `npm run seed` | Seeds local demo users, project, and tasks |
| `npm run test` | Runs the Vitest test suite |
| `npm run typecheck` | Runs TypeScript checks for frontend and server |
| `npm run build` | Generates Prisma client, builds the React app, and compiles the server |
| `npm run start` | Starts the compiled production server |

## Railway Deployment

The project is configured for Railway with `railway.json`.

1. Create a Railway project and add a PostgreSQL database.
2. Set `DATABASE_URL`, `JWT_SECRET`, and `NODE_ENV=production` in Railway.
3. Deploy the repository.

Railway uses `npm install && npm run build` for the build command and `npm run migrate:deploy && npm run start` for the start command. In production, the frontend calls the API through same-origin `/api` routes.

## API Overview

Authenticated requests use the `Authorization: Bearer <token>` header.

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/join`
- `GET /api/projects/:projectId`
- `POST /api/projects/:projectId/members`
- `DELETE /api/projects/:projectId/members/:userId`
- `GET /api/projects/:projectId/tasks`
- `POST /api/projects/:projectId/tasks`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`
- `GET /api/projects/:projectId/dashboard`
