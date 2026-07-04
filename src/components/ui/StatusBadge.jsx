const statusStyles = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Rejected: 'bg-red-50 text-red-700 ring-red-200',
  'Information Requested': 'bg-blue-50 text-blue-700 ring-blue-200',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusStyles[status] || 'bg-slate-50 text-slate-700 ring-slate-200'}`}
    >
      {status}
    </span>
  );
}
