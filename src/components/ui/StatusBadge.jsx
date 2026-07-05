const statusStyles = {
  Pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20',
  Approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20',
  Rejected: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-500/20',
  'Information Requested': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-500/20',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold ring-1 ${statusStyles[status] || 'bg-slate-500/10 text-slate-700 dark:text-slate-400 ring-slate-500/25'}`}
    >
      {status}
    </span>
  );
}
