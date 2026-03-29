# Project: team-task-allocator

## What this repo is
A task management system where managers assign tasks to employees.
Employees see tasks in a calendar view with deadline tracking and
email alerts 24 hours before a deadline.
Built as a combined ASP.NET Core + React project (single repo, single deployment).

## Stack
- Frontend: React (TypeScript) inside /frontend — served by ASP.NET Core SPA middleware
- Backend: .NET 8 Web API (C#)
- Database: PostgreSQL with Entity Framework Core (Npgsql)
- Email: SendGrid
- Auth: JWT (access token, role-based: manager / employee)
- No CORS needed — React and API are same origin

## Project structure
- /frontend — React TypeScript frontend
  - /src/pages — Login, ManagerDashboard, EmployeeDashboard
  - /src/components — shared UI components
  - /src/hooks — custom React hooks
  - /src/api — Axios client and API calls
  - /src/context — AuthContext
  - /src/types — TypeScript interfaces
- /backend — ASP.NET Core Web API
  - /Controllers — .NET API controllers
  - /Services — business logic layer
  - /Repositories — data access layer
  - /Models — Entity Framework models
  - /DTOs — request and response shapes
  - /Migrations — EF Core migrations
- /docs/adr — Architecture Decision Records

## Agent roster
| Skill | Invoke | Purpose |
|---|---|---|
| task-planner | /task-planner | Start here for any new feature |
| architecture-agent | /architecture-agent | Design decisions and ADRs |
| coding-agent | /coding-agent | Feature implementation |
| code-assistant | /code-assistant | Quick help, explain, debug |
| code-reviewer | /code-reviewer | Review before every commit |
| testing-expert | /testing-expert | Write and improve tests |

## Workflow rule
Always follow this order:
task-planner → architecture-agent → coding-agent → code-reviewer → testing-expert

Never skip task-planner for non-trivial work.
Never commit without running code-reviewer first.
Never move to the next task without running testing-expert first.

## Roles
- manager — can create tasks, assign to employees, view all tasks, view audit log
- employee — can view own assigned tasks, update task status, view calendar

## V1 features (in scope)
- Manager creates a task with title, description, and deadline
- Manager assigns task by searching employee name OR skill
- Task saved and linked to the assigned employee
- Employee sees assigned tasks in a list view
- Employee can toggle to a calendar view showing tasks on their deadline date

## Out of scope for V1
- Email alerts
- Overdue tracking
- Workload balancing
- Auto-assignment
- Task status updates
- Task comments or attachments
- Mobile view

## Database models
- User: Id, Name, Email, PasswordHash, Role, Skills (array), CreatedAt
- Task: Id, Title, Description, AssigneeId, ManagerId, Deadline, CreatedAt, UpdatedAt

## Task statuses
- pending — just assigned, not started (only status needed for V1)

## API conventions (.NET)
- All routes prefixed with /api
- PascalCase for C# classes, methods, and properties
- camelCase for JSON serialization (use JsonNamingPolicy.CamelCase)
- Repository pattern — no direct DbContext calls in controllers
- Service layer handles all business logic
- Controllers only validate input and call services
- Always use async/await for database and email calls
- Return problem details on errors (RFC 7807)

## Frontend conventions (React)
- Functional components only, no class components
- TypeScript strict mode on
- Hooks for all state and side effects
- Axios client in /frontend/src/api/client.ts — always use this, never fetch directly
- Tailwind for all styling — no inline styles
- date-fns for all date formatting and calculations
- FullCalendar for the calendar view

## Email alert rules
- Send exactly once per task (check AlertSentAt is null before sending)
- Only send if task status is not completed
- Background job runs every hour
- Email subject: "Task due in 24 hours: {task title}"
- Email body: task title, description, deadline, and a link to the task

## ADR location
All architecture decisions are stored in /docs/adr/
Reference them before making any structural changes.

## Things Claude should always do
- Read existing files before writing any code
- Match the code style found in the codebase exactly
- Follow .NET conventions: PascalCase, async/await, repository pattern
- Follow React conventions: functional components, hooks, TypeScript strict
- Leave TODO comments for anything deferred with a reason
- Run tests after every coding task
- Reference the relevant ADR in code comments when implementing a decision

## Things Claude should never do
- Delete existing code unless explicitly asked
- Commit without a code-review pass
- Skip writing tests for new features
- Make architectural decisions without running architecture-agent first
- Use DbContext directly in controllers (always go through repository)
- Use fetch directly in React (always use the Axios client)
- Send more than one email alert per task

## Database naming convention
- EF Core uses quoted PascalCase table and column names (e.g. "Users", "Skills", "Name")
- Do NOT use unquoted lowercase in raw SQL — it will silently target nonexistent relations
- All raw SQL in migrations must use quoted PascalCase identifiers matching EF Core output