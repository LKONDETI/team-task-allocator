// TDD: These tests were written BEFORE running the implementation.
// Red → Green → Refactor for each iteration.
// BCrypt.Verify is a static call — we supply a real hash in test data so the full
// hash-verify path executes without any mocking.

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NSubstitute;
using TeamTaskAllocator.DTOs;
using TeamTaskAllocator.Models;
using TeamTaskAllocator.Repositories;
using TeamTaskAllocator.Services;

namespace TeamTaskAllocator.Tests.Services;

public class AuthServiceTests
{
    // ── helpers ──────────────────────────────────────────────────────────────

    private const string PlainPassword = "SecurePass123!";
    private static readonly string HashedPassword = BCrypt.Net.BCrypt.HashPassword(PlainPassword);

    private readonly IUserRepository _userRepo = Substitute.For<IUserRepository>();
    private readonly IConfiguration _config = Substitute.For<IConfiguration>();

    private AuthService CreateSut()
    {
        _config["Jwt:Secret"].Returns("super-secret-key-for-unit-tests-32chars");
        _config["Jwt:Issuer"].Returns("test-issuer");
        _config["Jwt:Audience"].Returns("test-audience");
        _config["Jwt:ExpiryHours"].Returns("1");
        return new AuthService(_userRepo, _config);
    }

    private static User MakeUser(string role = "employee") => new()
    {
        Id = 7,
        Name = "Alice Test",
        Email = "alice@example.com",
        PasswordHash = HashedPassword,
        Role = role
    };

    // ── Iteration 1: unknown email ────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_throws_when_email_not_found()
    {
        _userRepo.GetByEmailAsync("nobody@example.com").Returns((User?)null);
        var sut = CreateSut();

        var act = () => sut.LoginAsync(new LoginRequestDto
        {
            Email = "nobody@example.com",
            Password = PlainPassword
        });

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Invalid email or password.");
    }

    // ── Iteration 2: wrong password ───────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_throws_when_password_does_not_match_hash()
    {
        _userRepo.GetByEmailAsync("alice@example.com").Returns(MakeUser());
        var sut = CreateSut();

        var act = () => sut.LoginAsync(new LoginRequestDto
        {
            Email = "alice@example.com",
            Password = "WrongPassword!"
        });

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Invalid email or password.");
    }

    // ── Iteration 3: successful login returns correct DTO fields ─────────────

    [Fact]
    public async Task LoginAsync_returns_correct_dto_on_valid_credentials()
    {
        var user = MakeUser("manager");
        _userRepo.GetByEmailAsync(user.Email).Returns(user);
        var sut = CreateSut();

        var result = await sut.LoginAsync(new LoginRequestDto
        {
            Email = user.Email,
            Password = PlainPassword
        });

        result.UserId.Should().Be(user.Id);
        result.Name.Should().Be(user.Name);
        result.Role.Should().Be(user.Role);
        result.Token.Should().NotBeNullOrWhiteSpace();
    }

    // ── Iteration 4: JWT contains the expected claims ─────────────────────────

    [Fact]
    public async Task LoginAsync_token_contains_userId_name_email_and_role_claims()
    {
        var user = MakeUser("employee");
        _userRepo.GetByEmailAsync(user.Email).Returns(user);
        var sut = CreateSut();

        var result = await sut.LoginAsync(new LoginRequestDto
        {
            Email = user.Email,
            Password = PlainPassword
        });

        var parsed = ParseToken(result.Token);

        parsed.Subject.Should().Be(user.Id.ToString());
        parsed.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Name && c.Value == user.Name);
        parsed.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == user.Email);
        parsed.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == user.Role);
    }

    // ── Iteration 5: JWT uses configured issuer and audience ─────────────────

    [Fact]
    public async Task LoginAsync_token_uses_configured_issuer_and_audience()
    {
        var user = MakeUser();
        _userRepo.GetByEmailAsync(user.Email).Returns(user);
        var sut = CreateSut();

        var result = await sut.LoginAsync(new LoginRequestDto
        {
            Email = user.Email,
            Password = PlainPassword
        });

        var parsed = ParseToken(result.Token);

        parsed.Issuer.Should().Be("test-issuer");
        parsed.Audiences.Should().Contain("test-audience");
    }

    // ── Iteration 6: JWT expiry honours configured hours ─────────────────────

    [Fact]
    public async Task LoginAsync_token_expires_after_configured_hours()
    {
        var user = MakeUser();
        _userRepo.GetByEmailAsync(user.Email).Returns(user);

        // Build service manually so ExpiryHours = 2, not the default 1 from CreateSut()
        var config = Substitute.For<IConfiguration>();
        config["Jwt:Secret"].Returns("super-secret-key-for-unit-tests-32chars");
        config["Jwt:Issuer"].Returns("test-issuer");
        config["Jwt:Audience"].Returns("test-audience");
        config["Jwt:ExpiryHours"].Returns("2");
        var sut = new AuthService(_userRepo, config);

        var before = DateTime.UtcNow.AddHours(2).AddSeconds(-5);
        var after  = DateTime.UtcNow.AddHours(2).AddSeconds(5);

        var result = await sut.LoginAsync(new LoginRequestDto
        {
            Email = user.Email,
            Password = PlainPassword
        });

        var parsed = ParseToken(result.Token);

        parsed.ValidTo.Should().BeAfter(before).And.BeBefore(after);
    }

    // ── private helper ────────────────────────────────────────────────────────

    private static JwtSecurityToken ParseToken(string token)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes("super-secret-key-for-unit-tests-32chars"));

        var parameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };

        new JwtSecurityTokenHandler().ValidateToken(token, parameters, out var validated);
        return (JwtSecurityToken)validated;
    }
}
