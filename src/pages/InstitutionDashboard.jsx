import { useLocation } from 'react-router-dom';
import { BarChart3, BadgeCheck, ClipboardList, XCircle, Sparkles } from 'lucide-react';
import InstitutionTable from '../components/dashboard/InstitutionTable.jsx';
import SidebarLayout from '../components/layout/SidebarLayout.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { useDocuments } from '../hooks/useDocuments.js';

export const institutionNavItems = [
  { label: 'Pending Requests', to: '/institution#pending', icon: ClipboardList },
  { label: 'Approved Verifications', to: '/institution#approved', icon: BadgeCheck },
  { label: 'Rejected Requests', to: '/institution#rejected', icon: XCircle },
  { label: 'Analytics', to: '/institution#analytics', icon: BarChart3 },
];

export default function InstitutionDashboard() {
  const { metrics, pendingVerificationRequests, approvedVerificationRequests, rejectedVerificationRequests } = useDocuments();
  const location = useLocation();
  const activeTab = location.hash.replace('#', '') || 'pending';

  const metricCards = [
    { label: 'Pending Requests', value: String(metrics.pending), icon: ClipboardList },
    { label: 'Approved Verifications', value: String(metrics.approved), icon: BadgeCheck },
    { label: 'Rejected Requests', value: String(metrics.rejected), icon: XCircle },
  ];

  const renderAnalytics = () => {
    const total = metrics.pending + metrics.approved + metrics.rejected;
    const approvalRate = total > 0 ? Math.round((metrics.approved / total) * 100) : 100;
    
    const typeDistribution = {};
    [...pendingVerificationRequests, ...approvedVerificationRequests, ...rejectedVerificationRequests].forEach(req => {
      const type = req.credentialType || 'Other';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Analytics Dashboard</p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">Organization Telemetry</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-slate-800/40 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Approval Performance</h3>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{approvalRate}%</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1 font-semibold">Ratio of approved vs. processed requests</p>
            <div className="mt-4 w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 border border-slate-200/20 dark:border-slate-800/20">
              <div className="bg-emerald-600 dark:bg-emerald-650 h-2 rounded-full transition-all duration-300" style={{ width: `${approvalRate}%` }}></div>
            </div>
          </Card>
          <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-slate-800/40 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Workload</h3>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{total}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1 font-semibold">Total requests routed to your organization</p>
            <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/20 dark:border-slate-800/20">
              <div className="bg-blue-600 h-full" style={{ width: `${total > 0 ? (metrics.pending / total) * 100 : 0}%` }}></div>
              <div className="bg-emerald-600 h-full" style={{ width: `${total > 0 ? (metrics.approved / total) * 100 : 0}%` }}></div>
              <div className="bg-rose-600 h-full" style={{ width: `${total > 0 ? (metrics.rejected / total) * 100 : 0}%` }}></div>
            </div>
            <div className="mt-3.5 flex gap-4 text-[10px] font-bold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600 inline-block"></span> Pending ({metrics.pending})</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-600 inline-block"></span> Approved ({metrics.approved})</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-600 inline-block"></span> Rejected ({metrics.rejected})</span>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-slate-800/40 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Credential Type Breakdown</h3>
          {Object.keys(typeDistribution).length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">No telemetry data recorded yet.</p>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(typeDistribution).map(([type, count]) => {
                const percent = Math.round((count / total) * 100);
                return (
                  <div key={type} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{type}</span>
                      <span>{count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 border border-slate-200/20 dark:border-slate-800/20">
                      <div className="bg-blue-650 h-1.5 rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  };

  // Calculate AI insights based on live verificationRequests list
  const pendingList = pendingVerificationRequests || [];
  const urgentCount = pendingList.filter(req => {
    const hasFiles = req.files && req.files.length > 0;
    const fileSize = hasFiles ? req.files[0].fileSize || 0 : (req.fileSize || 0);
    return !hasFiles && !req.fileName || (hasFiles && fileSize < 10240);
  }).length;

  const workloadEstimate = pendingList.length > 10 ? 'High workload (estimated processing: 4-6 hours)' :
                           pendingList.length > 3 ? 'Moderate workload (estimated processing: 1-2 hours)' :
                           'Light workload (estimated processing: <30 minutes)';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Organization Verification Center
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Review verification requests
          </h1>
        </div>
      </div>

      {/* AI Decision & Workload Insights */}
      <Card className="p-5 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl pointer-events-none"></div>
        <div className="flex gap-3 relative z-10">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">AI Operations Insights</h3>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Workload prediction: <strong className="text-blue-600 dark:text-blue-400">{workloadEstimate}</strong>.
            </p>
            {urgentCount > 0 && (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1 uppercase tracking-wider">
                ⚠️ Anomaly Warning: {urgentCount} requests flagged with upload size issues or missing attachments. Review priority queue.
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 relative z-10 flex gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-500 dark:text-slate-450 border border-slate-200/50 dark:border-slate-800/30">
            Suggestion Only Mode Active
          </span>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {metricCards.map((metric) => (
          <StatCard
            key={metric.label}
            title={metric.label}
            value={metric.value}
            icon={metric.icon}
          />
        ))}
      </div>

      {activeTab === 'analytics' ? renderAnalytics() : <InstitutionTable activeTab={activeTab} />}
    </div>
  );
}
