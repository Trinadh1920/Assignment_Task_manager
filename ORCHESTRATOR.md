# ORCHESTRATOR

## Current State

This repository contains a full-stack Team Task Manager built from scratch. The app is a single deployable Node/Express service serving a React/Vite frontend in production. The assignment PDF must remain untouched.

## Architecture

- `server/`: Express API, auth, RBAC, validation, dashboard logic, and route modules.
- `src/`: React/Vite frontend, API client, app UI, types, and CSS.
- `prisma/`: PostgreSQL Prisma schema, initial migration, and seed script.
- `dist/client`: Vite production output after `npm run build`.
- `dist/server`: TypeScript server output after `npm run build`.

## Backend Conventions

- Authentication uses JWT bearer tokens in the `Authorization` header.
- Passwords are hashed with bcrypt.
- Payload validation is handled with Zod schemas in `server/validators.ts`.
- Server-side RBAC is enforced in route handlers with `getMembership` and `requireProjectAdmin`.
- Admins can manage project members and all tasks.
- Members can only view and update status for tasks assigned to them.
- Dashboard scope is all project tasks for admins and assigned tasks for members.

## Frontend Conventions

- App-first UI; no marketing landing page.
- `src/api.ts` centralizes API calls and token storage.
- `src/App.tsx` owns page state and workflow forms.
- `src/styles.css` contains a restrained, utilitarian responsive design.
- Async React form handlers must capture `const formElement = event.currentTarget` before any `await`; do not read `event.currentTarget` after awaited API calls.

## Scripts

- `npm install`: install dependencies.
- `npm run prisma:generate`: generate Prisma client with a fallback local PostgreSQL URL.
- `npm run migrate`: local Prisma migration development.
- `npm run migrate:deploy`: production migration deploy.
- `npm run seed`: seed demo users and project.
- `npm run dev`: run API and Vite dev server.
- `npm run test`: run Vitest tests.
- `npm run typecheck`: run frontend and server TypeScript checks.
- `npm run build`: generate Prisma client, build frontend, compile server.
- `npm run start`: start compiled Express app.

## Deployment Notes

Railway requires `DATABASE_URL`, `JWT_SECRET`, and `NODE_ENV=production`. The service binds to `process.env.PORT`. Production frontend calls use same-origin `/api`, so `VITE_API_URL` is optional and usually unset.

## Railway Deployment

- Project: `Team Task Manager` (`7bf3d050-f731-4c59-a6ba-7563dc00c73e`)
- App service: `Team Task Manager` (`45afd5a2-8c28-4a08-987c-070bcfd24377`)
- Database service: `Postgres` (`f4081ce4-f408-4e45-80cd-06c1a6294da1`)
- Public URL: `https://team-task-manager-production-1eee.up.railway.app`
- Deployment status on May 5, 2026: app and PostgreSQL services reported `SUCCESS`.
- Live verification on May 5, 2026: `/api/health` returned HTTP 200 with `{"ok":true}`, `/` returned HTTP 200, and API smoke passed for signup, project creation, project join, task creation, member status update, and dashboard metrics.

## Known Risks

- Local end-to-end API smoke testing requires a running PostgreSQL database. The project intentionally uses Prisma's PostgreSQL provider to match Railway Postgres.
- JWTs are stored in browser localStorage for demo simplicity. This is consistent across frontend and backend and documented in the README.
- The mobile task grid uses horizontal scrolling inside the task panel to preserve the dense table layout.
- This directory is not currently initialized as a git repository.

## Latest Verification

- `npm run test`, `npm run typecheck`, and `npm run build` passed on May 5, 2026.
- API smoke passed for signup/login, project creation, project join, admin member management, task assignment, member status update, dashboard metrics, and RBAC denial checks.
- Browser smoke passed against the production-served app at `http://localhost:3000`, including desktop and mobile screenshots.
