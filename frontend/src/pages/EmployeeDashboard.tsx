import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { format } from 'date-fns';
import { getMyTasks } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import type { Task } from '../types/task';

type ViewMode = 'list' | 'calendar';

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
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">My Tasks</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button onClick={logout} className="text-sm text-red-600 hover:underline">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Calendar
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading tasks…</p>
        ) : view === 'list' ? (
          tasks.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks assigned to you yet.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li key={task.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">{task.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Assigned by {task.managerName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-gray-700">
                        Due {format(new Date(task.deadline), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(task.deadline), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-4">
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
