import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { searchUsers } from '../api/users';
import EmployeeSearch from './EmployeeSearch';
import type { UserSearchResult } from '../types/user';

vi.mock('../api/users');
const mockSearchUsers = searchUsers as Mock;

const ALICE: UserSearchResult = {
  id: 1,
  name: 'Alice Employee',
  email: 'alice@example.com',
  skills: ['TypeScript', 'React'],
};

const BOB: UserSearchResult = {
  id: 2,
  name: 'Bob Dev',
  email: 'bob@example.com',
  skills: [],
};

// Fake timers let us control the 300 ms debounce without real waiting
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

function getInput() {
  return screen.getByPlaceholderText('Search by name or skill…');
}

// Simulates typing into the search field (synchronous, no timer conflicts)
function typeIntoSearch(value: string) {
  fireEvent.change(getInput(), { target: { value } });
}

// Advance the debounce timer AND flush any resulting async work (e.g. searchUsers)
async function flushDebounce() {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

// ---------------------------------------------------------------------------
// Initial render
// ---------------------------------------------------------------------------

describe('EmployeeSearch — initial render', () => {
  it('shows the search input and no dropdown', () => {
    render(<EmployeeSearch onSelect={vi.fn()} />);
    expect(getInput()).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Debounced search
// ---------------------------------------------------------------------------

describe('EmployeeSearch — debounced search', () => {
  it('does not call searchUsers before 300 ms have elapsed', async () => {
    render(<EmployeeSearch onSelect={vi.fn()} />);
    typeIntoSearch('Ali');
    vi.advanceTimersByTime(299);
    expect(mockSearchUsers).not.toHaveBeenCalled();
  });

  it('calls searchUsers with the trimmed query after 300 ms', async () => {
    mockSearchUsers.mockResolvedValue([ALICE]);
    render(<EmployeeSearch onSelect={vi.fn()} />);

    typeIntoSearch('Ali');
    await flushDebounce();

    expect(mockSearchUsers).toHaveBeenCalledWith('Ali');
  });

  it('fires only one request when the value changes rapidly', async () => {
    mockSearchUsers.mockResolvedValue([ALICE]);
    render(<EmployeeSearch onSelect={vi.fn()} />);

    // Simulate rapid typing: each change cancels the previous debounce timer
    typeIntoSearch('A');
    typeIntoSearch('Al');
    typeIntoSearch('Ali');
    await flushDebounce();

    expect(mockSearchUsers).toHaveBeenCalledOnce();
    expect(mockSearchUsers).toHaveBeenCalledWith('Ali');
  });
});

// ---------------------------------------------------------------------------
// Results dropdown
// ---------------------------------------------------------------------------

describe('EmployeeSearch — results dropdown', () => {
  it('renders name, email, and skills for each result', async () => {
    mockSearchUsers.mockResolvedValue([ALICE]);
    render(<EmployeeSearch onSelect={vi.fn()} />);

    typeIntoSearch('Ali');
    await flushDebounce();

    expect(screen.getByText('Alice Employee')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('renders multiple results', async () => {
    mockSearchUsers.mockResolvedValue([ALICE, BOB]);
    render(<EmployeeSearch onSelect={vi.fn()} />);

    typeIntoSearch('e');
    await flushDebounce();

    expect(screen.getByText('Alice Employee')).toBeInTheDocument();
    expect(screen.getByText('Bob Dev')).toBeInTheDocument();
  });

  it('shows "No employees found." when search returns an empty array', async () => {
    mockSearchUsers.mockResolvedValue([]);
    render(<EmployeeSearch onSelect={vi.fn()} />);

    typeIntoSearch('xyz');
    await flushDebounce();

    expect(screen.getByText('No employees found.')).toBeInTheDocument();
  });

  it('hides the dropdown when the input is cleared', async () => {
    mockSearchUsers.mockResolvedValue([ALICE]);
    render(<EmployeeSearch onSelect={vi.fn()} />);

    typeIntoSearch('Ali');
    await flushDebounce();
    expect(screen.getByText('Alice Employee')).toBeInTheDocument();

    typeIntoSearch('');
    await flushDebounce();
    expect(screen.queryByText('Alice Employee')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('EmployeeSearch — selecting a result', () => {
  it('calls onSelect with the chosen user', async () => {
    mockSearchUsers.mockResolvedValue([ALICE]);
    const onSelect = vi.fn();
    render(<EmployeeSearch onSelect={onSelect} />);

    typeIntoSearch('Ali');
    await flushDebounce();
    fireEvent.click(screen.getByText('Alice Employee'));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(ALICE);
  });

  it('clears the input and closes the dropdown after selection', async () => {
    mockSearchUsers.mockResolvedValue([ALICE]);
    render(<EmployeeSearch onSelect={vi.fn()} />);

    typeIntoSearch('Ali');
    await flushDebounce();
    fireEvent.click(screen.getByText('Alice Employee'));

    expect(getInput()).toHaveValue('');
    expect(screen.queryByText('Alice Employee')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('EmployeeSearch — API error', () => {
  it('shows no dropdown when searchUsers rejects', async () => {
    mockSearchUsers.mockRejectedValue(new Error('Network error'));
    render(<EmployeeSearch onSelect={vi.fn()} />);

    typeIntoSearch('Ali');
    await flushDebounce();

    expect(screen.queryByText('Alice Employee')).not.toBeInTheDocument();
    expect(screen.queryByText('No employees found.')).not.toBeInTheDocument();
  });
});
