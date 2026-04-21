import { useState, useCallback } from 'react';
import { updateTaskStatus } from '../api/tasks';
import type { Task } from '../types/task';

export function useTaskStatusUpdate() {
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<number, string>>({});

  const updateStatus = useCallback(async (taskId: number, newStatus: string): Promise<Task> => {
    setUpdatingIds((prev) => new Set(prev).add(taskId));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });

    try {
      const updated = await updateTaskStatus(taskId, newStatus);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      setErrors((prev) => ({ ...prev, [taskId]: message }));
      throw err;
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, []);

  return { updateStatus, updatingIds, errors };
}
