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
using TeamTaskAllocator.Models;
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

// ── DELETE /api/tasks/{id} — Delete ──────────────────────────────────────────

public class TasksController_Delete_Tests
{
    // ── Iteration 1: 204 No Content on successful delete ─────────────────────

    [Fact]
    public async Task Delete_returns_204_when_task_is_deleted()
    {
        var service = Substitute.For<ITaskService>();
        service.DeleteAsync(10, 1).Returns(true);

        var result = await ControllerFactory.WithUser(service, userId: 1)
            .Delete(10) as NoContentResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(204);
    }

    // ── Iteration 2: 404 when task does not exist ─────────────────────────────

    [Fact]
    public async Task Delete_returns_404_when_task_does_not_exist()
    {
        var service = Substitute.For<ITaskService>();
        service.DeleteAsync(Arg.Any<int>(), Arg.Any<int>()).Returns(false);

        var result = await ControllerFactory.WithUser(service, userId: 1)
            .Delete(99) as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(404);
    }

    // ── Iteration 3: 403 when manager did not create the task ─────────────────

    [Fact]
    public async Task Delete_returns_403_when_manager_is_not_task_creator()
    {
        var service = Substitute.For<ITaskService>();
        service.DeleteAsync(Arg.Any<int>(), Arg.Any<int>())
            .ThrowsAsync(new UnauthorizedAccessException("Only the manager who created this task can delete it."));

        var result = await ControllerFactory.WithUser(service, userId: 2)
            .Delete(10) as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(403);
    }

    // ── Iteration 4: 401 when JWT has no NameIdentifier claim ─────────────────

    [Fact]
    public async Task Delete_returns_401_when_user_id_claim_is_missing()
    {
        var service = Substitute.For<ITaskService>();

        var result = await ControllerFactory.WithNoUserClaim(service)
            .Delete(10) as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(401);
        await service.DidNotReceive().DeleteAsync(Arg.Any<int>(), Arg.Any<int>());
    }

    // ── Iteration 5: manager id from JWT is forwarded to service ─────────────

    [Fact]
    public async Task Delete_passes_manager_id_from_jwt_claim_to_service()
    {
        var service = Substitute.For<ITaskService>();
        service.DeleteAsync(Arg.Any<int>(), Arg.Any<int>()).Returns(true);

        await ControllerFactory.WithUser(service, userId: 42).Delete(7);

        await service.Received(1).DeleteAsync(7, 42);
    }
}

// ── PATCH /api/tasks/{id}/status — UpdateStatus ──────────────────────────────

public class TasksController_UpdateStatus_Tests
{
    private static UpdateTaskStatusDto Dto(WorkStatus status) => new() { Status = status };

    private static TaskResponseDto ResponseDto(int id = 5, string status = "InProgress") =>
        new() { Id = id, Title = "Fix auth bug", AssigneeId = 3, Status = status };

    // ── Iteration 1: 200 with updated task on Pending → InProgress ────────────

    [Fact]
    public async Task UpdateStatus_returns_200_with_task_dto_on_valid_transition()
    {
        var service = Substitute.For<ITaskService>();
        var expected = ResponseDto(status: "InProgress");
        service.UpdateStatusAsync(5, 3, WorkStatus.InProgress).Returns(expected);

        var result = await ControllerFactory.WithUser(service, userId: 3)
            .UpdateStatus(5, Dto(WorkStatus.InProgress)) as OkObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
        (result.Value as TaskResponseDto)!.Status.Should().Be("InProgress");
    }

    // ── Iteration 2: 200 with updated task on InProgress → Completed ──────────

    [Fact]
    public async Task UpdateStatus_returns_200_when_transitioning_to_Completed()
    {
        var service = Substitute.For<ITaskService>();
        var expected = ResponseDto(status: "Completed");
        service.UpdateStatusAsync(5, 3, WorkStatus.Completed).Returns(expected);

        var result = await ControllerFactory.WithUser(service, userId: 3)
            .UpdateStatus(5, Dto(WorkStatus.Completed)) as OkObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
        (result.Value as TaskResponseDto)!.Status.Should().Be("Completed");
    }

    // ── Iteration 3: 404 when task does not exist ─────────────────────────────

    [Fact]
    public async Task UpdateStatus_returns_404_when_task_does_not_exist()
    {
        var service = Substitute.For<ITaskService>();
        service.UpdateStatusAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<WorkStatus>())
            .Returns((TaskResponseDto?)null);

        var result = await ControllerFactory.WithUser(service, userId: 3)
            .UpdateStatus(99, Dto(WorkStatus.InProgress)) as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(404);
    }

    // ── Iteration 4: 403 when employee is not the assignee ───────────────────

    [Fact]
    public async Task UpdateStatus_returns_403_when_employee_is_not_the_assignee()
    {
        var service = Substitute.For<ITaskService>();
        service.UpdateStatusAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<WorkStatus>())
            .ThrowsAsync(new UnauthorizedAccessException("Only the assigned employee can update this task's status."));

        var result = await ControllerFactory.WithUser(service, userId: 7)
            .UpdateStatus(5, Dto(WorkStatus.InProgress)) as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(403);
    }

    // ── Iteration 5: 400 on invalid status transition ────────────────────────

    [Fact]
    public async Task UpdateStatus_returns_400_on_invalid_status_transition()
    {
        var service = Substitute.For<ITaskService>();
        service.UpdateStatusAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<WorkStatus>())
            .ThrowsAsync(new ArgumentException("Invalid status transition from Pending to Completed."));

        var result = await ControllerFactory.WithUser(service, userId: 3)
            .UpdateStatus(5, Dto(WorkStatus.Completed)) as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(400);
    }

    // ── Iteration 6: 401 when JWT has no NameIdentifier claim ────────────────

    [Fact]
    public async Task UpdateStatus_returns_401_when_user_id_claim_is_missing()
    {
        var service = Substitute.For<ITaskService>();

        var result = await ControllerFactory.WithNoUserClaim(service)
            .UpdateStatus(5, Dto(WorkStatus.InProgress)) as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(401);
        await service.DidNotReceive()
            .UpdateStatusAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<WorkStatus>());
    }

    // ── Iteration 7: user id from JWT is forwarded to service ────────────────

    [Fact]
    public async Task UpdateStatus_passes_user_id_from_jwt_claim_to_service()
    {
        var service = Substitute.For<ITaskService>();
        service.UpdateStatusAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<WorkStatus>())
            .Returns(ResponseDto());

        await ControllerFactory.WithUser(service, userId: 3).UpdateStatus(5, Dto(WorkStatus.InProgress));

        await service.Received(1).UpdateStatusAsync(5, 3, WorkStatus.InProgress);
    }

    // ── Iteration 8: ValidationProblem returned when ModelState is invalid ────

    [Fact]
    public async Task UpdateStatus_returns_ValidationProblemDetails_and_skips_service_when_model_is_invalid()
    {
        var service = Substitute.For<ITaskService>();
        var controller = ControllerFactory.WithUser(service, userId: 3);
        controller.ModelState.AddModelError("Status", "The Status field is required.");

        var result = await controller.UpdateStatus(5, new UpdateTaskStatusDto()) as ObjectResult;

        result.Should().NotBeNull();
        result!.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ValidationProblemDetails>();
        await service.DidNotReceive()
            .UpdateStatusAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<WorkStatus>());
    }

    // ── Iteration 9: response body Status field is a string, not an integer ───

    [Fact]
    public async Task UpdateStatus_response_status_field_is_a_string()
    {
        var service = Substitute.For<ITaskService>();
        service.UpdateStatusAsync(5, 3, WorkStatus.InProgress)
            .Returns(ResponseDto(status: "InProgress"));

        var result = await ControllerFactory.WithUser(service, userId: 3)
            .UpdateStatus(5, Dto(WorkStatus.InProgress)) as OkObjectResult;

        var dto = result!.Value as TaskResponseDto;
        dto!.Status.Should().BeOfType<string>();
        dto.Status.Should().Be("InProgress");
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
