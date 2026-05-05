// Status badge
const STATUS = {
  NEW:         { dot: 'bg-gray-400',   text: 'text-gray-600',   bg: 'bg-gray-100',   label: 'New' },
  ASSIGNED:    { dot: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50',    label: 'Assigned' },
  IN_PROGRESS: { dot: 'bg-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50',   label: 'In Progress' },
  RESOLVED:    { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',   label: 'Resolved' },
  CLOSED:      { dot: 'bg-gray-500',   text: 'text-gray-600',   bg: 'bg-gray-200',   label: 'Closed' },
};

const PRIORITY = {
  HIGH:   { text: 'text-red-600',   label: 'High' },
  MEDIUM: { text: 'text-amber-600', label: 'Medium' },
  LOW:    { text: 'text-green-600', label: 'Low' },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.NEW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} flex-shrink-0`} />
      {s.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || PRIORITY.LOW;
  return <span className={`text-sm font-medium ${p.text}`}>{p.label}</span>;
}
