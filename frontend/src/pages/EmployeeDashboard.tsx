import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { format, differenceInDays } from 'date-fns';
import { getMyTasks } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import type { Task } from '../types/task';

type ViewMode = 'list' | 'calendar';

function DeadlineBadge({ deadline }: { deadline: string }) {
  const daysLeft = differenceInDays(new Date(deadline), new Date());

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        Overdue
      </span>
    );
  }
  if (daysLeft === 0) {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Due today
      </span>
    );
  }
  if (daysLeft <= 3) {
    return (
      <span className="inline-flex items-center gap-1 bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
        {daysLeft}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
      {daysLeft}d left
    </span>
  );
}

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('list');

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const calendarEvents = tasks.map((t) => ({
    id: String(t.id),
    title: t.title,
    date: t.deadline,
    backgroundColor: '#7c3aed',
    borderColor: '#6d28d9',
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-purple-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-violet-500 rounded-full opacity-10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">My Tasks</h1>
              <p className="text-xs text-indigo-300 mt-0.5">Task Allocator</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-indigo-200 hidden sm:block">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-xs text-indigo-300 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Page heading + stats */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-indigo-300 mt-1 text-sm">
              You have <span className="font-semibold text-white">{tasks.length}</span> task{tasks.length !== 1 ? 's' : ''} assigned to you.
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                view === 'list'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                  : 'text-indigo-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                view === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                  : 'text-indigo-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-indigo-300 text-sm">Loading your tasks…</p>
          </div>
        ) : view === 'list' ? (
          tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-white font-semibold">No tasks yet</p>
              <p className="text-indigo-400 text-sm">Your manager hasn't assigned any tasks to you yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task, idx) => (
                <li
                  key={task.id}
                  className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-black/20"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Status dot */}
                      <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-200 transition-colors">
                          {task.title}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <DeadlineBadge deadline={task.deadline} />
                          <span className="text-xs text-slate-500">
                            Assigned by{' '}
                            <span className="text-slate-400 font-medium">{task.managerName}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Date block */}
                    <div className="shrink-0 text-right">
                      <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 min-w-[80px]">
                        <p className="text-xs text-slate-500 font-medium">
                          {format(new Date(task.deadline), 'MMM')}
                        </p>
                        <p className="text-2xl font-bold text-white leading-none my-0.5">
                          {format(new Date(task.deadline), 'd')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(task.deadline), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 [&_.fc]:text-white [&_.fc-toolbar-title]:text-white [&_.fc-button]:bg-indigo-600 [&_.fc-button]:border-indigo-600 [&_.fc-button:hover]:bg-indigo-500 [&_.fc-day-today]:bg-indigo-500/20 [&_.fc-col-header-cell]:text-indigo-300 [&_.fc-daygrid-day-number]:text-slate-300 [&_.fc-daygrid-day-number:hover]:text-white [&_.fc-event]:rounded-lg [&_.fc-event]:border-0">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              height="auto"
            />
          </div>
        )}
      </main>
    </div>
  );
}
