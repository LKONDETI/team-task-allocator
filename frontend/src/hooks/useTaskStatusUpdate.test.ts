import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskStatusUpdate } from './useTaskStatusUpdate';
import { updateTaskStatus } from '../api/tasks';

vi.mock('../api/tasks', () => ({
  updateTaskStatus: vi.fn(),
}));

const mockUpdateTaskStatus = updateTaskStatus as Mock;

beforeEach(() => vi.clearAllMocks());

describe('useTaskStatusUpdate', () => {
  it('adds taskId to updatingIds while the request is in flight', async () => {
    let resolveRequest!: (value: unknown) => void;
    mockUpdateTaskStatus.mockReturnValue(new Promise((res) => { resolveRequest = res; }));

    const { result } = renderHook(() => useTaskStatusUpdate());

    act(() => { result.current.updateStatus(1, 'InProgress'); });
    expect(result.current.updatingIds.has(1)).toBe(true);

    await act(async () => { resolveRequest({ id: 1, status: 'InProgress' }); });
    expect(result.current.updatingIds.has(1)).toBe(false);
  });

  it('returns the updated task from the API on success', async () => {
    const updated = { id: 2, status: 'Completed' };
    mockUpdateTaskStatus.mockResolvedValue(updated);

    const { result } = renderHook(() => useTaskStatusUpdate());
    let returned: unknown;
    await act(async () => { returned = await result.current.updateStatus(2, 'Completed'); });

    expect(returned).toEqual(updated);
    expect(result.current.errors[2]).toBeUndefined();
  });

  it('stores an error message and re-throws when the API rejects', async () => {
    mockUpdateTaskStatus.mockRejectedValue(new Error('Invalid transition'));

    const { result } = renderHook(() => useTaskStatusUpdate());
    let caught: Error | undefined;
    await act(async () => {
      try { await result.current.updateStatus(3, 'Completed'); }
      catch (e) { caught = e as Error; }
    });

    expect(caught?.message).toBe('Invalid transition');
    expect(result.current.errors[3]).toBe('Invalid transition');
  });

  it('clears the error for a task on a subsequent successful call', async () => {
    mockUpdateTaskStatus.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useTaskStatusUpdate());

    // First call fails
    await act(async () => {
      try { await result.current.updateStatus(4, 'Completed'); } catch { /* expected */ }
    });
    expect(result.current.errors[4]).toBeDefined();

    // Second call succeeds
    mockUpdateTaskStatus.mockResolvedValue({ id: 4, status: 'InProgress' });
    await act(async () => { await result.current.updateStatus(4, 'InProgress'); });
    expect(result.current.errors[4]).toBeUndefined();
  });

  it('removes taskId from updatingIds after a failed request', async () => {
    mockUpdateTaskStatus.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useTaskStatusUpdate());

    await act(async () => {
      try { await result.current.updateStatus(5, 'InProgress'); } catch { /* expected */ }
    });

    expect(result.current.updatingIds.has(5)).toBe(false);
  });
});
