// TDD: Written BEFORE GetManagerTasks existed on TasksController.
// The compile error is the Red — it tells us what action to add.

using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using TeamTaskAllocator.Controllers;
using TeamTaskAllocator.DTOs;
using TeamTaskAllocator.Services;

namespace TeamTaskAllocator.Tests.Controllers;

// ── shared factory ────────────────────────────────────────────────────────────

file static class ControllerFactory
{
    public static TasksController WithUser(ITaskService service, int userId)
    {
        var controller = new TasksController(service);
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) };
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"))
            }
        };
        return controller;
    }

    public static TasksController WithNoUserClaim(ITaskService service)
    {
        var controller = new TasksController(service);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity()) // no claims
            }
        };
        return controller;
    }
}

// ── POST /api/tasks — Create ──────────────────────────────────────────────────

public class TasksController_Create_Tests
{
    private static CreateTaskDto ValidDto() => new()
    {
        Title = "Build login page",
        Description = "Implement the login screen",
        AssigneeId = 2,
        Deadline = DateTime.UtcNow.AddDays(7)
    };

    // ── Iteration 1: 201 on success ───────────────────────────────────────────

    [Fact]
    public async Task Create_returns_201_with_task_dto_on_success()
    {
        var service = Substitute.For<ITaskService>();
        var created = new TaskResponseDto { Id = 10, Title = "Build login page" };
        service.CreateAsync(Arg.Any<CreateTaskDto>(), 1).Returns(created);

        var result = await ControllerFactory.WithUser(service, userId: 1)
            .Create(ValidDto()) as CreatedAtActionResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(201);
        (result.Value as TaskResponseDto)!.Id.Should().Be(10);
    }

    // ── Iteration 2: 400 when service throws ArgumentException ───────────────

    [Fact]
    public async Task Create_returns_400_when_service_throws_ArgumentException()
    {
        var service = Substitute.For<ITaskService>();
        service.CreateAsync(Arg.Any<CreateTaskDto>(), Arg.Any<int>())
            .ThrowsAsync(new ArgumentException("AssigneeId 99 does not refer to a valid employee."));

        var result = await ControllerFactory.WithUser(service, userId: 1)
            .Create(ValidDto()) as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(400);
    }

    // ── Iteration 3: ValidationProblem returned when ModelState is invalid ───────
    // Note: ValidationProblem() populates Status via middleware, not on the object
    // itself in unit test context, so we assert on the result type and that the
    // service is never reached — not on a specific status code integer.

    [Fact]
    public async Task Create_returns_ValidationProblemDetails_and_skips_service_when_model_is_invalid()
    {
        var service = Substitute.For<ITaskService>();
        var controller = ControllerFactory.WithUser(service, userId: 1);
        controller.ModelState.AddModelError("Title", "The Title field is required.");

        var result = await controller.Create(new CreateTaskDto()) as ObjectResult;

        result.Should().NotBeNull();
        result!.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ValidationProblemDetails>();
        await service.DidNotReceive().CreateAsync(Arg.Any<CreateTaskDto>(), Arg.Any<int>());
    }

    // ── Iteration 4: 401 when JWT has no NameIdentifier claim ────────────────

    [Fact]
    public async Task Create_returns_401_when_user_id_claim_is_missing()
    {
        var service = Substitute.For<ITaskService>();

        var result = await ControllerFactory.WithNoUserClaim(service)
            .Create(ValidDto()) as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(401);
        await service.DidNotReceive().CreateAsync(Arg.Any<CreateTaskDto>(), Arg.Any<int>());
    }

    // ── Iteration 5: managerId always from JWT claim, never from DTO ─────────

    [Fact]
    public async Task Create_passes_manager_id_from_jwt_claim_to_service()
    {
        var service = Substitute.For<ITaskService>();
        service.CreateAsync(Arg.Any<CreateTaskDto>(), Arg.Any<int>())
            .Returns(new TaskResponseDto());

        await ControllerFactory.WithUser(service, userId: 42).Create(ValidDto());

        await service.Received(1).CreateAsync(Arg.Any<CreateTaskDto>(), 42);
    }
}

// ── GET /api/tasks/my — GetMyTasks ────────────────────────────────────────────

public class TasksController_GetMyTasks_Tests
{
    // ── Iteration 1: 200 with tasks list ─────────────────────────────────────

    [Fact]
    public async Task GetMyTasks_returns_200_with_assigned_tasks()
    {
        var service = Substitute.For<ITaskService>();
        var tasks = new List<TaskResponseDto>
        {
            new() { Id = 5, Title = "Fix auth bug", AssigneeId = 3 }
        };
        service.GetByAssigneeAsync(3).Returns(tasks);

        var result = await ControllerFactory.WithUser(service, userId: 3)
            .GetMyTasks() as OkObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
        var body = result.Value as IEnumerable<TaskResponseDto>;
        body.Should().HaveCount(1);
        body!.First().Title.Should().Be("Fix auth bug");
    }

    // ── Iteration 2: 200 with empty list when no tasks ────────────────────────

    [Fact]
    public async Task GetMyTasks_returns_200_with_empty_list_when_no_tasks_assigned()
    {
        var service = Substitute.For<ITaskService>();
        service.GetByAssigneeAsync(Arg.Any<int>()).Returns(Enumerable.Empty<TaskResponseDto>());

        var result = await ControllerFactory.WithUser(service, userId: 3)
            .GetMyTasks() as OkObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
        (result.Value as IEnumerable<TaskResponseDto>).Should().BeEmpty();
    }

    // ── Iteration 3: 401 when JWT has no NameIdentifier claim ────────────────

    [Fact]
    public async Task GetMyTasks_returns_401_when_user_id_claim_is_missing()
    {
        var service = Substitute.For<ITaskService>();

        var result = await ControllerFactory.WithNoUserClaim(service)
            .GetMyTasks() as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(401);
        await service.DidNotReceive().GetByAssigneeAsync(Arg.Any<int>());
    }

    // ── Iteration 4: userId from JWT claim is forwarded to service ────────────

    [Fact]
    public async Task GetMyTasks_passes_user_id_from_jwt_claim_to_service()
    {
        var service = Substitute.For<ITaskService>();
        service.GetByAssigneeAsync(Arg.Any<int>()).Returns(Enumerable.Empty<TaskResponseDto>());

        await ControllerFactory.WithUser(service, userId: 11).GetMyTasks();

        await service.Received(1).GetByAssigneeAsync(11);
    }
}

// ── GET /api/tasks — GetManagerTasks ─────────────────────────────────────────

public class TasksControllerGetManagerTasksTests
{
    // Helper: create a controller with an authenticated manager identity
    private static TasksController CreateSut(ITaskService service, int managerId)
    {
        var controller = new TasksController(service);
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, managerId.ToString()) };
        var identity = new ClaimsIdentity(claims, "Test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity)
            }
        };
        return controller;
    }

    [Fact]
    public async Task Returns_200_with_the_managers_tasks()
    {
        var service = Substitute.For<ITaskService>();
        var tasks = new List<TaskResponseDto>
        {
            new() { Id = 1, Title = "Build login page", ManagerId = 5 }
        };
        service.GetByManagerAsync(5).Returns(tasks);

        var result = await CreateSut(service, managerId: 5).GetManagerTasks() as OkObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
        var body = result.Value as IEnumerable<TaskResponseDto>;
        body.Should().HaveCount(1);
        body!.First().Title.Should().Be("Build login page");
    }

    [Fact]
    public async Task Returns_200_with_empty_list_when_manager_has_no_tasks()
    {
        var service = Substitute.For<ITaskService>();
        service.GetByManagerAsync(3).Returns(Enumerable.Empty<TaskResponseDto>());

        var result = await CreateSut(service, managerId: 3).GetManagerTasks() as OkObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
        var body = result.Value as IEnumerable<TaskResponseDto>;
        body.Should().BeEmpty();
    }

    [Fact]
    public async Task Passes_the_manager_id_from_the_jwt_claim_to_the_service()
    {
        var service = Substitute.For<ITaskService>();
        service.GetByManagerAsync(Arg.Any<int>()).Returns(Enumerable.Empty<TaskResponseDto>());

        await CreateSut(service, managerId: 7).GetManagerTasks();

        await service.Received(1).GetByManagerAsync(7);
    }
}
