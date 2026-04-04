import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTask } from '../api/tasks';
import { searchUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import ManagerDashboard from './ManagerDashboard';

// Mock API modules — no real HTTP calls
vi.mock('../api/tasks');
const mockCreateTask = createTask as Mock;

vi.mock('../api/users');
const mockSearchUsers = searchUsers as Mock;

// Mock AuthContext so the component has a manager user without a real provider
vi.mock('../context/AuthContext');
const mockUseAuth = useAuth as Mock;

const MANAGER_USER = {
  userId: '1',
  name: 'Bob Manager',
  email: 'bob@example.com',
  role: 'manager' as const,
};

const EMPLOYEE: import('../types/user').UserSearchResult = {
  id: 42,
  name: 'Alice Employee',
  email: 'alice@example.com',
  skills: ['TypeScript', 'React'],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({
    user: MANAGER_USER,
    logout: vi.fn(),
  });
  // Default: search returns nothing — individual tests override as needed
  mockSearchUsers.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ManagerDashboard — rendering', () => {
  it('renders the page heading and manager name', () => {
    render(<ManagerDashboard />);
    expect(screen.getByText('Manager Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Bob Manager')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<ManagerDashboard />);
    expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe the task…')).toBeInTheDocument();
    // datetime-local input has no placeholder or htmlFor — query by type
    expect(document.querySelector('input[type="datetime-local"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Task' })).toBeInTheDocument();
  });

  it('renders the EmployeeSearch widget when no assignee is selected', () => {
    render(<ManagerDashboard />);
    expect(
      screen.getByPlaceholderText('Search by name or skill…')
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sign-out
// ---------------------------------------------------------------------------

describe('ManagerDashboard — sign out', () => {
  it('calls logout when Sign out is clicked', () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({ user: MANAGER_USER, logout });
    render(<ManagerDashboard />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(logout).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Assignee selection
// ---------------------------------------------------------------------------

describe('ManagerDashboard — assignee selection', () => {
  it('shows a search result after typing and replaces the search widget with the selected employee', async () => {
    mockSearchUsers.mockResolvedValue([EMPLOYEE]);
    render(<ManagerDashboard />);

    const searchInput = screen.getByPlaceholderText('Search by name or skill…');
    await userEvent.type(searchInput, 'Ali');

    // Wait for the debounced search to resolve and the result to appear
    const result = await screen.findByText('Alice Employee');
    fireEvent.click(result);

    // The search input should be gone; the selected employee badge appears
    expect(screen.queryByPlaceholderText('Search by name or skill…')).not.toBeInTheDocument();
    expect(screen.getByText('Alice Employee')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('clears the selected assignee when the ✕ button is clicked', async () => {
    mockSearchUsers.mockResolvedValue([EMPLOYEE]);
    render(<ManagerDashboard />);

    const searchInput = screen.getByPlaceholderText('Search by name or skill…');
    await userEvent.type(searchInput, 'Ali');
    fireEvent.click(await screen.findByText('Alice Employee'));

    // Remove the selected assignee
    fireEvent.click(screen.getByRole('button', { name: '✕' }));

    // Search widget should be back
    expect(screen.getByPlaceholderText('Search by name or skill…')).toBeInTheDocument();
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Form submission — error: no assignee selected
// ---------------------------------------------------------------------------

describe('ManagerDashboard — form validation', () => {
  it('shows an error message when submitting without selecting an assignee', async () => {
    render(<ManagerDashboard />);

    fireEvent.change(screen.getByPlaceholderText('Task title'), {
      target: { value: 'Fix the bug' },
    });
    fireEvent.change(screen.getByPlaceholderText('Describe the task…'), {
      target: { value: 'There is a critical bug' },
    });
    fireEvent.change(document.querySelector('input[type="datetime-local"]') as HTMLElement, {
      target: { value: '2026-06-01T09:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    expect(
      await screen.findByText('Please select an employee to assign this task to.')
    ).toBeInTheDocument();
    expect(mockCreateTask).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Form submission — happy path
// ---------------------------------------------------------------------------

describe('ManagerDashboard — successful form submission', () => {
  async function fillAndSubmit() {
    // Select an assignee first
    mockSearchUsers.mockResolvedValue([EMPLOYEE]);
    render(<ManagerDashboard />);

    await userEvent.type(
      screen.getByPlaceholderText('Search by name or skill…'),
      'Ali'
    );
    fireEvent.click(await screen.findByText('Alice Employee'));

    fireEvent.change(screen.getByPlaceholderText('Task title'), {
      target: { value: 'Fix the bug' },
    });
    fireEvent.change(screen.getByPlaceholderText('Describe the task…'), {
      target: { value: 'There is a critical bug' },
    });
    fireEvent.change(document.querySelector('input[type="datetime-local"]') as HTMLElement, {
      target: { value: '2026-06-01T09:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));
  }

  it('calls createTask with the correct payload', async () => {
    mockCreateTask.mockResolvedValue({});
    await fillAndSubmit();

    await waitFor(() => expect(mockCreateTask).toHaveBeenCalledOnce());
    const [payload] = mockCreateTask.mock.calls[0];
    expect(payload.title).toBe('Fix the bug');
    expect(payload.description).toBe('There is a critical bug');
    expect(payload.assigneeId).toBe(EMPLOYEE.id);
    expect(payload.deadline).toBe(new Date('2026-06-01T09:00').toISOString());
  });

  it('shows a success message naming the task and assignee', async () => {
    mockCreateTask.mockResolvedValue({});
    await fillAndSubmit();

    expect(
      await screen.findByText('Task "Fix the bug" assigned to Alice Employee.')
    ).toBeInTheDocument();
  });

  it('resets the form fields after a successful submission', async () => {
    mockCreateTask.mockResolvedValue({});
    await fillAndSubmit();

    await screen.findByText('Task "Fix the bug" assigned to Alice Employee.');

    expect(screen.getByPlaceholderText('Task title')).toHaveValue('');
    expect(screen.getByPlaceholderText('Describe the task…')).toHaveValue('');
    expect(document.querySelector('input[type="datetime-local"]') as HTMLElement).toHaveValue('');
    // Assignee cleared — search widget reappears
    expect(screen.getByPlaceholderText('Search by name or skill…')).toBeInTheDocument();
  });

  it('disables the submit button while the request is in-flight', async () => {
    // Never resolves during this test so we can observe the in-flight state
    mockCreateTask.mockReturnValue(new Promise(() => {}));
    mockSearchUsers.mockResolvedValue([EMPLOYEE]);
    render(<ManagerDashboard />);

    await userEvent.type(
      screen.getByPlaceholderText('Search by name or skill…'),
      'Ali'
    );
    fireEvent.click(await screen.findByText('Alice Employee'));

    fireEvent.change(screen.getByPlaceholderText('Task title'), {
      target: { value: 'Fix the bug' },
    });
    fireEvent.change(screen.getByPlaceholderText('Describe the task…'), {
      target: { value: 'Desc' },
    });
    fireEvent.change(document.querySelector('input[type="datetime-local"]') as HTMLElement, {
      target: { value: '2026-06-01T09:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled()
    );
  });
});

// ---------------------------------------------------------------------------
// Form submission — API error
// ---------------------------------------------------------------------------

describe('ManagerDashboard — API error on form submission', () => {
  it('shows the generic error message when createTask rejects', async () => {
    mockCreateTask.mockRejectedValue(new Error('Network error'));
    mockSearchUsers.mockResolvedValue([EMPLOYEE]);
    render(<ManagerDashboard />);

    await userEvent.type(
      screen.getByPlaceholderText('Search by name or skill…'),
      'Ali'
    );
    fireEvent.click(await screen.findByText('Alice Employee'));

    fireEvent.change(screen.getByPlaceholderText('Task title'), {
      target: { value: 'Fix the bug' },
    });
    fireEvent.change(screen.getByPlaceholderText('Describe the task…'), {
      target: { value: 'There is a critical bug' },
    });
    fireEvent.change(document.querySelector('input[type="datetime-local"]') as HTMLElement, {
      target: { value: '2026-06-01T09:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    expect(
      await screen.findByText('Failed to create task. Please try again.')
    ).toBeInTheDocument();
  });

  it('re-enables the submit button after an API error', async () => {
    mockCreateTask.mockRejectedValue(new Error('Network error'));
    mockSearchUsers.mockResolvedValue([EMPLOYEE]);
    render(<ManagerDashboard />);

    await userEvent.type(
      screen.getByPlaceholderText('Search by name or skill…'),
      'Ali'
    );
    fireEvent.click(await screen.findByText('Alice Employee'));

    fireEvent.change(screen.getByPlaceholderText('Task title'), {
      target: { value: 'Fix the bug' },
    });
    fireEvent.change(screen.getByPlaceholderText('Describe the task…'), {
      target: { value: 'Desc' },
    });
    fireEvent.change(document.querySelector('input[type="datetime-local"]') as HTMLElement, {
      target: { value: '2026-06-01T09:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    // Wait for error to appear then confirm button is back to normal
    await screen.findByText('Failed to create task. Please try again.');
    expect(screen.getByRole('button', { name: 'Create Task' })).not.toBeDisabled();
  });

  it('clears a previous error message on a new submission attempt', async () => {
    // First call fails, second call succeeds
    mockCreateTask
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({});
    mockSearchUsers.mockResolvedValue([EMPLOYEE]);
    render(<ManagerDashboard />);

    // --- First submission (fails) ---
    await userEvent.type(
      screen.getByPlaceholderText('Search by name or skill…'),
      'Ali'
    );
    fireEvent.click(await screen.findByText('Alice Employee'));

    fireEvent.change(screen.getByPlaceholderText('Task title'), {
      target: { value: 'Fix the bug' },
    });
    fireEvent.change(screen.getByPlaceholderText('Describe the task…'), {
      target: { value: 'Desc' },
    });
    fireEvent.change(document.querySelector('input[type="datetime-local"]') as HTMLElement, {
      target: { value: '2026-06-01T09:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));
    await screen.findByText('Failed to create task. Please try again.');

    // --- Second submission (succeeds) ---
    // On an API error the form is NOT reset, so the assignee badge is still shown.
    // Clear it first so the search widget is visible again.
    fireEvent.click(screen.getByRole('button', { name: '✕' }));

    await userEvent.type(
      screen.getByPlaceholderText('Search by name or skill…'),
      'Ali'
    );
    fireEvent.click(await screen.findByText('Alice Employee'));

    fireEvent.change(screen.getByPlaceholderText('Task title'), {
      target: { value: 'Fix the bug' },
    });
    fireEvent.change(screen.getByPlaceholderText('Describe the task…'), {
      target: { value: 'Desc' },
    });
    fireEvent.change(document.querySelector('input[type="datetime-local"]') as HTMLElement, {
      target: { value: '2026-06-01T09:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    // Error message must be gone before the success message appears
    await waitFor(() =>
      expect(
        screen.queryByText('Failed to create task. Please try again.')
      ).not.toBeInTheDocument()
    );
    await screen.findByText('Task "Fix the bug" assigned to Alice Employee.');
  });
});
