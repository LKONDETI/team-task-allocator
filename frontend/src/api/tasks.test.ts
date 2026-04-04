import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import client from './client';
import { createTask, getMyTasks, getTasks } from './tasks';
import type { CreateTaskRequest } from '../types/task';

vi.mock('./client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockPost = client.post as Mock;
const mockGet = client.get as Mock;

beforeEach(() => vi.clearAllMocks());

describe('createTask', () => {
  it('calls POST /tasks and returns the created task', async () => {
    const dto: CreateTaskRequest = {
      title: 'Build login page',
      description: 'Implement the login screen',
      assigneeId: 2,
      deadline: '2026-06-01T00:00:00Z',
    };
    const created = { id: 1, ...dto };
    mockPost.mockResolvedValue({ data: created });

    const result = await createTask(dto);

    expect(mockPost).toHaveBeenCalledWith('/tasks', dto);
    expect(result).toEqual(created);
  });
});

describe('getMyTasks', () => {
  it('calls GET /tasks/my and returns the list', async () => {
    const tasks = [{ id: 1, title: 'Fix bug' }];
    mockGet.mockResolvedValue({ data: tasks });

    const result = await getMyTasks();

    expect(mockGet).toHaveBeenCalledWith('/tasks/my');
    expect(result).toEqual(tasks);
  });
});

describe('getTasks', () => {
  it('calls GET /tasks and returns the list', async () => {
    const tasks = [{ id: 1, title: 'Build login page', assigneeName: 'Alice' }];
    mockGet.mockResolvedValue({ data: tasks });

    const result = await getTasks();

    expect(mockGet).toHaveBeenCalledWith('/tasks');
    expect(result).toEqual(tasks);
  });

  it('returns an empty array when the manager has no tasks', async () => {
    mockGet.mockResolvedValue({ data: [] });

    const result = await getTasks();

    expect(result).toEqual([]);
  });
});
