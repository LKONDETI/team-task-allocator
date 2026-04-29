# Team Task Allocator

A task management system where managers assign tasks to employees. Employees see their assigned tasks in a list or calendar view with deadline tracking.

Built with a premium dark glassmorphic UI — deep purple/indigo palette, Inter typography, and smooth micro-animations throughout.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS, FullCalendar, date-fns, Axios, Inter (Google Fonts) |
| Backend | ASP.NET Core (.NET 9) Web API (C#) |
| Database | PostgreSQL with Entity Framework Core (Npgsql) |
| Auth | JWT — role-based (manager / employee), 24-hour expiry |
| Testing | Vitest + React Testing Library (frontend) |
| Email | SendGrid (wired, not active in V1) |

React is served by ASP.NET Core SPA middleware — same origin, no CORS needed.

## Project Structure

```
/
├── frontend/               # React TypeScript app
│   └── src/
│       ├── api/            # Axios client and API call functions
│       ├── components/     # EmployeeSearch, ManagerTaskList, ProtectedRoute
│       ├── context/        # AuthContext (JWT state)
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Login, ManagerDashboard, EmployeeDashboard
│       └── types/          # TypeScript interfaces
├── backend/                # ASP.NET Core Web API
│   ├── Controllers/        # AuthController, TasksController, UsersController
│   ├── Services/           # Business logic (AuthService, TaskService, UserService)
│   ├── Repositories/       # Data access (IUserRepository, ITaskRepository)
│   ├── Models/             # EF Core entities (User, TaskEntity)
│   ├── DTOs/               # Request / response shapes
│   └── Migrations/         # EF Core migrations
└── docs/
    └── adr/                # Architecture Decision Records
```

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- PostgreSQL 15+ with `pg_trgm` extension

## Getting Started

### 1. Database setup

```bash
psql -U postgres -c "CREATE DATABASE teamtaskallocator;"
psql -U postgres -d teamtaskallocator -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

### 2. Backend configuration

Edit `backend/appsettings.Development.json` with your local values:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=teamtaskallocator;Username=postgres;Password=yourpassword"
  },
  "Jwt": {
    "Secret": "your-32-char-minimum-secret-here",
    "Issuer": "TeamTaskAllocator",
    "Audience": "TeamTaskAllocatorUsers"
  }
}
```

> Never commit real secrets to source control. The `appsettings.Development.json` file is git-ignored.

### 3. Run migrations

```bash
cd backend
dotnet ef database update
```

### 4. Start the backend

```bash
cd backend
dotnet run
```

The API listens on `https://localhost:5001` by default.

### 5. Start the frontend (development)

```bash
cd frontend
npm install
npm run dev
```

Vite dev server proxies `/api` requests to the .NET backend.

## Running Tests

```bash
cd frontend
npm test
```

67 tests across 9 suites — all passing:

| Suite | File | Tests |
|---|---|---|
| Login | `Login.test.tsx` | 3 |
| EmployeeDashboard | `EmployeeDashboard.test.tsx` | 3 |
| ManagerDashboard | `ManagerDashboard.test.tsx` | 17 |
| EmployeeSearch | `EmployeeSearch.test.tsx` | 11 |
| ManagerTaskList | `ManagerTaskList.test.tsx` | 5 |
| StatusBadge | `StatusBadge.test.tsx` | 14 |
| AuthContext | `AuthContext.test.tsx` | 14 |
| **Total** | | **67** |

## UI Design

All pages share a cohesive dark glassmorphic design system:

| Page / Component | Design highlights |
|---|---|
| **Login** | Full-screen gradient background, glassmorphic card, icon-prefixed inputs, gradient sign-in button |
| **ManagerDashboard** | Ambient blob background, glassmorphic form card, dark datetime picker, gradient submit with spinner |
| **EmployeeDashboard** | Personalised greeting, smart deadline badges (overdue / due today / Nd left), date block per task, animated loading and empty states |
| **Calendar View** | Month/Week/List toggle, task events colour-coded by status — **clicking any event opens the Task Detail slideover** |
| **Task Detail Slideover** | Right-hand panel with full task info, one-click status update (Pending → In Progress → Completed) |
| **EmployeeSearch** | Live spinner while debouncing, avatar initials, skill pills with overflow count, dark dropdown |

Design tokens: `slate-900 → purple-950 → slate-900` gradient, `bg-white/5 backdrop-blur-xl` glass surfaces, `purple-500 → indigo-600` accent gradient.

## Roles

| Role | Capabilities |
|---|---|
| `manager` | Create tasks, assign to employees (search by name or skill), view own created tasks |
| `employee` | View own assigned tasks (list and calendar view) |

## API Routes

All routes are prefixed with `/api`.

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate and receive a JWT |
| GET | `/api/auth/me` | Any | Return current user info from JWT claims |
| GET | `/api/users/search?q=` | manager | Search employees by name or skill |
| POST | `/api/tasks` | manager | Create and assign a task |
| GET | `/api/tasks` | manager | List tasks created by the authenticated manager |
| GET | `/api/tasks/my` | employee | List tasks assigned to the authenticated employee |

## Architecture Decisions

Key decisions are documented as ADRs in [docs/adr/](docs/adr/):

- [ADR 001](docs/adr/001-database-schema.md) — Skills storage (`TEXT[]` + GIN index), employee search strategy, repository pattern, JWT auth

## V1 Scope

**In scope:** task creation, employee assignment (search by name), task list view, calendar view (Month/Week/List), **calendar event click → task detail panel**, status updates (Pending / In Progress / Completed), deadline tracking with countdown.

**Out of scope for V1:** email alerts, overdue tracking, workload balancing, auto-assignment, task comments/attachments, mobile view.
