import { useCallback, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, differenceInDays } from 'date-fns';
import { getMyTasks } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { useTaskStatusUpdate } from '../hooks/useTaskStatusUpdate';
import TaskDetailPanel from '../components/TaskDetailPanel';
import type { Task } from '../types/task';

type NavView = 'tasks' | 'calendar' | 'profile';
type CalendarMode = 'dayGridMonth' | 'timeGridWeek' | 'listWeek';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  Pending:    { label: 'Pending',     bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   border: 'border-amber-200' },
  InProgress: { label: 'In Progress', bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500',  border: 'border-violet-200' },
  Completed:  { label: 'Completed',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
};

function DeadlineChip({ deadline }: { deadline: string }) {
  const daysLeft = differenceInDays(new Date(deadline), new Date());
  if (daysLeft < 0)  return <span className="tf-chip tf-chip-red">Overdue</span>;
  if (daysLeft === 0) return <span className="tf-chip tf-chip-amber">Due today</span>;
  if (daysLeft <= 3) return <span className="tf-chip tf-chip-orange">{daysLeft}d left</span>;
  return <span className="tf-chip tf-chip-green">{daysLeft}d left</span>;
}

function StatCard({
  label,
  count,
  icon,
  colorClass,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{count}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<NavView>('tasks');
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('dayGridMonth');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<number, string>>({});
  const { updateStatus, updatingIds } = useTaskStatusUpdate();

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleStatusChange = useCallback(async (taskId: number, newStatus: string) => {
    const previousStatus = optimisticStatuses[taskId] ?? tasks.find((t) => t.id === taskId)?.status;
    setOptimisticStatuses((prev) => ({ ...prev, [taskId]: newStatus }));

    // update selected task panel optimistically
    setSelectedTask((prev) => prev?.id === taskId ? { ...prev, status: newStatus } : prev);

    try {
      const updated = await updateStatus(taskId, newStatus);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setSelectedTask((prev) => prev?.id === taskId ? updated : prev);
      setOptimisticStatuses((prev) => { const next = { ...prev }; delete next[taskId]; return next; });
    } catch {
      setOptimisticStatuses((prev) => ({ ...prev, [taskId]: previousStatus ?? 'Pending' }));
      setSelectedTask((prev) => prev?.id === taskId ? { ...prev, status: previousStatus ?? 'Pending' } : prev);
    }
  }, [optimisticStatuses, tasks, updateStatus]);

  // Derive task with optimistic status applied
  const displayTasks = tasks.map((t) => ({
    ...t,
    status: optimisticStatuses[t.id] ?? t.status,
  }));

  const stats = {
    total:      displayTasks.length,
    pending:    displayTasks.filter((t) => t.status === 'Pending').length,
    inProgress: displayTasks.filter((t) => t.status === 'InProgress').length,
    completed:  displayTasks.filter((t) => t.status === 'Completed').length,
  };

  const EVENT_COLORS: Record<string, string> = {
    Pending:    '#f59e0b',
    InProgress: '#7c3aed',
    Completed:  '#10b981',
  };

  const calendarEvents = displayTasks.map((t) => ({
    id: String(t.id),
    title: t.title,
    date: t.deadline,
    backgroundColor: EVENT_COLORS[t.status] ?? '#6366f1',
    borderColor: 'transparent',
    textColor: '#fff',
  }));

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const navItems: { id: NavView; label: string; icon: React.ReactNode }[] = [
    {
      id: 'tasks',
      label: 'My Tasks',
      icon: (
        <svg style={{width:16,height:16,flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: (
        <svg style={{width:16,height:16,flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg style={{width:16,height:16,flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="tf-layout">
      {/* ─── Left Sidebar ─────────────────────────────────────────── */}
      <aside className="tf-sidebar">
        {/* Logo */}
        <div className="tf-sidebar-logo">
          <div className="tf-logo-icon">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="tf-logo-text">TaskFlow</span>
        </div>

        {/* Navigation */}
        <nav className="tf-sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveNav(item.id)}
              className={`tf-nav-item ${activeNav === item.id ? 'tf-nav-item-active' : ''}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout at bottom */}
        <div className="tf-sidebar-footer">
          <button
            id="nav-logout"
            onClick={logout}
            className="tf-nav-item tf-nav-logout"
          >
            <svg style={{width:16,height:16,flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────── */}
      <div className="tf-content">
        {/* Top bar */}
        <header className="tf-topbar">
          <div>
            <h1 className="tf-page-title">
              {activeNav === 'tasks' && 'My Tasks'}
              {activeNav === 'calendar' && 'My Tasks Calendar'}
              {activeNav === 'profile' && 'Profile'}
            </h1>
            <p className="tf-page-subtitle">
              {activeNav === 'tasks' && `Welcome back, ${user?.name?.split(' ')[0]} 👋`}
              {activeNav === 'calendar' && 'View your tasks on the calendar'}
              {activeNav === 'profile' && 'Your account information'}
            </p>
          </div>

          <div className="tf-topbar-right">
            {/* Notification bell */}
            <button className="tf-icon-btn" aria-label="Notifications" id="btn-notifications">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {stats.pending > 0 && (
                <span className="tf-notif-dot">{stats.pending}</span>
              )}
            </button>

            {/* User chip */}
            <div className="tf-user-chip">
              <div className="tf-avatar">{initials}</div>
              <div className="hidden sm:block">
                <p className="tf-user-name">{user?.name}</p>
                <p className="tf-user-role">Employee</p>
              </div>
            </div>
          </div>
        </header>

        {/* ─── My Tasks View ─────────────────────────────────────── */}
        {activeNav === 'tasks' && (
          <div className="tf-main-body">
            {/* Stats row */}
            <div className="tf-stats-grid">
              <StatCard
                label="Total Tasks"
                count={stats.total}
                colorClass="bg-indigo-50"
                icon={
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                  </svg>
                }
              />
              <StatCard
                label="Pending"
                count={stats.pending}
                colorClass="bg-amber-50"
                icon={
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="In Progress"
                count={stats.inProgress}
                colorClass="bg-violet-50"
                icon={
                  <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
              <StatCard
                label="Completed"
                count={stats.completed}
                colorClass="bg-emerald-50"
                icon={
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Task list */}
            {isLoading ? (
              <div className="tf-empty-state">
                <div className="tf-spinner" />
                <p className="text-gray-400 text-sm">Loading your tasks…</p>
              </div>
            ) : displayTasks.length === 0 ? (
              <div className="tf-empty-state bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-800 font-semibold">No tasks yet</p>
                <p className="text-gray-400 text-sm">Your manager hasn't assigned any tasks to you yet.</p>
              </div>
            ) : (
              <div className="tf-task-section">
                <div className="tf-section-header">
                  <h2 className="tf-section-title">Recent Tasks</h2>
                  <span className="tf-section-count">{displayTasks.length} total</span>
                </div>

                <div className="tf-task-table">
                  {/* Table head */}
                  <div className="tf-table-head">
                    <span>Task Title</span>
                    <span>Assigned By</span>
                    <span>Deadline</span>
                    <span>Status</span>
                    <span />
                  </div>

                  {/* Rows */}
                  {displayTasks.map((task) => {
                    const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.Pending;
                    return (
                      <div
                        key={task.id}
                        className="tf-table-row group"
                        onClick={() => setSelectedTask(task)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedTask(task)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <span className="text-sm font-medium text-gray-800 truncate">{task.title}</span>
                        </div>
                        <span className="text-sm text-gray-500">{task.managerName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {format(new Date(task.deadline), 'MMM d, yyyy')}
                          </span>
                          <DeadlineChip deadline={task.deadline} />
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        <button
                          className="text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                          onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                        >
                          View →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Calendar View ─────────────────────────────────────── */}
        {activeNav === 'calendar' && (
          <div className="tf-main-body">
            {/* Calendar mode toggle */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {format(new Date(), 'MMMM yyyy')}
              </p>
              <div className="tf-cal-toggle">
                {(
                  [
                    { key: 'dayGridMonth', label: 'Month' },
                    { key: 'timeGridWeek', label: 'Week' },
                    { key: 'listWeek',     label: 'List'  },
                  ] as { key: CalendarMode; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setCalendarMode(key)}
                    className={`tf-cal-btn ${calendarMode === key ? 'tf-cal-btn-active' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="tf-calendar-card">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView={calendarMode}
                key={calendarMode}
                events={calendarEvents}
                height="auto"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: '',
                }}
                eventClassNames="cursor-pointer"
                eventClick={(info) => {
                  const task = displayTasks.find((t) => String(t.id) === info.event.id);
                  if (task) setSelectedTask(task);
                }}
              />
            </div>
          </div>
        )}

        {/* ─── Profile View ──────────────────────────────────────── */}
        {activeNav === 'profile' && (
          <div className="tf-main-body">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-lg">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {initials}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                  <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 mt-1">
                    Employee
                  </span>
                </div>
              </div>
              <div className="space-y-4 border-t border-gray-100 pt-5">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Email</p>
                  <p className="text-sm text-gray-800 font-medium">{user?.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Tasks Overview</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {stats.total} total · {stats.inProgress} in progress · {stats.completed} completed
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Task Detail Slideover ─────────────────────────────────── */}
      <TaskDetailPanel
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={handleStatusChange}
        isUpdating={selectedTask ? updatingIds.has(selectedTask.id) : false}
      />
    </div>
  );
}
