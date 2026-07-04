import { BarChart3, BadgeCheck, ClipboardList, XCircle } from 'lucide-react';
import InstitutionTable from '../components/dashboard/InstitutionTable.jsx';
import SidebarLayout from '../components/layout/SidebarLayout.jsx';
import Card from '../components/ui/Card.jsx';
import { useDocuments } from '../hooks/useDocuments.js';

const institutionNavItems = [
  { label: 'Pending Requests', to: '/institution', icon: ClipboardList },
  { label: 'Approved Verifications', to: '/institution', icon: BadgeCheck },
  { label: 'Rejected', to: '/institution', icon: XCircle },
  { label: 'Analytics', to: '/institution', icon: BarChart3 },
];

export default function InstitutionDashboard() {
  const { metrics } = useDocuments();

  const metricCards = [
    { label: 'Pending', value: String(metrics.pending) },
    { label: 'Approved', value: String(metrics.approved) },
    { label: 'Rejected', value: String(metrics.rejected) },
  ];

  return (
    <SidebarLayout
      navItems={institutionNavItems}
      subtitle="Review verification requests from students and users."
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

        <InstitutionTable />
      </div>
    </SidebarLayout>
  );
}
