import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getTasks } from '../api/tasks';
import type { Task } from '../types/task';

export default function ManagerTaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch(() => setError('Failed to load tasks.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>{error}</p>;
  if (tasks.length === 0) return <p>No tasks created yet.</p>;

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li key={task.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="font-medium text-gray-800">{task.title}</p>
          <p className="text-sm text-gray-500 mt-1">{task.assigneeName}</p>
          <p className="text-sm text-gray-400 mt-1">
            Due {format(new Date(task.deadline), 'MMM d, yyyy')}
          </p>
        </li>
      ))}
    </ul>
  );
}
