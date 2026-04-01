import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { getMyTasks } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import EmployeeDashboard from './EmployeeDashboard';

// Mock the API module so no real HTTP calls are made
vi.mock('../api/tasks');
const mockGetMyTasks = getMyTasks as Mock;

// Mock AuthContext so the component has a user without needing a real provider
vi.mock('../context/AuthContext');
const mockUseAuth = useAuth as Mock;

// FullCalendar does not work inside jsdom — stub it with a lightweight sentinel
vi.mock('@fullcalendar/react', () => ({
  default: () => <div data-testid="fullcalendar" />,
}));

// @fullcalendar/daygrid is imported for its plugin object — return an empty stub
vi.mock('@fullcalendar/daygrid', () => ({
  default: {},
}));

beforeEach(() => {
  mockUseAuth.mockReturnValue({
    user: { name: 'Alice' },
    logout: vi.fn(),
  });
});

describe('EmployeeDashboard', () => {
  it('renders task titles and formatted due dates in the default list view', async () => {
    mockGetMyTasks.mockResolvedValue([
      {
        id: 1,
        title: 'Write unit tests',
        description: 'Cover the dashboard',
        assigneeId: 2,
        assigneeName: 'Alice',
        managerId: 1,
        managerName: 'Bob',
        deadline: '2026-04-15T10:00:00Z',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      },
    ]);

    render(<EmployeeDashboard />);

    // Wait for the async fetch to resolve and the task to appear
    expect(await screen.findByText('Write unit tests')).toBeInTheDocument();
    // date-fns formats the deadline as 'MMM d, yyyy' — assert the exact output
    expect(screen.getByText('Due Apr 15, 2026')).toBeInTheDocument();
  });

  it('hides the list and shows FullCalendar when the Calendar button is clicked', async () => {
    mockGetMyTasks.mockResolvedValue([
      {
        id: 1,
        title: 'Write unit tests',
        description: 'Cover the dashboard',
        assigneeId: 2,
        assigneeName: 'Alice',
        managerId: 1,
        managerName: 'Bob',
        deadline: '2026-04-15T10:00:00Z',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      },
    ]);

    render(<EmployeeDashboard />);

    // Wait for loading to finish before interacting
    await screen.findByText('Write unit tests');

    // Switch to calendar view
    fireEvent.click(screen.getByRole('button', { name: 'Calendar' }));

    // List item should be gone; FullCalendar stub should be present
    expect(screen.queryByText('Write unit tests')).not.toBeInTheDocument();
    expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
  });

  it('shows the empty-state message when no tasks are assigned', async () => {
    mockGetMyTasks.mockResolvedValue([]);

    render(<EmployeeDashboard />);

    expect(
      await screen.findByText('No tasks assigned to you yet.')
    ).toBeInTheDocument();
  });
});
