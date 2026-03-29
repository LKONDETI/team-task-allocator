// See docs/adr/001-database-schema.md for architecture decisions referenced throughout.

// TODO: This project was scaffolded with .NET 9.0 (only SDK available).
// CLAUDE.md specifies .NET 8 — update TargetFramework in TeamTaskAllocator.csproj to net8.0
// when the .NET 8 SDK is installed on the target build machine.

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
// TODO (Task 1.2): Register TaskAllocatorContext here once created.
// builder.Services.AddDbContext<TaskAllocatorContext>(options =>
//     options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Repositories ─────────────────────────────────────────────────────────────
// See docs/adr/001-database-schema.md — Decision 3: Repository pattern.
// TODO (Task 1.3): Register IUserRepository and ITaskRepository here once created.
// builder.Services.AddScoped<IUserRepository, UserRepository>();
// builder.Services.AddScoped<ITaskRepository, TaskRepository>();

// ── Authentication / JWT ──────────────────────────────────────────────────────
// See docs/adr/001-database-schema.md — Decision 4: JWT auth.
// TODO (Task 2.2): Uncomment and configure JWT Bearer once Microsoft.IdentityModel.Tokens is available.
// builder.Services
//     .AddAuthentication("Bearer")
//     .AddJwtBearer(options =>
//     {
//         options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
//         {
//             ValidateIssuer = true,
//             ValidateAudience = true,
//             ValidateLifetime = true,
//             ValidateIssuerSigningKey = true,
//             ValidIssuer = builder.Configuration["Jwt:Issuer"],
//             ValidAudience = builder.Configuration["Jwt:Audience"],
//             IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
//                 System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
//         };
//     });
// builder.Services.AddAuthorization();

// ─────────────────────────────────────────────────────────────────────────────

var app = builder.Build();

// ── Middleware pipeline ───────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// TODO (Task 2.2): Uncomment once authentication is configured.
// app.UseAuthentication();
// app.UseAuthorization();

app.MapControllers();

app.Run();
