import { format, differenceInDays } from 'date-fns';
import type { Task } from '../types/task';

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  onStatusChange: (taskId: number, newStatus: string) => void;
  isUpdating?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Pending:    { label: 'Pending',     bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  InProgress: { label: 'In Progress', bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500' },
  Completed:  { label: 'Completed',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

function DeadlineChip({ deadline }: { deadline: string }) {
  const daysLeft = differenceInDays(new Date(deadline), new Date());
  if (daysLeft < 0)
    return <span className="tf-chip tf-chip-red">Overdue</span>;
  if (daysLeft === 0)
    return <span className="tf-chip tf-chip-amber">Due today</span>;
  if (daysLeft <= 3)
    return <span className="tf-chip tf-chip-orange">{daysLeft}d left</span>;
  return <span className="tf-chip tf-chip-green">{daysLeft}d left</span>;
}

export default function TaskDetailPanel({ task, onClose, onStatusChange, isUpdating }: TaskDetailPanelProps) {
  const show = task !== null;
  const cfg = task ? (STATUS_CONFIG[task.status] ?? STATUS_CONFIG.Pending) : STATUS_CONFIG.Pending;

  const canMarkInProgress = task?.status === 'Pending';
  const canMarkCompleted  = task?.status === 'InProgress';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30 transition-opacity duration-300 ${
          show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-[340px] bg-white shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-out ${
          show ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Task Details</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {task && (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Title + status */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-base font-semibold text-gray-900 leading-snug">{task.title}</h4>
                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
            </div>

            {/* Meta rows */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Assigned By</p>
                  <p className="text-gray-800 font-medium">{task.managerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Deadline</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-800 font-medium">
                      {format(new Date(task.deadline), 'MMM d, yyyy')}
                    </p>
                    <DeadlineChip deadline={task.deadline} />
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Description */}
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {task.description || 'No description provided.'}
              </p>
            </div>

            {/* Divider */}
            {(canMarkInProgress || canMarkCompleted) && (
              <div className="border-t border-gray-100" />
            )}

            {/* Action buttons */}
            {(canMarkInProgress || canMarkCompleted) && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Actions</p>
                <div className="space-y-2">
                  {canMarkInProgress && (
                    <button
                      disabled={isUpdating}
                      onClick={() => onStatusChange(task.id, 'InProgress')}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors duration-150"
                    >
                      {isUpdating ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                      Mark as In Progress
                    </button>
                  )}
                  {canMarkCompleted && (
                    <button
                      disabled={isUpdating}
                      onClick={() => onStatusChange(task.id, 'Completed')}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors duration-150"
                    >
                      {isUpdating ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
