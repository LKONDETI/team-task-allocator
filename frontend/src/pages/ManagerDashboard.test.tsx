import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTask } from '../api/tasks';
import { searchUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import ManagerDashboard from './ManagerDashboard';

// ─── Mocks ───────────────────────────────────────────────────────────────────
vi.mock('../api/tasks');
const mockCreateTask = createTask as Mock;

vi.mock('../api/users');
const mockSearchUsers = searchUsers as Mock;

// ManagerTaskList fetches via getTasks — stub the whole component so it doesn't
// interfere with the form tests (no network calls, no extra DOM noise).
vi.mock('../components/ManagerTaskList', () => ({
  default: () => <div data-testid="manager-task-list" />,
}));

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
  skills: [],
};

const TASK = {
  id: 10,
  title: 'Test Task',
  description: 'A test',
  assigneeId: 3,
  assigneeName: 'Carol Employee',
  managerId: 1,
  managerName: 'Alice Manager',
  deadline: '2026-06-20T10:00:00Z',
  status: 'Pending',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function renderDashboard() {
  mockUseAuth.mockReturnValue({ user: MANAGER, logout: vi.fn() });
  render(<ManagerDashboard />);
}

async function selectEmployee() {
  mockSearchUsers.mockResolvedValue([EMPLOYEE]);
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
  mockSearchUsers.mockResolvedValue([]);
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. RENDERING
// ─────────────────────────────────────────────────────────────────────────────
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
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SIGN OUT
// ─────────────────────────────────────────────────────────────────────────────
describe('ManagerDashboard — sign out', () => {
  it('calls logout when Sign out is clicked', () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({ user: MANAGER, logout });
    render(<ManagerDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(logout).toHaveBeenCalledOnce();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
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
  });
});

// ─────────────────────────────────────────────────────────────────────────────
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
    expect(mockCreateTask).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
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
    await fillAndSubmit();
    expect(
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
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. API ERROR HANDLING
// ─────────────────────────────────────────────────────────────────────────────
describe('ManagerDashboard — API error on form submission', () => {
  it('shows the generic error message when createTask rejects', async () => {
    mockCreateTask.mockRejectedValue(new Error('Network error'));
    await fillAndSubmit();
    expect(
      await screen.findByText('Failed to create task. Please try again.')
    ).toBeInTheDocument();
  });

  it('re-enables the submit button after an API error', async () => {
    mockCreateTask.mockRejectedValue(new Error('Network error'));
    await fillAndSubmit();
    await screen.findByText('Failed to create task. Please try again.');
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

    await waitFor(() =>
      expect(
        screen.queryByText('Failed to create task. Please try again.')
      ).not.toBeInTheDocument()
    );
  });
});
