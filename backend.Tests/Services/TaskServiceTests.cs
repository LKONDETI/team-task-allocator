// TDD: These tests were written BEFORE GetByManagerAsync existed.
// The compile error IS the Red — it tells us exactly what to add to the interfaces.

using FluentAssertions;
using NSubstitute;
using TeamTaskAllocator.Models;
using TeamTaskAllocator.Repositories;
using TeamTaskAllocator.Services;

namespace TeamTaskAllocator.Tests.Services;

public class TaskServiceGetByManagerTests
{
    private readonly ITaskRepository _taskRepo = Substitute.For<ITaskRepository>();
    private readonly IUserRepository _userRepo = Substitute.For<IUserRepository>();

    private TaskService CreateSut() => new(_taskRepo, _userRepo);

    // -------------------------------------------------------------------------
    // Iteration 1: empty result
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Returns_empty_list_when_manager_has_no_tasks()
    {
        _taskRepo.GetByManagerIdAsync(99).Returns(Enumerable.Empty<TaskEntity>());

        var result = await CreateSut().GetByManagerAsync(99);

        result.Should().BeEmpty();
    }

    // -------------------------------------------------------------------------
    // Iteration 2: correct tasks returned and mapped to DTOs
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Returns_tasks_belonging_to_the_given_manager()
    {
        var manager = new User { Id = 1, Name = "Bob Manager", Role = "manager" };
        var assignee = new User { Id = 2, Name = "Alice Employee", Role = "employee" };

        var task = new TaskEntity
        {
            Id = 10,
            Title = "Build login page",
            Description = "Implement the login screen",
            AssigneeId = assignee.Id,
            Assignee = assignee,
            ManagerId = manager.Id,
            Manager = manager,
            Deadline = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _taskRepo.GetByManagerIdAsync(1).Returns(new[] { task });

        var result = (await CreateSut().GetByManagerAsync(1)).ToList();

        result.Should().HaveCount(1);
        result[0].Id.Should().Be(10);
        result[0].Title.Should().Be("Build login page");
        result[0].AssigneeName.Should().Be("Alice Employee");
        result[0].ManagerName.Should().Be("Bob Manager");
        result[0].ManagerId.Should().Be(1);
    }

    // -------------------------------------------------------------------------
    // Iteration 3: only returns tasks for the requested manager, not others
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Does_not_return_tasks_belonging_to_a_different_manager()
    {
        // Repo for manager 1 returns one task; manager 2 returns nothing
        _taskRepo.GetByManagerIdAsync(1).Returns(new[]
        {
            new TaskEntity
            {
                Id = 10, Title = "Manager 1 task",
                Assignee = new User { Name = "Alice" },
                Manager = new User { Name = "Bob" }
            }
        });
        _taskRepo.GetByManagerIdAsync(2).Returns(Enumerable.Empty<TaskEntity>());

        var resultForManager2 = await CreateSut().GetByManagerAsync(2);

        resultForManager2.Should().BeEmpty();
    }
}
