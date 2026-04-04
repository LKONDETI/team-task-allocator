# TDD Session Log

First TDD session — 2026-04-04.
Covered 37 test cases across frontend (Vitest) and backend (xUnit).

---

## Key Concepts Applied

- **Red** — test written first, fails before any production code exists
- **Green** — minimum code added to make the test pass
- **Refactor** — clean up with the safety net of green tests
- **Retrofitting** — test written after code already exists (no Red phase, used for learning the pattern)

---

## Test Case Log

| # | Test | What it tests | Red | Green | Refactored |
|---|------|--------------|-----|-------|------------|
| 1 | Login — renders form | Email/password inputs + button exist | — (retrofitting) | already passed | — |
| 2 | Login — password hidden by default | Input type is `password` | — | already passed | — |
| 3 | Login — toggles password visibility | Show/hide button flips input type | — | already passed | — |
| 4 | Login — navigates to /manager | Successful manager login redirects | — | already passed | — |
| 5 | Login — navigates to /employee | Successful employee login redirects | — | already passed | — |
| 6 | Login — shows error on failure | Rejected login shows error text | — | already passed | — |
| 7 | Login — clears error on retry | Error disappears on next submit | — | already passed | — |
| 8 | Login — submitting state | Button disabled + text changes in-flight | — | already passed | — |
| 9 | AuthContext — no token on load | `me()` not called, `isLoading` → false | — | already passed | — |
| 10 | AuthContext — valid token on load | `me()` called, user set | — | already passed | — |
| 11 | AuthContext — expired token | `me()` fails → token removed from localStorage | — | already passed | — |
| 12 | AuthContext — login() | Stores token, sets user, returns profile | — | already passed | — |
| 13 | AuthContext — logout() | Clears token, nulls user, redirects to `/` | — | already passed | — |
| 14 | EmployeeSearch — initial render | Input shown, no dropdown | — | already passed | — |
| 15 | EmployeeSearch — no call before 300ms | `searchUsers` not called mid-debounce | `userEvent.type` deadlocked with fake timers | switched to `fireEvent.change` + `vi.runAllTimersAsync()` | — |
| 16 | EmployeeSearch — calls API after 300ms | `searchUsers` called with trimmed query | same | same fix | — |
| 17 | EmployeeSearch — fires one request | Rapid input changes = one API call | same | same fix | — |
| 18 | EmployeeSearch — renders results | Name, email, skills shown | same | same fix | — |
| 19 | EmployeeSearch — multiple results | All results rendered | same | same fix | — |
| 20 | EmployeeSearch — no results message | "No employees found." shown | same | same fix | — |
| 21 | EmployeeSearch — clears on empty input | Dropdown hides when input cleared | same | same fix | — |
| 22 | EmployeeSearch — onSelect called | Clicking result calls prop with user | same | same fix | — |
| 23 | EmployeeSearch — clears after select | Input cleared, dropdown closed after pick | same | same fix | — |
| 24 | EmployeeSearch — API error silent | No dropdown shown on rejection | same | same fix | — |
| 25 | TaskService — empty list | Returns `[]` when manager has no tasks | `ITaskRepository` had no `GetByManagerIdAsync` | added method to interface + stub | — |
| 26 | TaskService — correct tasks returned | Maps tasks to DTOs with names | same compile error | added `GetByManagerAsync` to service | — |
| 27 | TaskService — different manager isolated | Manager 2 gets no manager 1 tasks | same | same | — |
| 28 | TasksController — 200 with tasks | Returns `OkObjectResult` with task list | `TasksController` had no `GetManagerTasks` | added `GET /api/tasks` action | duplicated claim-parsing extracted to `TryGetUserId()` |
| 29 | TasksController — 200 empty list | Returns `Ok([])` when no tasks | same | same | same refactor |
| 30 | TasksController — passes manager ID | JWT claim ID forwarded to service | same | same | same refactor |
| 31 | getTasks — calls GET /tasks | Axios client called with correct URL | `getTasks` not exported from `tasks.ts` | added `getTasks()` function | — |
| 32 | getTasks — returns empty array | Empty response passed through | same | same | — |
| 33 | ManagerTaskList — loading state | Shows "Loading…" while in-flight | component file didn't exist | created `ManagerTaskList.tsx` | — |
| 34 | ManagerTaskList — renders tasks | Title + assignee name shown | same | same | — |
| 35 | ManagerTaskList — formatted deadline | "Due Jun 1, 2026" shown | test used midnight UTC → local timezone shifted date | fixed fixture to `T12:00:00Z` | — |
| 36 | ManagerTaskList — empty state | "No tasks created yet." shown | same | same | — |
| 37 | ManagerTaskList — error state | "Failed to load tasks." shown | same | same | — |

---

## Phase Summary

| Phase | Tests | Type | Outcome |
|-------|-------|------|---------|
| Tests 1–13 | Login + AuthContext | Retrofitting | All passed immediately — no Red phase |
| Tests 14–24 | EmployeeSearch | Retrofitting | One real fix: `userEvent` + fake timers conflict → switched to `fireEvent.change` |
| Tests 25–37 | Backend service/controller + Frontend API/component | Pure TDD | Every test was Red before a single line of production code was written |

---

## Files Created / Modified

### New test files
- `frontend/src/pages/Login.test.tsx`
- `frontend/src/context/AuthContext.test.tsx`
- `frontend/src/components/EmployeeSearch.test.tsx`
- `frontend/src/api/tasks.test.ts`
- `frontend/src/components/ManagerTaskList.test.tsx`
- `backend.Tests/Services/TaskServiceTests.cs`
- `backend.Tests/Controllers/TasksControllerTests.cs`

### New production files
- `frontend/src/components/ManagerTaskList.tsx`
- `backend.Tests/TeamTaskAllocator.Tests.csproj`

### Modified production files
- `frontend/src/api/tasks.ts` — added `getTasks()`
- `backend/Services/ITaskService.cs` — added `GetByManagerAsync`
- `backend/Services/TaskService.cs` — implemented `GetByManagerAsync`
- `backend/Repositories/ITaskRepository.cs` — added `GetByManagerIdAsync`
- `backend/Repositories/TaskRepository.cs` — implemented `GetByManagerIdAsync`
- `backend/Controllers/TasksController.cs` — added `GetManagerTasks`, refactored to `TryGetUserId()`
- `backend/Program.cs` — added `public partial class Program {}` for future integration tests

---

## Lessons Learned

| Lesson | Detail |
|--------|--------|
| Compile error = valid Red | On the backend, the test not compiling IS the Red — it tells you exactly what interfaces to add |
| `userEvent` + fake timers conflict | `userEvent.type()` deadlocks with `vi.useFakeTimers()` — use `fireEvent.change` instead for debounce tests |
| Midnight UTC timezone trap | `T00:00:00Z` shifts to the previous day in local timezones — always use `T12:00:00Z` in test fixtures |
| Refactor only when Green | `TryGetUserId()` was only extracted after all controller tests were passing — never refactor on Red |
| Test names are the spec | A test named `Returns_only_tasks_belonging_to_the_given_manager` is a requirement, not just a test |
