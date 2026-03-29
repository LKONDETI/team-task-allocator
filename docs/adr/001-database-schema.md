# ADR 001: Database Schema and Core Architectural Decisions

**Status:** Accepted
**Date:** 2026-03-29
**Deciders:** Architecture Agent

---

## Context

Team Task Allocator is a .NET + React application where managers assign tasks to employees.
Employees have skills that managers search against when assigning tasks. The system needs:

- Efficient multi-value storage for employee skills (no fixed schema, variable length)
- Fast search by employee name and skill
- Clean separation of concerns across data, business logic, and presentation layers
- Stateless authentication with role-based access control

---

## Decision 1: Skills Storage — PostgreSQL Native Text Array

### Decision

Store employee skills as a PostgreSQL native `TEXT[]` column via Npgsql.
Column definition: `skills TEXT[] NOT NULL DEFAULT '{}'`
Index: GIN index on `skills` for containment queries.

### Rationale

A separate `UserSkills` join table would require two joins for every user search.
A JSON column would require deserialization in the ORM layer.
PostgreSQL's native array type maps directly to `string[]` in C# via Npgsql with no custom
conversion needed. The GIN index enables fast `= ANY(skills)` containment queries at the
database level.

### Consequences

- **Good:** Clean C# model (`string[] Skills`), no ORM conversion code, efficient containment queries.
- **Good:** Default `'{}'` ensures no null-checks needed on the array property.
- **Bad:** PostgreSQL-specific — not portable to SQL Server or SQLite without migration changes.
- **Note:** EF Core migration must use `HasColumnType("text[]")` and raw SQL for the GIN index
  (EF Core does not generate GIN indexes natively).

### Implementation Notes

```csharp
// In TaskAllocatorContext.OnModelCreating:
// See docs/adr/001-database-schema.md — Decision 1: Skills storage.
builder.Property(u => u.Skills)
    .HasColumnType("text[]")
    .HasDefaultValueSql("'{}'");
```

Migration raw SQL (in `Up()`):
```sql
CREATE INDEX idx_users_skills_gin ON users USING GIN (skills);
CREATE INDEX idx_users_name_trigram ON users USING GIN (name gin_trgm_ops);
```

> **Note:** The trigram index requires `CREATE EXTENSION IF NOT EXISTS pg_trgm;` to be run once
> on the database before applying migrations.

---

## Decision 2: Search Strategy — IQueryable with EF.Functions.Like and Array Contains

### Decision

Employee search uses `IQueryable<User>` with two predicates combined via OR:
1. `EF.Functions.Like(u.Name, $"%{query}%")` — translates to SQL `LIKE '%query%'`
2. `u.Skills.Contains(query)` — translates to SQL `query = ANY(skills)`

Add a trigram GIN index on `Name` and a GIN index on `Skills` to support these queries efficiently.

### Rationale

Full-text search (tsvector/tsquery) is more complex to configure and unnecessary for simple
substring name matching. `EF.Functions.Like` translates cleanly to SQL LIKE and benefits from
the trigram index when the `pg_trgm` extension is enabled. `u.Skills.Contains(query)` maps to
`= ANY(skills)` in Npgsql — an exact match against the array, fast with the GIN index.

The IQueryable approach keeps the query lazy and composable; the entire predicate is evaluated
server-side, not in-memory.

### Consequences

- **Good:** Server-side filtering — no data pulled into memory before filtering.
- **Good:** Both predicates translate to efficient indexed SQL.
- **Bad:** Skill matching is exact (case-sensitive). Partial skill substring matching is not
  supported in V1. TODO: consider `ilike` or full-text for V2.
- **Note:** `EF.Functions.Like` is case-sensitive on PostgreSQL by default. Use
  `EF.Functions.ILike` for case-insensitive name matching.

### Implementation Notes

```csharp
// See docs/adr/001-database-schema.md — Decision 2: Search strategy.
public async Task<IEnumerable<User>> SearchByNameOrSkillAsync(string query)
{
    return await _context.Users
        .Where(u =>
            EF.Functions.ILike(u.Name, $"%{query}%") ||
            u.Skills.Contains(query))
        .ToListAsync();
}
```

---

## Decision 3: Repository Pattern — Specialized Repositories with Shared DbContext

### Decision

Use the Repository pattern with two specialized repository interfaces and implementations:
- `IUserRepository` / `UserRepository`
- `ITaskRepository` / `TaskRepository`

Both wrap a shared `TaskAllocatorContext` (EF Core DbContext). Layering rule:
- **Controllers** call **Services** only.
- **Services** call **Repositories** only.
- **Repositories** call **DbContext** only.
- DbContext is **never** accessed directly in controllers or services.

### Rationale

Separating query logic into repositories makes the service layer unit-testable by mocking
`IUserRepository` and `ITaskRepository`. A single generic `IRepository<T>` was considered but
rejected — it would force all callers to work at a generic level and obscure domain-specific
query methods like `SearchByNameOrSkillAsync` and `GetByAssigneeIdAsync`.

### Consequences

- **Good:** Service layer is fully unit-testable without a database.
- **Good:** Query logic is co-located with the entity it belongs to.
- **Bad:** More boilerplate than placing queries directly in services.
- **Note:** Register both repositories as `Scoped` in `Program.cs` to match EF Core's lifetime.

### Implementation Notes

```csharp
// In Program.cs:
// See docs/adr/001-database-schema.md — Decision 3: Repository pattern.
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
```

```
Interface contracts:
IUserRepository:
  - GetByIdAsync(int id)
  - GetByEmailAsync(string email)
  - SearchByNameOrSkillAsync(string query)
  - CreateAsync(User user)
  - UpdateAsync(User user)

ITaskRepository:
  - GetByIdAsync(int id)
  - GetByAssigneeIdAsync(int assigneeId)
  - CreateAsync(TaskEntity task)
  - UpdateAsync(TaskEntity task)
```

---

## Decision 4: JWT Authentication — ASP.NET Core Built-in Bearer with Role Claims

### Decision

Use ASP.NET Core's built-in Bearer authentication (`Microsoft.AspNetCore.Authentication.JwtBearer`).
Token structure:
- Claims: `sub` (userId), `name`, `email`, `role` (manager | employee)
- Expiry: 24 hours from issuance
- Signing: HMAC-SHA256 with a secret key from configuration
- No refresh tokens in V1

Authorization attributes:
- `[Authorize(Roles = "manager")]` on task creation and user search endpoints
- `[Authorize]` on employee task read endpoints
- No `[Authorize]` on `POST /api/auth/login`

### Rationale

ASP.NET Core's built-in JWT middleware is well-tested, integrates with `[Authorize]` and
`ClaimsPrincipal` natively, and requires no additional libraries beyond the NuGet package.
Refresh tokens add complexity (storage, rotation, revocation) not justified for V1 scope.
The 24-hour expiry balances security and user convenience for an internal tool.

ManagerId in task creation is **always** extracted from the JWT claim server-side — never
trusted from the client request body, preventing privilege escalation.

### Consequences

- **Good:** Stateless — no server-side session storage needed.
- **Good:** Role-based authorization with `[Authorize(Roles = "...")]` works out of the box.
- **Bad:** No token revocation in V1 — a logged-out token remains valid until expiry.
  TODO: Add refresh tokens and a token blocklist in V2.
- **Note:** JWT secret must be at least 32 characters and stored in environment variables or
  Azure Key Vault in production — never committed to source control.

### Implementation Notes

```csharp
// In Program.cs:
// See docs/adr/001-database-schema.md — Decision 4: JWT auth.
builder.Services
    .AddAuthentication("Bearer")
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };
    });
```

---

## References

- Npgsql EF Core PostgreSQL provider: https://www.npgsql.org/efcore/
- PostgreSQL array operators: https://www.postgresql.org/docs/current/functions-array.html
- pg_trgm extension: https://www.postgresql.org/docs/current/pgtrgm.html
- ASP.NET Core JWT Bearer: https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn
