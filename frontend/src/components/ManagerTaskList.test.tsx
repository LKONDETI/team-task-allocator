import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getTasks } from '../api/tasks';
import ManagerTaskList from './ManagerTaskList';

vi.mock('../api/tasks');
const mockGetTasks = getTasks as Mock;

const TASK_1 = {
  id: 1,
  title: 'Build login page',
  description: 'Implement the login screen',
  assigneeId: 2,
  assigneeName: 'Alice Employee',
  managerId: 5,
  managerName: 'Bob Manager',
  deadline: '2026-06-01T12:00:00Z',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

const TASK_2 = {
  ...TASK_1,
  id: 2,
  title: 'Write unit tests',
  assigneeName: 'Carol Dev',
  deadline: '2026-07-15T00:00:00Z',
};

beforeEach(() => vi.clearAllMocks());

describe('ManagerTaskList — loading state', () => {
  it('shows a loading indicator while the request is in flight', () => {
    mockGetTasks.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ManagerTaskList />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});

describe('ManagerTaskList — task list', () => {
  it('renders title and assignee name for each task', async () => {
    mockGetTasks.mockResolvedValue([TASK_1, TASK_2]);
    render(<ManagerTaskList />);

    expect(await screen.findByText('Build login page')).toBeInTheDocument();
    expect(screen.getByText('Alice Employee')).toBeInTheDocument();
    expect(screen.getByText('Write unit tests')).toBeInTheDocument();
    expect(screen.getByText('Carol Dev')).toBeInTheDocument();
  });

  it('renders a formatted deadline for each task', async () => {
    mockGetTasks.mockResolvedValue([TASK_1]);
    render(<ManagerTaskList />);

    expect(await screen.findByText('Due Jun 1, 2026')).toBeInTheDocument();
  });
});

describe('ManagerTaskList — empty state', () => {
  it('shows an empty state message when there are no tasks', async () => {
    mockGetTasks.mockResolvedValue([]);
    render(<ManagerTaskList />);

    expect(await screen.findByText('No tasks created yet.')).toBeInTheDocument();
  });
});

describe('ManagerTaskList — error state', () => {
  it('shows an error message when getTasks rejects', async () => {
    mockGetTasks.mockRejectedValue(new Error('Network error'));
    render(<ManagerTaskList />);

    expect(await screen.findByText('Failed to load tasks.')).toBeInTheDocument();
  });
});
