# Task List — team-task-allocator

Status legend: ✅ Done | 🔄 In Progress | ⬜ Not Started

---

## Phase 1 — V1 Core (already implemented)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | DB schema + EF Core migration | ✅ | `InitialSchema` migration with GIN indexes |
| 1.2 | JWT auth — login endpoint + token generation | ✅ | `AuthController`, `AuthService` |
| 1.3 | AuthContext + ProtectedRoute on frontend | ✅ | Role-based redirect (manager/employee) |
| 1.4 | User repository + service | ✅ | `UserRepository`, `UserService` |
| 1.5 | Task repository + service | ✅ | `TaskRepository`, `TaskService` |
| 1.6 | `POST /api/tasks` — create & assign task | ✅ | `TasksController` |
| 1.7 | `GET /api/tasks/my` — employee fetch own tasks | ✅ | |
| 1.8 | `GET /api/users/search?q=` — search by name or skill | ✅ | `UsersController`, `EmployeeSearch` component |
| 1.9 | ManagerDashboard — create task form with assignee search | ✅ | |
| 1.10 | EmployeeDashboard — list view | ✅ | |
| 1.11 | EmployeeDashboard — calendar view (FullCalendar) | ✅ | |
| 1.12 | DB seed data | ✅ | `DbSeeder` |

---

## Phase 2 — V1 Tests (needs completion)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Frontend: EmployeeDashboard unit tests | ✅ | `EmployeeDashboard.test.tsx` exists |
| 2.2 | Frontend: ManagerDashboard unit tests | ✅ | `ManagerDashboard.test.tsx` exists |
| 2.3 | Frontend: EmployeeSearch component tests | ✅ | `EmployeeSearch.test.tsx` exists |
| 2.4 | Frontend: Login page tests | ✅ | `Login.test.tsx` exists |
| 2.5 | Frontend: AuthContext tests | ✅ | `AuthContext.test.tsx` exists |
| 2.6 | Backend: AuthService unit tests | ⬜ | Test password hash verify, token generation |
| 2.7 | Backend: UserService unit tests | ✅ | `UserServiceTests.cs` — 6 tests covering empty result, DTO mapping, multi-match, skills array, no-skills, query forwarding |
| 2.8 | Backend: TaskService unit tests | ✅ | `TaskServiceTests.cs` — 11 tests covering CreateAsync (7) and GetByAssigneeAsync (4); GetByManagerAsync (3) already existed |
| 2.9 | Backend: TasksController integration tests | ⬜ | Test auth guard, 400/404 responses |
| 2.10 | Backend: UsersController integration tests | ⬜ | Test search endpoint, role guard |

---

## Phase 3 — Manager: View & Manage Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Backend: `GET /api/tasks` — return all tasks (manager only) | ✅ | `GetManagerTasks` in `TasksController`, manager role guard |
| 3.2 | Frontend: ManagerDashboard task list section | 🔄 | `ManagerTaskList` component + `getTasks` API done; not yet rendered in `ManagerDashboard` |
| 3.3 | Backend: `DELETE /api/tasks/{id}` — manager can delete task | ⬜ | Only task creator can delete |
| 3.4 | Tests for task list + delete | ⬜ | |

---

## Phase 4 — Employee: Task Status Updates

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Backend: `PATCH /api/tasks/{id}/status` endpoint | ⬜ | Employee can set: pending → in-progress → completed |
| 4.2 | Frontend: Status badge + dropdown in list view | ⬜ | Optimistic update on change |
| 4.3 | Tests for status update flow | ⬜ | |

---

## Phase 5 — Email Alerts (V2)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Add `AlertSentAt` column to Task model + migration | ⬜ | Nullable DateTime |
| 5.2 | SendGrid client setup + config | ⬜ | API key in `appsettings.json` / env var |
| 5.3 | `IEmailService` + `SendGridEmailService` | ⬜ | Send task-due email |
| 5.4 | `AlertBackgroundService` — hourly job | ⬜ | Query tasks due in <24h where `AlertSentAt` is null |
| 5.5 | Mark `AlertSentAt` after send to prevent duplicates | ⬜ | Critical: send exactly once per task |
| 5.6 | Tests for alert job — mock SendGrid, verify dedup | ⬜ | |

---

## Phase 6 — Manager: Audit Log

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | `AuditLog` model + migration | ⬜ | Fields: Id, Action, TargetId, ManagerId, Timestamp |
| 6.2 | Log write on task create/delete/reassign | ⬜ | In `TaskService` |
| 6.3 | Backend: `GET /api/audit` — manager only | ⬜ | Paginated, newest first |
| 6.4 | Frontend: Audit log page/panel in ManagerDashboard | ⬜ | |
| 6.5 | Tests for audit log | ⬜ | |

---

## Phase 7 — Polish & Hardening

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Global error boundary in React | ⬜ | Catch unhandled render errors |
| 7.2 | 401 interceptor in Axios client | ⬜ | Auto-logout on expired token |
| 7.3 | Input validation on all backend DTOs | ⬜ | Use `[Required]`, `[MaxLength]` data annotations |
| 7.4 | Rate limiting on auth endpoints | ⬜ | Prevent brute-force on `/api/auth/login` |
| 7.5 | Responsive / mobile layout | ⬜ | Out of scope for V1, revisit in V2 |

---

## How to use this list

- Pick one task at a time, starting from the lowest incomplete phase.
- For any non-trivial task, run `/task-planner` first.
- After coding, run `/code-reviewer` before committing.
- After every task, run `/testing-expert` before moving on.
