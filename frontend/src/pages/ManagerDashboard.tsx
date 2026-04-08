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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-violet-500 rounded-full opacity-10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">Manager Dashboard</h1>
              <p className="text-xs text-purple-300 mt-0.5">Task Allocator</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-purple-200 hidden sm:block">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-xs text-purple-300 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Page heading */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">Create a Task</h2>
          <p className="text-purple-300 mt-1 text-sm">Assign work to your team members with deadlines.</p>
        </div>

        {/* Form card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 hover:border-white/20"
                placeholder="e.g. Design new landing page"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 hover:border-white/20 resize-none"
                placeholder="Describe what needs to be done…"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 hover:border-white/20 [color-scheme:dark]"
              />
            </div>

            {/* Assign To */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Assign To
              </label>
              {assignee ? (
                <div className="flex items-center gap-3 border border-emerald-500/30 bg-emerald-500/10 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow shrink-0">
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-300 truncate">{assignee.name}</p>
                    <p className="text-xs text-emerald-400/70 truncate">{assignee.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignee(null)}
                    className="text-emerald-400/60 hover:text-emerald-300 transition-colors p-1 rounded-md hover:bg-white/10"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <EmployeeSearch onSelect={setAssignee} />
              )}
            </div>

            {/* Messages */}
            {successMsg && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-emerald-300">{successMsg}</p>
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-300">{errorMsg}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-purple-800 disabled:to-indigo-800 text-white rounded-xl py-3.5 text-sm font-semibold shadow-lg shadow-purple-900/50 transition-all duration-200 hover:shadow-purple-700/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Task
                </span>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
