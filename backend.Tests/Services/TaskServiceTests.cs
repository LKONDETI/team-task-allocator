// TDD: These tests were written BEFORE GetByManagerAsync existed.
// The compile error IS the Red — it tells us exactly what to add to the interfaces.

using FluentAssertions;
using NSubstitute;
using TeamTaskAllocator.DTOs;
using TeamTaskAllocator.Models;
using TeamTaskAllocator.Repositories;
using TeamTaskAllocator.Services;

namespace TeamTaskAllocator.Tests.Services;

// ── shared helpers ────────────────────────────────────────────────────────────

file static class Fixtures
{
    public static User Employee(int id = 2, string name = "Alice Employee") =>
        new() { Id = id, Name = name, Email = $"user{id}@example.com", PasswordHash = "x", Role = "employee" };

    public static User Manager(int id = 1, string name = "Bob Manager") =>
        new() { Id = id, Name = name, Email = $"mgr{id}@example.com", PasswordHash = "x", Role = "manager" };

    public static TaskEntity Task(int id, User assignee, User manager, string title = "A task") =>
        new()
        {
            Id = id,
            Title = title,
            Description = "desc",
            AssigneeId = assignee.Id,
            Assignee = assignee,
            ManagerId = manager.Id,
            Manager = manager,
            Deadline = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
}

// ── CreateAsync ───────────────────────────────────────────────────────────────

public class TaskService_CreateAsync_Tests
{
    private readonly ITaskRepository _taskRepo = Substitute.For<ITaskRepository>();
    private readonly IUserRepository _userRepo = Substitute.For<IUserRepository>();

    private TaskService CreateSut() => new(_taskRepo, _userRepo);

    private CreateTaskDto MakeDto(int assigneeId = 2) => new()
    {
        Title = "Build login page",
        Description = "Implement the login screen",
        AssigneeId = assigneeId,
        Deadline = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc)
    };

    // ── Iteration 1: throws when assignee not found ───────────────────────────

    [Fact]
    public async Task CreateAsync_throws_when_assignee_does_not_exist()
    {
        _userRepo.GetByIdAsync(99).Returns((User?)null);
        var sut = CreateSut();

        var act = () => sut.CreateAsync(MakeDto(assigneeId: 99), managerId: 1);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*99*");
    }

    // ── Iteration 2: throws when assignee exists but is not an employee ───────

    [Fact]
    public async Task CreateAsync_throws_when_assignee_is_a_manager()
    {
        var notEmployee = Fixtures.Manager(id: 5);
        _userRepo.GetByIdAsync(5).Returns(notEmployee);
        var sut = CreateSut();

        var act = () => sut.CreateAsync(MakeDto(assigneeId: 5), managerId: 1);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*5*");
    }

    // ── Iteration 3: throws when manager not found ────────────────────────────

    [Fact]
    public async Task CreateAsync_throws_when_manager_does_not_exist()
    {
        var employee = Fixtures.Employee();
        _userRepo.GetByIdAsync(employee.Id).Returns(employee);
        _userRepo.GetByIdAsync(999).Returns((User?)null);
        var sut = CreateSut();

        var act = () => sut.CreateAsync(MakeDto(assigneeId: employee.Id), managerId: 999);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*999*");
    }

    // ── Iteration 4: persists task via repository ─────────────────────────────

    [Fact]
    public async Task CreateAsync_calls_repository_CreateAsync_once()
    {
        var employee = Fixtures.Employee();
        var manager = Fixtures.Manager();
        _userRepo.GetByIdAsync(employee.Id).Returns(employee);
        _userRepo.GetByIdAsync(manager.Id).Returns(manager);
        _taskRepo.CreateAsync(Arg.Any<TaskEntity>())
            .Returns(c => c.Arg<TaskEntity>());   // echo the entity back
        var sut = CreateSut();

        await sut.CreateAsync(MakeDto(assigneeId: employee.Id), managerId: manager.Id);

        await _taskRepo.Received(1).CreateAsync(Arg.Any<TaskEntity>());
    }

    // ── Iteration 5: ManagerId comes from JWT param, not DTO ─────────────────

    [Fact]
    public async Task CreateAsync_sets_ManagerId_from_parameter_not_dto()
    {
        var employee = Fixtures.Employee();
        var manager = Fixtures.Manager(id: 7);
        _userRepo.GetByIdAsync(employee.Id).Returns(employee);
        _userRepo.GetByIdAsync(7).Returns(manager);

        TaskEntity? captured = null;
        _taskRepo.CreateAsync(Arg.Do<TaskEntity>(t => captured = t))
            .Returns(c => c.Arg<TaskEntity>());

        await CreateSut().CreateAsync(MakeDto(assigneeId: employee.Id), managerId: 7);

        captured!.ManagerId.Should().Be(7);
    }

    // ── Iteration 6: deadline is stored as UTC ────────────────────────────────

    [Fact]
    public async Task CreateAsync_converts_deadline_to_utc()
    {
        var employee = Fixtures.Employee();
        var manager = Fixtures.Manager();
        _userRepo.GetByIdAsync(employee.Id).Returns(employee);
        _userRepo.GetByIdAsync(manager.Id).Returns(manager);

        TaskEntity? captured = null;
        _taskRepo.CreateAsync(Arg.Do<TaskEntity>(t => captured = t))
            .Returns(c => c.Arg<TaskEntity>());

        var dto = MakeDto();
        await CreateSut().CreateAsync(dto, manager.Id);

        captured!.Deadline.Kind.Should().Be(DateTimeKind.Utc);
    }

    // ── Iteration 7: returned DTO maps all fields correctly ───────────────────

    [Fact]
    public async Task CreateAsync_returns_dto_with_correct_fields()
    {
        var employee = Fixtures.Employee(id: 2, name: "Alice Employee");
        var manager = Fixtures.Manager(id: 1, name: "Bob Manager");
        _userRepo.GetByIdAsync(employee.Id).Returns(employee);
        _userRepo.GetByIdAsync(manager.Id).Returns(manager);

        var savedEntity = Fixtures.Task(id: 42, assignee: employee, manager: manager);
        _taskRepo.CreateAsync(Arg.Any<TaskEntity>()).Returns(savedEntity);

        var result = await CreateSut().CreateAsync(MakeDto(assigneeId: employee.Id), managerId: manager.Id);

        result.Id.Should().Be(42);
        result.Title.Should().Be("A task");
        result.AssigneeId.Should().Be(employee.Id);
        result.AssigneeName.Should().Be("Alice Employee");
        result.ManagerId.Should().Be(manager.Id);
        result.ManagerName.Should().Be("Bob Manager");
    }
}

// ── GetByAssigneeAsync ────────────────────────────────────────────────────────

public class TaskService_GetByAssigneeAsync_Tests
{
    private readonly ITaskRepository _taskRepo = Substitute.For<ITaskRepository>();
    private readonly IUserRepository _userRepo = Substitute.For<IUserRepository>();

    private TaskService CreateSut() => new(_taskRepo, _userRepo);

    // ── Iteration 1: empty result ─────────────────────────────────────────────

    [Fact]
    public async Task GetByAssigneeAsync_returns_empty_when_employee_has_no_tasks()
    {
        _taskRepo.GetByAssigneeIdAsync(5).Returns(Enumerable.Empty<TaskEntity>());

        var result = await CreateSut().GetByAssigneeAsync(5);

        result.Should().BeEmpty();
    }

    // ── Iteration 2: maps task fields into DTO ────────────────────────────────

    [Fact]
    public async Task GetByAssigneeAsync_maps_task_to_dto_with_assignee_and_manager_names()
    {
        var employee = Fixtures.Employee(id: 3, name: "Carol Worker");
        var manager = Fixtures.Manager(id: 1, name: "Dave Lead");
        var task = Fixtures.Task(id: 20, assignee: employee, manager: manager, title: "Fix bug");

        _taskRepo.GetByAssigneeIdAsync(3).Returns([task]);

        var result = (await CreateSut().GetByAssigneeAsync(3)).ToList();

        result.Should().HaveCount(1);
        result[0].Id.Should().Be(20);
        result[0].Title.Should().Be("Fix bug");
        result[0].AssigneeName.Should().Be("Carol Worker");
        result[0].ManagerName.Should().Be("Dave Lead");
    }

    // ── Iteration 3: returns multiple tasks ───────────────────────────────────

    [Fact]
    public async Task GetByAssigneeAsync_returns_all_tasks_for_the_assignee()
    {
        var employee = Fixtures.Employee();
        var manager = Fixtures.Manager();
        var tasks = new[]
        {
            Fixtures.Task(id: 1, assignee: employee, manager: manager, title: "Task A"),
            Fixtures.Task(id: 2, assignee: employee, manager: manager, title: "Task B"),
        };

        _taskRepo.GetByAssigneeIdAsync(employee.Id).Returns(tasks);

        var result = (await CreateSut().GetByAssigneeAsync(employee.Id)).ToList();

        result.Should().HaveCount(2);
        result.Select(r => r.Title).Should().BeEquivalentTo(["Task A", "Task B"]);
    }

    // ── Iteration 4: assignee with null nav property falls back to empty string

    [Fact]
    public async Task GetByAssigneeAsync_uses_empty_string_when_nav_property_is_null()
    {
        var task = new TaskEntity
        {
            Id = 99, Title = "Orphan task", Description = "x",
            AssigneeId = 5, Assignee = null!,
            ManagerId = 1,  Manager = null!,
            Deadline = DateTime.UtcNow.AddDays(3)
        };

        _taskRepo.GetByAssigneeIdAsync(5).Returns([task]);

        var result = (await CreateSut().GetByAssigneeAsync(5)).ToList();

        result[0].AssigneeName.Should().BeEmpty();
        result[0].ManagerName.Should().BeEmpty();
    }
}

// ── GetByManagerAsync ─────────────────────────────────────────────────────────

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
