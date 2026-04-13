// TDD: These tests were written BEFORE running the implementation.
// Red → Green → Refactor for each iteration.
// UserService has no external dependencies beyond IUserRepository, so all tests
// use a single NSubstitute mock and assert on the returned DTO shape.

using FluentAssertions;
using NSubstitute;
using TeamTaskAllocator.Models;
using TeamTaskAllocator.Repositories;
using TeamTaskAllocator.Services;

namespace TeamTaskAllocator.Tests.Services;

public class UserServiceTests
{
    // ── helpers ──────────────────────────────────────────────────────────────

    private readonly IUserRepository _userRepo = Substitute.For<IUserRepository>();

    private UserService CreateSut() => new(_userRepo);

    private static User MakeUser(int id, string name, string email, string[] skills) => new()
    {
        Id = id,
        Name = name,
        Email = email,
        PasswordHash = "irrelevant",
        Role = "employee",
        Skills = skills
    };

    // ── Iteration 1: empty result when repository returns nothing ────────────

    [Fact]
    public async Task SearchAsync_returns_empty_when_repository_returns_no_users()
    {
        _userRepo.SearchByNameOrSkillAsync("nomatch").Returns([]);
        var sut = CreateSut();

        var result = await sut.SearchAsync("nomatch");

        result.Should().BeEmpty();
    }

    // ── Iteration 2: single match by name ────────────────────────────────────

    [Fact]
    public async Task SearchAsync_maps_single_user_to_correct_dto_fields()
    {
        var user = MakeUser(3, "Alice Smith", "alice@example.com", ["C#", "React"]);
        _userRepo.SearchByNameOrSkillAsync("alice").Returns([user]);
        var sut = CreateSut();

        var result = (await sut.SearchAsync("alice")).ToList();

        result.Should().HaveCount(1);
        result[0].Id.Should().Be(3);
        result[0].Name.Should().Be("Alice Smith");
        result[0].Email.Should().Be("alice@example.com");
        result[0].Skills.Should().BeEquivalentTo(["C#", "React"]);
    }

    // ── Iteration 3: multiple matches returned ────────────────────────────────

    [Fact]
    public async Task SearchAsync_returns_all_users_from_repository()
    {
        var users = new[]
        {
            MakeUser(1, "Alice Smith", "alice@example.com", ["C#"]),
            MakeUser(2, "Bob Smith",   "bob@example.com",   ["Go"]),
        };
        _userRepo.SearchByNameOrSkillAsync("smith").Returns(users);
        var sut = CreateSut();

        var result = (await sut.SearchAsync("smith")).ToList();

        result.Should().HaveCount(2);
        result.Select(r => r.Name).Should().BeEquivalentTo(["Alice Smith", "Bob Smith"]);
    }

    // ── Iteration 4: skills array is preserved exactly ───────────────────────

    [Fact]
    public async Task SearchAsync_maps_skills_array_without_modification()
    {
        var skills = new[] { "TypeScript", "PostgreSQL", "Docker" };
        var user = MakeUser(5, "Carol Dev", "carol@example.com", skills);
        _userRepo.SearchByNameOrSkillAsync("TypeScript").Returns([user]);
        var sut = CreateSut();

        var result = (await sut.SearchAsync("TypeScript")).ToList();

        result[0].Skills.Should().Equal(skills);
    }

    // ── Iteration 5: user with no skills maps to empty array ─────────────────

    [Fact]
    public async Task SearchAsync_maps_user_with_no_skills_to_empty_skills_array()
    {
        var user = MakeUser(8, "Dave Noskill", "dave@example.com", []);
        _userRepo.SearchByNameOrSkillAsync("dave").Returns([user]);
        var sut = CreateSut();

        var result = (await sut.SearchAsync("dave")).ToList();

        result[0].Skills.Should().BeEmpty();
    }

    // ── Iteration 6: query is forwarded to repository unchanged ──────────────

    [Fact]
    public async Task SearchAsync_passes_query_to_repository_unchanged()
    {
        _userRepo.SearchByNameOrSkillAsync(Arg.Any<string>()).Returns([]);
        var sut = CreateSut();

        await sut.SearchAsync("  React  ");

        await _userRepo.Received(1).SearchByNameOrSkillAsync("  React  ");
    }
}
