const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  InProgress: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Pending',
  InProgress: 'In Progress',
  Completed: 'Completed',
};

// Only forward transitions are valid
const NEXT_STATUSES: Record<string, string[]> = {
  Pending: ['InProgress'],
  InProgress: ['Completed'],
  Completed: [],
};

interface StatusBadgeProps {
  status: string;
  taskId: number;
  disabled?: boolean;
  onStatusChange: (taskId: number, newStatus: string) => void;
}

export default function StatusBadge({ status, taskId, disabled = false, onStatusChange }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.Pending;
  const nextStatuses = NEXT_STATUSES[status] ?? [];
  const isTerminal = nextStatuses.length === 0;

  // Terminal status (Completed) — always read-only span
  if (isTerminal) {
    return (
      <span
        className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${styles}`}
      >
        {STATUS_LABELS[status] ?? status}
      </span>
    );
  }

  // Non-terminal: render a select, disabled when an update is in-flight
  return (
    <select
      aria-label="Update task status"
      value={status}
      disabled={disabled}
      onChange={(e) => { if (!disabled) onStatusChange(taskId, e.target.value); }}
      className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border appearance-none bg-transparent ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${styles}`}
    >
      <option value={status}>{STATUS_LABELS[status] ?? status}</option>
      {nextStatuses.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s] ?? s}
        </option>
      ))}
    </select>
  );
}
