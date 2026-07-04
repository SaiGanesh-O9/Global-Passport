import { useLocation } from 'react-router-dom';
import { BarChart3, BadgeCheck, ClipboardList, XCircle } from 'lucide-react';
import InstitutionTable from '../components/dashboard/InstitutionTable.jsx';
import SidebarLayout from '../components/layout/SidebarLayout.jsx';
import Card from '../components/ui/Card.jsx';
import { useDocuments } from '../hooks/useDocuments.js';

const institutionNavItems = [
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
    { label: 'Pending', value: String(metrics.pending) },
    { label: 'Approved', value: String(metrics.approved) },
    { label: 'Rejected', value: String(metrics.rejected) },
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
          <p className="text-sm font-bold uppercase text-blue-700">Analytics Dashboard</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Organization Telemetry</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 bg-white border border-slate-200">
            <h3 className="text-sm font-bold uppercase text-slate-400">Approval Performance</h3>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{approvalRate}%</p>
            <p className="text-xs text-slate-500 mt-1">Ratio of approved vs. processed requests</p>
            <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${approvalRate}%` }}></div>
            </div>
          </Card>
          <Card className="p-6 bg-white border border-slate-200">
            <h3 className="text-sm font-bold uppercase text-slate-400">Total Workload</h3>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500 mt-1">Total requests routed to your organization</p>
            <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100">
              <div className="bg-blue-600 h-full" style={{ width: `${total > 0 ? (metrics.pending / total) * 100 : 0}%` }}></div>
              <div className="bg-emerald-600 h-full" style={{ width: `${total > 0 ? (metrics.approved / total) * 100 : 0}%` }}></div>
              <div className="bg-rose-600 h-full" style={{ width: `${total > 0 ? (metrics.rejected / total) * 100 : 0}%` }}></div>
            </div>
            <div className="mt-3 flex gap-4 text-[10px] font-bold text-slate-600">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-600 inline-block"></span> Pending ({metrics.pending})</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600 inline-block"></span> Approved ({metrics.approved})</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-600 inline-block"></span> Rejected ({metrics.rejected})</span>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-white border border-slate-200">
          <h3 className="text-sm font-bold uppercase text-slate-400 mb-4">Credential Type Breakdown</h3>
          {Object.keys(typeDistribution).length === 0 ? (
            <p className="text-slate-400 text-xs font-semibold">No telemetry data recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(typeDistribution).map(([type, count]) => {
                const percent = Math.round((count / total) * 100);
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{type}</span>
                      <span>{count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-700 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
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

  return (
    <SidebarLayout
      navItems={institutionNavItems}
      subtitle="Review verification requests from verified platform users."
      title="Organization Verification Center"
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm font-bold uppercase text-blue-700">
            Organization Verification Center
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Review verification requests
          </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {metricCards.map((metric) => (
            <Card className="p-5" key={metric.label}>
              <p className="text-sm font-semibold text-slate-500">
                {metric.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {metric.value}
              </p>
            </Card>
          ))}
        </div>

        {activeTab === 'analytics' ? renderAnalytics() : <InstitutionTable activeTab={activeTab} />}
      </div>
    </SidebarLayout>
  );
}
