// TDD: Written BEFORE GetManagerTasks existed on TasksController.
// The compile error is the Red — it tells us what action to add.

using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using TeamTaskAllocator.Controllers;
using TeamTaskAllocator.DTOs;
using TeamTaskAllocator.Services;

namespace TeamTaskAllocator.Tests.Controllers;

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
