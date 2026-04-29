import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTask, getTasks } from '../api/tasks';
import { searchUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import ManagerDashboard from './ManagerDashboard';

// ─── Mocks ───────────────────────────────────────────────────────────────────
vi.mock('../api/tasks');
const mockCreateTask = createTask as Mock;
const mockGetTasks   = getTasks   as Mock;

vi.mock('../api/users');
const mockSearchUsers = searchUsers as Mock;

<<<<<<< HEAD
// ManagerTaskList fetches via getTasks — stub the whole component so it doesn't
// interfere with the form tests (no network calls, no extra DOM noise).
vi.mock('../components/ManagerTaskList', () => ({
  default: () => <div data-testid="manager-task-list" />,
}));

=======
>>>>>>> refs/remotes/origin/master
vi.mock('../context/AuthContext');
const mockUseAuth = useAuth as Mock;

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const MANAGER = {
  userId: '1',
  name: 'Alice Manager',
  email: 'alice.manager@example.com',
  role: 'manager' as const,
};

const EMPLOYEE: import('../types/user').UserSearchResult = {
  id: 3,
  name: 'Carol Employee',
  email: 'carol@example.com',
<<<<<<< HEAD
  skills: [],
};

const TASK = {
  id: 10,
  title: 'Test Task',
  description: 'A test',
=======
  skills: ['React', 'TypeScript'],
};

const SAMPLE_TASK: import('../types/task').Task = {
  id: 10,
  title: 'Review Q2 Report',
  description: 'Please review and give feedback',
>>>>>>> refs/remotes/origin/master
  assigneeId: 3,
  assigneeName: 'Carol Employee',
  managerId: 1,
  managerName: 'Alice Manager',
<<<<<<< HEAD
  deadline: '2026-06-20T10:00:00Z',
  status: 'Pending',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function renderDashboard() {
  mockUseAuth.mockReturnValue({ user: MANAGER, logout: vi.fn() });
  render(<ManagerDashboard />);
=======
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
>>>>>>> refs/remotes/origin/master
}

async function selectEmployee() {
  mockSearchUsers.mockResolvedValue([EMPLOYEE]);
<<<<<<< HEAD
  await userEvent.type(screen.getByPlaceholderText('Search by name or skill…'), 'carol');
  fireEvent.click(await screen.findByText('Carol Employee'));
}

function fillForm({ title = 'Test Task', deadline = '2026-06-20T10:00' } = {}) {
  fireEvent.change(screen.getByPlaceholderText('e.g. Design new landing page'), {
    target: { value: title },
  });
  fireEvent.change(screen.getByPlaceholderText('Describe what needs to be done…'), {
    target: { value: 'A test description' },
  });
  // deadline-local input
  const deadlineInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
  fireEvent.change(deadlineInput, { target: { value: deadline } });
}

async function fillAndSubmit() {
  renderDashboard();
  fillForm();
  await selectEmployee();
  fireEvent.click(screen.getByRole('button', { name: /create task/i }));
}

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
=======
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
>>>>>>> refs/remotes/origin/master
  mockSearchUsers.mockResolvedValue([]);
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. RENDERING
// ─────────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
describe('ManagerDashboard — rendering', () => {
  it('renders the page heading "Manager Dashboard"', () => {
    renderDashboard();
    // h2 is the page heading; h1 in the header also says 'Manager Dashboard'
    expect(screen.getByRole('heading', { name: /manager dashboard/i, level: 2 })).toBeInTheDocument();
  });

  it('renders the manager name in the header', () => {
    renderDashboard();
    expect(screen.getByText('Alice Manager')).toBeInTheDocument();
  });

  it('renders all form fields (title, description, deadline, search)', () => {
    renderDashboard();
    expect(screen.getByPlaceholderText('e.g. Design new landing page')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe what needs to be done…')).toBeInTheDocument();
    expect(document.querySelector('input[type="datetime-local"]')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name or skill…')).toBeInTheDocument();
  });

  it('renders the EmployeeSearch widget when no assignee is selected', () => {
    renderDashboard();
    expect(screen.getByPlaceholderText('Search by name or skill…')).toBeInTheDocument();
  });

  it('renders the Create Task submit button', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
  });

  it('renders the ManagerTaskList component', () => {
    renderDashboard();
    expect(screen.getByTestId('manager-task-list')).toBeInTheDocument();
=======

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
>>>>>>> refs/remotes/origin/master
  });
});

// ─────────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
// 2. SIGN OUT
// ─────────────────────────────────────────────────────────────────────────────
describe('ManagerDashboard — sign out', () => {
  it('calls logout when Sign out is clicked', () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({ user: MANAGER, logout });
    render(<ManagerDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
=======
// 2. LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

describe('ManagerDashboard — logout', () => {
  it('calls logout when the Logout sidebar button is clicked', () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({ user: MANAGER_USER, logout });
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
>>>>>>> refs/remotes/origin/master
    expect(logout).toHaveBeenCalledOnce();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
// 3. ASSIGNEE SELECTION
// ─────────────────────────────────────────────────────────────────────────────
describe('ManagerDashboard — assignee selection', () => {
  it('shows a search result after typing and replaces the search widget with the selected employee', async () => {
    renderDashboard();
    mockSearchUsers.mockResolvedValue([EMPLOYEE]);
    await userEvent.type(screen.getByPlaceholderText('Search by name or skill…'), 'carol');
    expect(await screen.findByText('Carol Employee')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Carol Employee'));
    // Search widget replaced by selected employee chip
    expect(screen.queryByPlaceholderText('Search by name or skill…')).not.toBeInTheDocument();
    expect(screen.getByText('Carol Employee')).toBeInTheDocument();
  });

  it('clears the selected assignee when the ✕ button is clicked', async () => {
    renderDashboard();
    await selectEmployee();
    // The remove button is an SVG button — find it by its parent structure
    const removeBtn = document.querySelector('button[type="button"]') as HTMLButtonElement;
    fireEvent.click(removeBtn);
    expect(screen.getByPlaceholderText('Search by name or skill…')).toBeInTheDocument();
=======
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
>>>>>>> refs/remotes/origin/master
  });
});

// ─────────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
// 4. FORM VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
describe('ManagerDashboard — form validation', () => {
  it('shows an error message when submitting without selecting an assignee', async () => {
    renderDashboard();
    fillForm();
    // Do NOT select an employee
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(
      await screen.findByText('Please select an employee to assign this task to.')
    ).toBeInTheDocument();
=======
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
>>>>>>> refs/remotes/origin/master
    expect(mockCreateTask).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
// 5. SUCCESSFUL FORM SUBMISSION
// ─────────────────────────────────────────────────────────────────────────────
describe('ManagerDashboard — successful form submission', () => {
  it('calls createTask with the correct payload', async () => {
    mockCreateTask.mockResolvedValue(TASK);
    await fillAndSubmit();
    await waitFor(() =>
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Task',
          assigneeId: 3,
        })
      )
    );
  });

  it('shows a success message naming the task and assignee', async () => {
    mockCreateTask.mockResolvedValue(TASK);
=======
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
>>>>>>> refs/remotes/origin/master
    await fillAndSubmit();
    expect(
<<<<<<< HEAD
      await screen.findByText(/Test Task.*Carol Employee/i)
    ).toBeInTheDocument();
  });

  it('resets the form fields after a successful submission', async () => {
    mockCreateTask.mockResolvedValue(TASK);
    await fillAndSubmit();
    await screen.findByText(/Test Task.*Carol Employee/i);
    expect((screen.getByPlaceholderText('e.g. Design new landing page') as HTMLInputElement).value).toBe('');
    expect(screen.getByPlaceholderText('Search by name or skill…')).toBeInTheDocument();
  });

  it('disables the submit button while the request is in-flight', async () => {
    let resolve!: (v: unknown) => void;
    mockCreateTask.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderDashboard();
    fillForm();
    await selectEmployee();
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    resolve(TASK);
=======
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
>>>>>>> refs/remotes/origin/master
  });
});

// ─────────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
// 6. API ERROR HANDLING
// ─────────────────────────────────────────────────────────────────────────────
describe('ManagerDashboard — API error on form submission', () => {
=======
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

>>>>>>> refs/remotes/origin/master
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
<<<<<<< HEAD
    expect(screen.getByRole('button', { name: /create task/i })).not.toBeDisabled();
  });

  it('clears a previous error message on a new submission attempt', async () => {
    mockCreateTask.mockRejectedValueOnce(new Error('First failure'));
    mockCreateTask.mockResolvedValue(TASK);
    await fillAndSubmit();
    await screen.findByText('Failed to create task. Please try again.');

    // Re-select employee and submit again
    const removeBtn = document.querySelector('button[type="button"]') as HTMLButtonElement;
    fireEvent.click(removeBtn);
    fillForm();
    await selectEmployee();
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
=======
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
>>>>>>> refs/remotes/origin/master

    await waitFor(() =>
      expect(screen.queryByText('Failed to create task. Please try again.')).not.toBeInTheDocument()
    );
<<<<<<< HEAD
=======
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
>>>>>>> refs/remotes/origin/master
  });
});
