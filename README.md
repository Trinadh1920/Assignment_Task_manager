# Team Task Manager

A full-stack Team Task Management application built for the assignment in `Team_Task_Manager_Assignment.pdf`. It uses a single deployable Node/Express service, a React/Vite frontend, Prisma ORM, PostgreSQL, JWT bearer authentication, and server-side role-based access control.

## Features

- Signup with name, email, and password.
- Secure login with bcrypt password hashing and signed JWTs.
- Create projects; the creator is automatically assigned the Admin role.
- Join projects using invite codes.
- Admins can add/remove members, create tasks, assign tasks, delete tasks, and manage all project tasks.
- Members can see their assigned projects and only view/update tasks assigned to them.
- Tasks include title, description, due date, priority, assignee, and status.
- Dashboard metrics include total tasks, status buckets, tasks per user, and overdue task count.
- RESTful APIs with Zod validation and clear HTTP errors.
- Railway-ready build/start commands and PostgreSQL datasource.

## Tech Stack

- Node 20, Express, TypeScript
- React 18, Vite, TypeScript
- Prisma with PostgreSQL
- bcryptjs, jsonwebtoken, Zod

## Local Setup

PostgreSQL is required locally because Prisma is configured with the PostgreSQL provider for Railway compatibility.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and set `DATABASE_URL` plus `JWT_SECRET`.

   ```bash
   cp .env.example .env
   ```

3. Run migrations and seed demo data:

   ```bash
   npm run migrate
   npm run seed
   ```

4. Start development servers:

   ```bash
   npm run dev
   ```

   The API runs on `http://localhost:3000`; the Vite app runs on `http://localhost:5173`.

## Demo Login

After seeding:

- Admin: `admin@example.com`
- Member: `member@example.com`
- Password for both: `Password123!`
- Demo project invite code: `DEMO-TEAM`

## Production Build

```bash
npm run build
npm run start
```

`npm run start` serves the compiled React app from the Express service and binds to `process.env.PORT`.

## Railway Deployment

1. Create a Railway project and add a PostgreSQL database.
2. Set environment variables:
   - `DATABASE_URL` from the Railway PostgreSQL plugin
   - `JWT_SECRET` to a long random value
   - `NODE_ENV=production`
3. Deploy the repository. `railway.json` uses:
   - Build: `npm install && npm run build`
   - Start: `npm run migrate:deploy && npm run start`

The frontend uses same-origin `/api` calls in production, so no production `VITE_API_URL` is required.

## API Overview

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

Use the `Authorization: Bearer <token>` header for authenticated requests.

## Verification

```bash
npm run test
npm run typecheck
npm run build
```

Full API smoke tests require a reachable PostgreSQL database with `DATABASE_URL` set.
