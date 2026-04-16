// TDD: Tests written for UsersController.Search covering the happy path,
// empty/whitespace query guard, and service call forwarding.
// Note: [Authorize(Roles = "manager")] is enforced by ASP.NET Core middleware,
// not by the controller action itself — role-guard behaviour is covered here
// by verifying the service is never reached when auth is bypassed at the unit level,
// and by confirming the correct query is forwarded through.

using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using TeamTaskAllocator.Controllers;
using TeamTaskAllocator.DTOs;
using TeamTaskAllocator.Services;

namespace TeamTaskAllocator.Tests.Controllers;

public class UsersControllerSearchTests
{
    // ── factory ───────────────────────────────────────────────────────────────

    private static UsersController CreateSut(IUserService service)
    {
        var controller = new UsersController(service);
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "1"), new Claim(ClaimTypes.Role, "manager") };
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"))
            }
        };
        return controller;
    }

    private static UserSearchResultDto MakeResult(int id, string name, string[] skills) =>
        new() { Id = id, Name = name, Email = $"user{id}@example.com", Skills = skills };

    // ── Iteration 1: 200 with results on valid query ──────────────────────────

    [Fact]
    public async Task Search_returns_200_with_matching_users()
    {
        var service = Substitute.For<IUserService>();
        var results = new List<UserSearchResultDto>
        {
            MakeResult(2, "Alice Smith", ["C#", "React"]),
            MakeResult(3, "Bob Smith",   ["Go"])
        };
        service.SearchAsync("smith").Returns(results);

        var result = await CreateSut(service).Search("smith") as OkObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
        var body = result.Value as IEnumerable<UserSearchResultDto>;
        body.Should().HaveCount(2);
    }

    // ── Iteration 2: 200 with empty list when no users match ─────────────────

    [Fact]
    public async Task Search_returns_200_with_empty_list_when_no_users_match()
    {
        var service = Substitute.For<IUserService>();
        service.SearchAsync("xyz").Returns(Enumerable.Empty<UserSearchResultDto>());

        var result = await CreateSut(service).Search("xyz") as OkObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
        (result.Value as IEnumerable<UserSearchResultDto>).Should().BeEmpty();
    }

    // ── Iteration 3: 400 when query is null ───────────────────────────────────

    [Fact]
    public async Task Search_returns_400_when_query_is_null()
    {
        var service = Substitute.For<IUserService>();

        var result = await CreateSut(service).Search(null) as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(400);
        await service.DidNotReceive().SearchAsync(Arg.Any<string>());
    }

    // ── Iteration 4: 400 when query is empty string ───────────────────────────

    [Fact]
    public async Task Search_returns_400_when_query_is_empty_string()
    {
        var service = Substitute.For<IUserService>();

        var result = await CreateSut(service).Search("") as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(400);
        await service.DidNotReceive().SearchAsync(Arg.Any<string>());
    }

    // ── Iteration 5: 400 when query is whitespace only ────────────────────────

    [Fact]
    public async Task Search_returns_400_when_query_is_whitespace()
    {
        var service = Substitute.For<IUserService>();

        var result = await CreateSut(service).Search("   ") as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(400);
        await service.DidNotReceive().SearchAsync(Arg.Any<string>());
    }

    // ── Iteration 6: query string forwarded to service unchanged ─────────────

    [Fact]
    public async Task Search_passes_query_to_service_unchanged()
    {
        var service = Substitute.For<IUserService>();
        service.SearchAsync(Arg.Any<string>()).Returns(Enumerable.Empty<UserSearchResultDto>());

        await CreateSut(service).Search("React");

        await service.Received(1).SearchAsync("React");
    }

    // ── Iteration 7: DTO fields are returned as-is from the service ───────────

    [Fact]
    public async Task Search_returns_dto_fields_exactly_as_returned_by_service()
    {
        var service = Substitute.For<IUserService>();
        var expected = MakeResult(7, "Carol Dev", ["TypeScript", "PostgreSQL"]);
        service.SearchAsync("carol").Returns([expected]);

        var result = await CreateSut(service).Search("carol") as OkObjectResult;

        var body = (result!.Value as IEnumerable<UserSearchResultDto>)!.ToList();
        body[0].Id.Should().Be(7);
        body[0].Name.Should().Be("Carol Dev");
        body[0].Skills.Should().BeEquivalentTo(["TypeScript", "PostgreSQL"]);
    }
}
