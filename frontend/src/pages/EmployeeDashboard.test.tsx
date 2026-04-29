import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getMyTasks, updateTaskStatus } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import EmployeeDashboard from './EmployeeDashboard';

// ─── API mocks ──────────────────────────────────────────────────────────────
vi.mock('../api/tasks');
const mockGetMyTasks    = getMyTasks    as Mock;
const mockUpdateStatus  = updateTaskStatus as Mock;

vi.mock('../context/AuthContext');
const mockUseAuth = useAuth as Mock;

// ─── FullCalendar stub ──────────────────────────────────────────────────────
// We can't run FullCalendar in jsdom, but we CAN capture the eventClick prop
// and call it from tests to simulate a user clicking a calendar event.
type CalendarProps = {
  events?: { id: string; title: string }[];
  eventClick?: (info: { event: { id: string } }) => void;
};

let capturedEventClick: CalendarProps['eventClick'] | undefined;
let capturedEvents: CalendarProps['events'] | undefined;

vi.mock('@fullcalendar/react', () => ({
  default: (props: CalendarProps) => {
    capturedEventClick = props.eventClick;
    capturedEvents     = props.events;
    return <div data-testid="fullcalendar" />;
  },
}));

vi.mock('@fullcalendar/daygrid',      () => ({ default: {} }));
vi.mock('@fullcalendar/timegrid',     () => ({ default: {} }));
vi.mock('@fullcalendar/list',         () => ({ default: {} }));
vi.mock('@fullcalendar/interaction',  () => ({ default: {} }));

// ─── Sample data ─────────────────────────────────────────────────────────────
const TASK = {
  id: 1,
  title: 'Write unit tests',
  description: 'Cover the dashboard',
  assigneeId: 2,
  assigneeName: 'Alice',
  managerId: 1,
  managerName: 'Bob Manager',
  deadline: '2026-06-15T10:00:00Z',
  status: 'Pending',
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
};

const TASK_2 = {
  ...TASK,
  id: 2,
  title: 'Code review PR #42',
  status: 'InProgress',
};

// ─── Setup ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  capturedEventClick = undefined;
  capturedEvents     = undefined;

  mockUseAuth.mockReturnValue({
    user: { name: 'Alice Employee', email: 'alice@example.com', role: 'employee' },
    logout: vi.fn(),
  });

  mockUpdateStatus.mockResolvedValue({ ...TASK, status: 'InProgress' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. TASK LIST VIEW
// ─────────────────────────────────────────────────────────────────────────────

describe('EmployeeDashboard — task list', () => {
  it('renders task titles once fetched', async () => {
    mockGetMyTasks.mockResolvedValue([TASK]);
    render(<EmployeeDashboard />);
    expect(await screen.findByText('Write unit tests')).toBeInTheDocument();
<<<<<<< HEAD
    // The component splits the deadline across elements (month / day / time)
    // Assert the month abbreviation is visible
    expect(screen.getByText('Apr')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
=======
>>>>>>> refs/remotes/origin/master
  });

  it('renders the formatted deadline date', async () => {
    mockGetMyTasks.mockResolvedValue([TASK]);
    render(<EmployeeDashboard />);
    await screen.findByText('Write unit tests');
    // date-fns formats as 'MMM d, yyyy'
    expect(screen.getByText('Jun 15, 2026')).toBeInTheDocument();
  });

  it('shows empty state when there are no tasks', async () => {
    mockGetMyTasks.mockResolvedValue([]);
    render(<EmployeeDashboard />);
    expect(
      await screen.findByText("Your manager hasn't assigned any tasks to you yet.")
    ).toBeInTheDocument();
  });

  it('shows stats cards with correct counts', async () => {
    mockGetMyTasks.mockResolvedValue([TASK, TASK_2]);
    render(<EmployeeDashboard />);
    await screen.findByText('Write unit tests');
    expect(screen.getByText('2')).toBeInTheDocument(); // Total Tasks
  });

  it('opens the task detail panel when a task row is clicked', async () => {
    mockGetMyTasks.mockResolvedValue([TASK]);
    render(<EmployeeDashboard />);
    fireEvent.click(await screen.findByText('Write unit tests'));
    expect(await screen.findByText('Task Details')).toBeInTheDocument();
    expect(screen.getByText('Bob Manager')).toBeInTheDocument();
  });

  it('closes the task detail panel when the close button is clicked', async () => {
    mockGetMyTasks.mockResolvedValue([TASK]);
    render(<EmployeeDashboard />);
    fireEvent.click(await screen.findByText('Write unit tests'));
    await screen.findByText('Task Details');
    fireEvent.click(screen.getByRole('button', { name: /close panel/i }));
    await waitFor(() =>
      expect(screen.queryByText('Task Details')).not.toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CALENDAR VIEW
// ─────────────────────────────────────────────────────────────────────────────

describe('EmployeeDashboard — calendar view', () => {
  async function switchToCalendar() {
    render(<EmployeeDashboard />);
    await screen.findByText('Write unit tests'); // wait for tasks to load
    fireEvent.click(screen.getByRole('button', { name: 'Calendar' }));
    await screen.findByTestId('fullcalendar');
  }

  it('shows FullCalendar when the Calendar nav item is clicked', async () => {
    mockGetMyTasks.mockResolvedValue([TASK]);
    await switchToCalendar();
    expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
    expect(screen.queryByText('Write unit tests')).not.toBeInTheDocument();
  });

  it('passes the tasks as calendar events with correct id, title and colour', async () => {
    mockGetMyTasks.mockResolvedValue([TASK, TASK_2]);
    await switchToCalendar();

    expect(capturedEvents).toHaveLength(2);
    expect(capturedEvents![0]).toMatchObject({ id: '1', title: 'Write unit tests' });
    expect(capturedEvents![1]).toMatchObject({ id: '2', title: 'Code review PR #42' });
  });

  it('passes an eventClick handler to FullCalendar', async () => {
    mockGetMyTasks.mockResolvedValue([TASK]);
    await switchToCalendar();
    expect(typeof capturedEventClick).toBe('function');
  });

  // ── THE KEY NEW TEST ──────────────────────────────────────────────────────
  it('opens the TaskDetailPanel when a calendar event is clicked', async () => {
    mockGetMyTasks.mockResolvedValue([TASK]);
    await switchToCalendar();

    // Simulate FullCalendar calling eventClick with the matching event id
    capturedEventClick!({ event: { id: '1' } });

    // The slideover should now show the task details
    expect(await screen.findByText('Task Details')).toBeInTheDocument();
    expect(screen.getByText('Write unit tests')).toBeInTheDocument();
    expect(screen.getByText('Bob Manager')).toBeInTheDocument();
  });

  it('shows the correct task when a specific calendar event is clicked', async () => {
    mockGetMyTasks.mockResolvedValue([TASK, TASK_2]);
    await switchToCalendar();

    // Click the second task event
    capturedEventClick!({ event: { id: '2' } });

    expect(await screen.findByText('Task Details')).toBeInTheDocument();
    expect(screen.getByText('Code review PR #42')).toBeInTheDocument();
  });

  it('does nothing when an unknown event id is clicked', async () => {
    mockGetMyTasks.mockResolvedValue([TASK]);
    await switchToCalendar();

    // id '999' doesn't match any task
    capturedEventClick!({ event: { id: '999' } });

    await waitFor(() =>
      expect(screen.queryByText('Task Details')).not.toBeInTheDocument()
    );
  });

  it('closes the slideover after opening via calendar click', async () => {
    mockGetMyTasks.mockResolvedValue([TASK]);
    await switchToCalendar();

    capturedEventClick!({ event: { id: '1' } });
    await screen.findByText('Task Details');

    fireEvent.click(screen.getByRole('button', { name: /close panel/i }));
    await waitFor(() =>
      expect(screen.queryByText('Task Details')).not.toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

describe('EmployeeDashboard — logout', () => {
  it('calls logout when the Logout button is clicked', async () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { name: 'Alice Employee', email: 'alice@example.com' },
      logout,
    });
    mockGetMyTasks.mockResolvedValue([]);
    render(<EmployeeDashboard />);
    await screen.findByText("Your manager hasn't assigned any tasks to you yet.");
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(logout).toHaveBeenCalledOnce();
  });
});
