import { useState } from 'react';
import { createTask } from '../api/tasks';
import EmployeeSearch from '../components/EmployeeSearch';
import { useAuth } from '../context/AuthContext';
import type { UserSearchResult } from '../types/user';

export default function ManagerDashboard() {
  const { user, logout } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignee, setAssignee] = useState<UserSearchResult | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignee) {
      setErrorMsg('Please select an employee to assign this task to.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await createTask({
        title,
        description,
        assigneeId: assignee.id,
        deadline: new Date(deadline).toISOString(),
      });

      setSuccessMsg(`Task "${title}" assigned to ${assignee.name}.`);
      setTitle('');
      setDescription('');
      setDeadline('');
      setAssignee(null);
    } catch {
      setErrorMsg('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Manager Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Create a Task</h2>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe the task…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            {assignee ? (
              <div className="flex items-center gap-2 border border-green-300 bg-green-50 rounded-md px-3 py-2 text-sm">
                <span className="text-green-800 font-medium">{assignee.name}</span>
                <span className="text-green-600 text-xs">{assignee.email}</span>
                <button
                  type="button"
                  onClick={() => setAssignee(null)}
                  className="ml-auto text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <EmployeeSearch onSelect={setAssignee} />
            )}
          </div>

          {successMsg && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
              {successMsg}
            </p>
          )}
          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Creating…' : 'Create Task'}
          </button>
        </form>
      </main>
    </div>
  );
}
