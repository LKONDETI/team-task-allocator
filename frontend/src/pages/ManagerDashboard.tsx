import { useEffect, useState } from 'react';
import { createTask, getTasks } from '../api/tasks';
import EmployeeSearch from '../components/EmployeeSearch';
import { useAuth } from '../context/AuthContext';
import { format, differenceInDays } from 'date-fns';
import type { UserSearchResult } from '../types/user';
import type { Task } from '../types/task';

type NavView = 'dashboard' | 'all-tasks' | 'calendar';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  Pending:    { label: 'Pending',     bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   border: 'border-amber-200' },
  InProgress: { label: 'In Progress', bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500',  border: 'border-violet-200' },
  Completed:  { label: 'Completed',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
};

function DeadlineChip({ deadline }: { deadline: string }) {
  const daysLeft = differenceInDays(new Date(deadline), new Date());
  if (daysLeft < 0)   return <span className="tf-chip tf-chip-red">Overdue</span>;
  if (daysLeft === 0) return <span className="tf-chip tf-chip-amber">Due today</span>;
  if (daysLeft <= 3)  return <span className="tf-chip tf-chip-orange">{daysLeft}d left</span>;
  return <span className="tf-chip tf-chip-green">{daysLeft}d left</span>;
}

function StatCard({ label, count, icon, colorClass }: { label: string; count: number; icon: React.ReactNode; colorClass: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{count}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState<NavView>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('09:00');
  const [assignee, setAssignee] = useState<UserSearchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  function loadTasks() {
    setIsLoading(true);
    getTasks()
      .then(setTasks)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignee) { setErrorMsg('Please select an employee.'); return; }
    if (!deadlineDate) { setErrorMsg('Please set a deadline date.'); return; }
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await createTask({ title, description, assigneeId: assignee.id, deadline: new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString() });
      setSuccessMsg(`Task "${title}" assigned to ${assignee.name}.`);
      setTitle(''); setDescription(''); setDeadlineDate(''); setDeadlineTime('09:00'); setAssignee(null);
      loadTasks();
      setTimeout(() => { setShowModal(false); setSuccessMsg(''); }, 1800);
    } catch {
      setErrorMsg('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function openModal() { setSuccessMsg(''); setErrorMsg(''); setShowModal(true); }
  function closeModal() { if (!isSubmitting) setShowModal(false); }

  const stats = {
    total:      tasks.length,
    pending:    tasks.filter(t => t.status === 'Pending').length,
    inProgress: tasks.filter(t => t.status === 'InProgress').length,
    completed:  tasks.filter(t => t.status === 'Completed').length,
  };

  // Upcoming deadlines: next 7 days sorted
  const upcoming = [...tasks]
    .filter(t => t.status !== 'Completed')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'M';

  const navItems: { id: NavView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg style={{width:16,height:16,flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id: 'all-tasks', label: 'All Tasks',  icon: <svg style={{width:16,height:16,flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  ];

  return (
    <div className="tf-layout">
      {/* ─── Sidebar ─── */}
      <aside className="tf-sidebar">
        <div className="tf-sidebar-logo">
          <div className="tf-logo-icon">
            <svg style={{width:16,height:16}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="tf-logo-text">TaskFlow</span>
        </div>

        <nav className="tf-sidebar-nav">
          {navItems.map(item => (
            <button key={item.id} id={`nav-${item.id}`} onClick={() => setActiveNav(item.id)}
              className={`tf-nav-item ${activeNav === item.id ? 'tf-nav-item-active' : ''}`}>
              {item.icon}{item.label}
            </button>
          ))}

          <button onClick={openModal} id="nav-create-task"
            className="tf-nav-item" style={{marginTop: 4}}>
            <svg style={{width:16,height:16,flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </button>
        </nav>

        <div className="tf-sidebar-footer">
          <button id="nav-logout" onClick={logout} className="tf-nav-item tf-nav-logout">
            <svg style={{width:16,height:16,flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="tf-content">
        {/* Top bar */}
        <header className="tf-topbar">
          <div>
            <h1 className="tf-page-title">
              {activeNav === 'dashboard' && 'Dashboard'}
              {activeNav === 'all-tasks' && 'All Tasks'}
            </h1>
            <p className="tf-page-subtitle">
              {activeNav === 'dashboard' && 'Overview of tasks and team activity'}
              {activeNav === 'all-tasks' && 'All tasks assigned by you'}
            </p>
          </div>
          <div className="tf-topbar-right">
            <button className="tf-icon-btn" aria-label="Notifications" id="btn-notifications">
              <svg style={{width:20,height:20}} className="text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {stats.pending > 0 && <span className="tf-notif-dot">{stats.pending}</span>}
            </button>

            <div className="tf-user-chip">
              <div className="tf-avatar">{initials}</div>
              <div className="hidden sm:block">
                <p className="tf-user-name">{user?.name}</p>
                <p className="tf-user-role">Manager</p>
              </div>
            </div>

            <button id="btn-assign-task" onClick={openModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors duration-150 shadow-sm">
              <svg style={{width:15,height:15}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Assign New Task
            </button>
          </div>
        </header>

        {/* ─── Dashboard View ─── */}
        {activeNav === 'dashboard' && (
          <div className="tf-main-body">
            {/* Stats */}
            <div className="tf-stats-grid" style={{marginBottom: 24}}>
              <StatCard label="Total Tasks" count={stats.total} colorClass="bg-indigo-50"
                icon={<svg style={{width:20,height:20}} className="text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>}
              />
              <StatCard label="Pending" count={stats.pending} colorClass="bg-amber-50"
                icon={<svg style={{width:20,height:20}} className="text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <StatCard label="In Progress" count={stats.inProgress} colorClass="bg-violet-50"
                icon={<svg style={{width:20,height:20}} className="text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              />
              <StatCard label="Completed" count={stats.completed} colorClass="bg-emerald-50"
                icon={<svg style={{width:20,height:20}} className="text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            </div>

            {/* Two-column: Recent Tasks + Upcoming Deadlines */}
            <div className="mgr-two-col">
              {/* Recent Tasks table */}
              <div className="tf-task-section">
                <div className="tf-section-header">
                  <h2 className="tf-section-title">Recent Tasks</h2>
                  <button onClick={() => setActiveNav('all-tasks')}
                    className="text-xs text-indigo-600 font-semibold hover:underline">
                    View All →
                  </button>
                </div>

                {isLoading ? (
                  <div className="tf-empty-state" style={{minHeight:180}}>
                    <div className="tf-spinner" />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="tf-empty-state" style={{minHeight:180}}>
                    <p className="text-gray-400 text-sm">No tasks yet. Create your first task!</p>
                  </div>
                ) : (
                  <>
                    <div className="tf-table-head" style={{gridTemplateColumns:'2fr 1.2fr 1.3fr 1fr'}}>
                      <span>Task Title</span><span>Employee</span><span>Deadline</span><span>Status</span>
                    </div>
                    {tasks.slice(0, 6).map(task => {
                      const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.Pending;
                      return (
                        <div key={task.id} className="tf-table-row" style={{gridTemplateColumns:'2fr 1.2fr 1.3fr 1fr'}}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                            <span className="text-sm font-medium text-gray-800 truncate">{task.title}</span>
                          </div>
                          <span className="text-sm text-gray-500 truncate">{task.assigneeName}</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm text-gray-500">{format(new Date(task.deadline), 'MMM d, yyyy')}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Upcoming Deadlines panel */}
              <div className="mgr-deadlines-panel">
                <div className="tf-section-header">
                  <h2 className="tf-section-title">Upcoming Deadlines</h2>
                </div>
                {upcoming.length === 0 ? (
                  <div className="tf-empty-state" style={{minHeight:140}}>
                    <p className="text-gray-400 text-sm">No upcoming deadlines</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {upcoming.map(task => {
                      const daysLeft = differenceInDays(new Date(task.deadline), new Date());
                      const isUrgent = daysLeft <= 1;
                      return (
                        <div key={task.id} className="px-5 py-3.5 flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0 text-white ${isUrgent ? 'bg-rose-500' : 'bg-indigo-500'}`}>
                            <span className="text-xs font-bold leading-none">{format(new Date(task.deadline), 'MMM')}</span>
                            <span className="text-sm font-bold leading-none">{format(new Date(task.deadline), 'd')}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {task.assigneeName} · <DeadlineChip deadline={task.deadline} />
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── All Tasks View ─── */}
        {activeNav === 'all-tasks' && (
          <div className="tf-main-body">
            <div className="tf-task-section">
              <div className="tf-section-header">
                <h2 className="tf-section-title">All Tasks</h2>
                <span className="tf-section-count">{tasks.length} total</span>
              </div>
              {isLoading ? (
                <div className="tf-empty-state"><div className="tf-spinner" /></div>
              ) : tasks.length === 0 ? (
                <div className="tf-empty-state">
                  <p className="text-gray-500 font-semibold">No tasks yet</p>
                  <p className="text-gray-400 text-sm">Click "Assign New Task" to get started.</p>
                </div>
              ) : (
                <>
                  <div className="tf-table-head">
                    <span>Task Title</span><span>Employee</span><span>Deadline</span><span>Status</span><span />
                  </div>
                  {tasks.map(task => {
                    const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.Pending;
                    return (
                      <div key={task.id} className="tf-table-row">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <span className="text-sm font-medium text-gray-800 truncate">{task.title}</span>
                        </div>
                        <span className="text-sm text-gray-500">{task.assigneeName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{format(new Date(task.deadline), 'MMM d, yyyy')}</span>
                          <DeadlineChip deadline={task.deadline} />
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                        </span>
                        <span />
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Assign Task Modal ─── */}
      {showModal && (
        <>
          <div onClick={closeModal} className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Assign New Task</h3>
                <button onClick={closeModal} aria-label="Close modal" className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Title */}
                <div>
                  <label className="mgr-label">Task Title *</label>
                  <input id="task-title" type="text" required value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Design new landing page"
                    className="mgr-input" />
                </div>

                {/* Description */}
                <div>
                  <label className="mgr-label">Description</label>
                  <textarea id="task-description" rows={3} value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what needs to be done…"
                    className="mgr-input resize-none" />
                </div>

                {/* Assign To */}
                <div>
                  <label className="mgr-label">Assign To *</label>
                  {assignee ? (
                    <div className="flex items-center gap-3 border border-emerald-200 bg-emerald-50 rounded-xl px-3 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {assignee.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-emerald-800 truncate">{assignee.name}</p>
                        <p className="text-xs text-emerald-600 truncate">{assignee.email}</p>
                      </div>
                      <button type="button" aria-label="Remove assignee" onClick={() => setAssignee(null)}
                        className="text-emerald-500 hover:text-emerald-700 p-1 rounded-md hover:bg-emerald-100 transition-colors">
                        <svg style={{width:14,height:14}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <EmployeeSearch onSelect={setAssignee} />
                  )}
                </div>


                {/* Deadline — split into Date + Time for reliable cross-browser input */}
                <div>
                  <label className="mgr-label">Deadline *</label>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                    <div>
                      <p style={{fontSize:11,color:'#6b7280',marginBottom:4,fontWeight:500}}>Date</p>
                      <input
                        id="task-deadline-date"
                        type="date"
                        value={deadlineDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setDeadlineDate(e.target.value)}
                        className="mgr-input"
                      />
                    </div>
                    <div>
                      <p style={{fontSize:11,color:'#6b7280',marginBottom:4,fontWeight:500}}>Time</p>
                      <input
                        id="task-deadline-time"
                        type="time"
                        required
                        value={deadlineTime}
                        onChange={e => setDeadlineTime(e.target.value)}
                        className="mgr-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Messages */}
                {successMsg && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <svg style={{width:16,height:16}} className="text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-emerald-700">{successMsg}</p>
                  </div>
                )}
                {errorMsg && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-700">{errorMsg}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" id="btn-submit-task" disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                    {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg style={{width:15,height:15}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    Assign Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
