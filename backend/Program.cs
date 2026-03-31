// See docs/adr/001-database-schema.md for architecture decisions referenced throughout.

// TODO: This project was scaffolded with .NET 9.0 (only SDK available).
// CLAUDE.md specifies .NET 8 — update TargetFramework in TeamTaskAllocator.csproj to net8.0
// when the .NET 8 SDK is installed on the target build machine.

using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TeamTaskAllocator.Data.Context;
using TeamTaskAllocator.Repositories;
using TeamTaskAllocator.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers ──────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // camelCase JSON serialization per API conventions in CLAUDE.md
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// ── OpenAPI / Swagger ─────────────────────────────────────────────────────────
builder.Services.AddOpenApi();

// ── Database (Npgsql / EF Core) ───────────────────────────────────────────────
// See docs/adr/001-database-schema.md — Decision 3: Repository pattern.
builder.Services.AddDbContext<TaskAllocatorContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Repositories ─────────────────────────────────────────────────────────────
// See docs/adr/001-database-schema.md — Decision 3: Repository pattern.
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ITaskRepository, TaskRepository>();

// ── Authentication / JWT ──────────────────────────────────────────────────────
// See docs/adr/001-database-schema.md — Decision 4: JWT auth.
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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
builder.Services.AddAuthorization();

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITaskService, TaskService>();

// ─────────────────────────────────────────────────────────────────────────────

var app = builder.Build();

// ── Seed demo data (Development only) ────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    await TeamTaskAllocator.Models.DbSeeder.SeedAsync(app.Services);
}

// ── Middleware pipeline ───────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
