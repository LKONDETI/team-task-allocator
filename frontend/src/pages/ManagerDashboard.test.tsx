import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTask, getTasks } from '../api/tasks';
import { searchUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import ManagerDashboard from './ManagerDashboard';

// Mock API modules — no real HTTP calls
vi.mock('../api/tasks');
const mockCreateTask = createTask as Mock;
const mockGetTasks   = getTasks   as Mock;

vi.mock('../api/users');
const mockSearchUsers = searchUsers as Mock;

vi.mock('../context/AuthContext');
const mockUseAuth = useAuth as Mock;

const MANAGER_USER = {
  userId: '1',
  name: 'Alice Manager',
  email: 'alice.manager@example.com',
  role: 'manager' as const,
};

const EMPLOYEE: import('../types/user').UserSearchResult = {
  id: 3,
  name: 'Carol Employee',
  email: 'carol@example.com',
  skills: ['React', 'TypeScript'],
};

const SAMPLE_TASK: import('../types/task').Task = {
  id: 10,
  title: 'Review Q2 Report',
  description: 'Please review and give feedback',
  assigneeId: 3,
  assigneeName: 'Carol Employee',
  managerId: 1,
  managerName: 'Alice Manager',
  deadline: '2026-06-15T09:00:00Z',
  status: 'Pending',
  createdAt: '2026-04-24T00:00:00Z',
  updatedAt: '2026-04-24T00:00:00Z',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function renderDashboard() {
  return render(<ManagerDashboard />);
}

async function openModal() {
  fireEvent.click(screen.getByRole('button', { name: /assign new task/i }));
}

async function selectEmployee() {
  mockSearchUsers.mockResolvedValue([EMPLOYEE]);
  const searchInput = screen.getByPlaceholderText('Search by name…');
  await userEvent.type(searchInput, 'carol');
  fireEvent.click(await screen.findByText('Carol Employee'));
}

function fillDeadline(date = '2026-06-15', time = '09:00') {
  fireEvent.change(document.querySelector('#task-deadline-date') as HTMLInputElement, {
    target: { value: date },
  });
  fireEvent.change(document.querySelector('#task-deadline-time') as HTMLInputElement, {
    target: { value: time },
  });
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: MANAGER_USER, logout: vi.fn() });
  mockGetTasks.mockResolvedValue([]);
  mockSearchUsers.mockResolvedValue([]);
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. RENDERING
// ─────────────────────────────────────────────────────────────────────────────

describe('ManagerDashboard — rendering', () => {
  it('renders the Dashboard page title', () => {
    renderDashboard();
    // 'Dashboard' appears in both the h1 and the sidebar nav button
    const all = screen.getAllByText('Dashboard');
    expect(all.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the manager name in the top bar', () => {
    renderDashboard();
    expect(screen.getByText('Alice Manager')).toBeInTheDocument();
  });

  it('renders the "Manager" role label', () => {
    renderDashboard();
    expect(screen.getByText('Manager')).toBeInTheDocument();
  });

  it('renders the "+ Assign New Task" button in the topbar', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /assign new task/i })).toBeInTheDocument();
  });

  it('renders stat cards on the dashboard', async () => {
    renderDashboard();
    expect(await screen.findByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders the sidebar navigation items', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /all tasks/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

describe('ManagerDashboard — logout', () => {
  it('calls logout when the Logout sidebar button is clicked', () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({ user: MANAGER_USER, logout });
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(logout).toHaveBeenCalledOnce();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. MODAL OPEN / CLOSE
// ─────────────────────────────────────────────────────────────────────────────

describe('ManagerDashboard — modal', () => {
  it('opens the Assign New Task modal when button is clicked', async () => {
    renderDashboard();
    await openModal();
    expect(screen.getByRole('heading', { name: 'Assign New Task' })).toBeInTheDocument();
  });

  it('shows all modal form fields when opened', async () => {
    renderDashboard();
    await openModal();
    expect(document.getElementById('task-title')).toBeInTheDocument();
    expect(document.getElementById('task-deadline-date')).toBeInTheDocument();
    expect(document.getElementById('task-deadline-time')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /assign task/i })).toBeInTheDocument();
  });

  it('closes the modal when Cancel is clicked', async () => {
    renderDashboard();
    await openModal();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('heading', { name: 'Assign New Task' })).not.toBeInTheDocument();
  });

  it('closes the modal when the close button is clicked', async () => {
    renderDashboard();
    await openModal();
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(screen.queryByRole('heading', { name: 'Assign New Task' })).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. EMPLOYEE SEARCH (inside modal)
// ─────────────────────────────────────────────────────────────────────────────

describe('ManagerDashboard — employee search', () => {
  it('shows search results after typing and hides search once employee is selected', async () => {
    mockSearchUsers.mockResolvedValue([EMPLOYEE]);
    renderDashboard();
    await openModal();

    await userEvent.type(screen.getByPlaceholderText('Search by name…'), 'carol');
    fireEvent.click(await screen.findByText('Carol Employee'));

    expect(screen.queryByPlaceholderText('Search by name…')).not.toBeInTheDocument();
    expect(screen.getByText('carol@example.com')).toBeInTheDocument();
  });

  it('restores the search widget when the selected employee is removed', async () => {
    mockSearchUsers.mockResolvedValue([EMPLOYEE]);
    renderDashboard();
    await openModal();

    await userEvent.type(screen.getByPlaceholderText('Search by name…'), 'carol');
    fireEvent.click(await screen.findByText('Carol Employee'));
    fireEvent.click(screen.getByRole('button', { name: /remove assignee/i }));

    expect(screen.getByPlaceholderText('Search by name…')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. FORM VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

describe('ManagerDashboard — form validation', () => {
  it('shows error when submitting without an employee selected', async () => {
    renderDashboard();
    await openModal();

    fireEvent.change(document.getElementById('task-title') as HTMLInputElement, {
      target: { value: 'Test Task' },
    });
    fillDeadline();
    fireEvent.click(screen.getByRole('button', { name: /assign task/i }));

    expect(await screen.findByText('Please select an employee.')).toBeInTheDocument();
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('shows error when submitting without a deadline date', async () => {
    renderDashboard();
    await openModal();

    fireEvent.change(document.getElementById('task-title') as HTMLInputElement, {
      target: { value: 'Test Task' },
    });
    await selectEmployee();
    // Deliberately do NOT call fillDeadline() — deadlineDate stays ''
    // The browser required validation won't fire in jsdom, so our JS guard catches it
    fireEvent.click(screen.getByRole('button', { name: /assign task/i }));

    expect(await screen.findByText('Please set a deadline date.')).toBeInTheDocument();
    expect(mockCreateTask).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. DEADLINE DATE COMBINATION  ← TDD: this is where the bug was
// ─────────────────────────────────────────────────────────────────────────────

describe('ManagerDashboard — deadline date/time combination', () => {
  it('combines date and time into a valid ISO string for the API payload', async () => {
    mockCreateTask.mockResolvedValue(SAMPLE_TASK);
    renderDashboard();
    await openModal();

    fireEvent.change(document.getElementById('task-title') as HTMLInputElement, {
      target: { value: 'Review Q2 Report' },
    });
    await selectEmployee();
    fillDeadline('2026-06-15', '09:00');

    fireEvent.click(screen.getByRole('button', { name: /assign task/i }));

    await waitFor(() => expect(mockCreateTask).toHaveBeenCalledOnce());
    const [payload] = mockCreateTask.mock.calls[0];

    // The deadline must be a valid ISO string
    const parsed = new Date(payload.deadline);
    expect(parsed.toString()).not.toBe('Invalid Date');

    // Date part must match what we entered
    expect(payload.deadline).toContain('2026-06-15');
  });

  it('sends the correct time component in the deadline ISO string', async () => {
    mockCreateTask.mockResolvedValue(SAMPLE_TASK);
    renderDashboard();
    await openModal();

    fireEvent.change(document.getElementById('task-title') as HTMLInputElement, {
      target: { value: 'Morning task' },
    });
    await selectEmployee();
    fillDeadline('2026-07-01', '14:30');

    fireEvent.click(screen.getByRole('button', { name: /assign task/i }));

    await waitFor(() => expect(mockCreateTask).toHaveBeenCalledOnce());
    const [payload] = mockCreateTask.mock.calls[0];

    // Must be a valid Date
    expect(new Date(payload.deadline).toString()).not.toBe('Invalid Date');
    // The ISO string should contain 14:30 or equivalent UTC offset
    const localDate = new Date(`2026-07-01T14:30:00`);
    expect(new Date(payload.deadline).getTime()).toBe(localDate.getTime());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. HAPPY PATH — FULL SUBMISSION
// ─────────────────────────────────────────────────────────────────────────────

describe('ManagerDashboard — successful task creation', () => {
  async function fillAndSubmit() {
    renderDashboard();
    await openModal();

    fireEvent.change(document.getElementById('task-title') as HTMLInputElement, {
      target: { value: 'Review Q2 Report' },
    });
    fireEvent.change(document.getElementById('task-description') as HTMLTextAreaElement, {
      target: { value: 'Please review and give feedback' },
    });
    await selectEmployee();
    fillDeadline('2026-06-15', '09:00');

    fireEvent.click(screen.getByRole('button', { name: /assign task/i }));
  }

  it('calls createTask with correct payload including assigneeId', async () => {
    mockCreateTask.mockResolvedValue(SAMPLE_TASK);
    await fillAndSubmit();

    await waitFor(() => expect(mockCreateTask).toHaveBeenCalledOnce());
    const [payload] = mockCreateTask.mock.calls[0];
    expect(payload.title).toBe('Review Q2 Report');
    expect(payload.description).toBe('Please review and give feedback');
    expect(payload.assigneeId).toBe(EMPLOYEE.id);
    expect(new Date(payload.deadline).toString()).not.toBe('Invalid Date');
  });

  it('shows success message naming the task and assignee', async () => {
    mockCreateTask.mockResolvedValue(SAMPLE_TASK);
    await fillAndSubmit();

    expect(
      await screen.findByText('Task "Review Q2 Report" assigned to Carol Employee.')
    ).toBeInTheDocument();
  });

  it('resets form fields after successful submission', async () => {
    mockCreateTask.mockResolvedValue(SAMPLE_TASK);
    await fillAndSubmit();

    await screen.findByText('Task "Review Q2 Report" assigned to Carol Employee.');

    expect((document.getElementById('task-title') as HTMLInputElement).value).toBe('');
    expect(document.getElementById('task-deadline-date') as HTMLInputElement).toHaveValue('');
    expect(screen.getByPlaceholderText('Search by name…')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. API ERROR HANDLING
// ─────────────────────────────────────────────────────────────────────────────

describe('ManagerDashboard — API error handling', () => {
  async function fillAndSubmit() {
    renderDashboard();
    await openModal();
    fireEvent.change(document.getElementById('task-title') as HTMLInputElement, {
      target: { value: 'Test Task' },
    });
    await selectEmployee();
    fillDeadline();
    fireEvent.click(screen.getByRole('button', { name: /assign task/i }));
  }

  it('shows the generic error message when createTask rejects', async () => {
    mockCreateTask.mockRejectedValue(new Error('Network error'));
    await fillAndSubmit();
    expect(
      await screen.findByText('Failed to create task. Please try again.')
    ).toBeInTheDocument();
  });

  it('keeps the modal open after an API error', async () => {
    mockCreateTask.mockRejectedValue(new Error('Network error'));
    await fillAndSubmit();
    await screen.findByText('Failed to create task. Please try again.');
    expect(screen.getByRole('heading', { name: 'Assign New Task' })).toBeInTheDocument();
  });

  it('re-enables the Assign Task button after an API error', async () => {
    mockCreateTask.mockRejectedValue(new Error('Network error'));
    await fillAndSubmit();
    await screen.findByText('Failed to create task. Please try again.');
    expect(screen.getByRole('button', { name: /assign task/i })).not.toBeDisabled();
  });

  it('clears the error message on the next submission attempt', async () => {
    mockCreateTask
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(SAMPLE_TASK);

    renderDashboard();
    await openModal();

    // First (failing) submission
    fireEvent.change(document.getElementById('task-title') as HTMLInputElement, { target: { value: 'Test Task' } });
    await selectEmployee();
    fillDeadline();
    fireEvent.click(screen.getByRole('button', { name: /assign task/i }));
    await screen.findByText('Failed to create task. Please try again.');

    // Reset employee and resubmit
    fireEvent.click(screen.getByRole('button', { name: /remove assignee/i }));
    await selectEmployee();
    fireEvent.click(screen.getByRole('button', { name: /assign task/i }));

    await waitFor(() =>
      expect(screen.queryByText('Failed to create task. Please try again.')).not.toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. ALL TASKS VIEW
// ─────────────────────────────────────────────────────────────────────────────

describe('ManagerDashboard — All Tasks view', () => {
  it('switches to All Tasks view when sidebar item is clicked', async () => {
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: /all tasks/i }));
    // The h1 heading (not the nav button) should now read 'All Tasks'
    expect(await screen.findByRole('heading', { name: 'All Tasks', level: 1 })).toBeInTheDocument();
  });

  it('shows tasks from the API in the All Tasks view', async () => {
    mockGetTasks.mockResolvedValue([SAMPLE_TASK]);
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: /all tasks/i }));
    expect(await screen.findByText('Review Q2 Report')).toBeInTheDocument();
    expect(screen.getByText('Carol Employee')).toBeInTheDocument();
  });

  it('shows empty state when there are no tasks', async () => {
    mockGetTasks.mockResolvedValue([]);
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: /all tasks/i }));
    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
  });
});
