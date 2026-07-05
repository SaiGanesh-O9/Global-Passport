import { useState } from 'react';
import { FileText, LayoutDashboard, Link2, Settings, Upload } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments.js';
import DocumentTable from '../components/dashboard/DocumentTable.jsx';
import UploadDocumentModal from '../components/dashboard/UploadDocumentModal.jsx';
import SidebarLayout from '../components/layout/SidebarLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';

export const userNavItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Verification Requests', to: '/dashboard', icon: FileText },
  { label: 'Shared Links', to: '/verify', icon: Link2 },
  { label: 'Settings', to: '/dashboard', icon: Settings },
];

function ActivityFeed() {
  const { activities } = useDocuments();

  return (
    <Card className="p-5 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm">
      <h2 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">Recent Activity</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-semibold mb-4">
        Real-time status changes and verification history.
      </p>

      {(!activities || activities.length === 0) ? (
        <p className="text-xs text-slate-400 dark:text-slate-550 font-bold py-8 text-center uppercase tracking-wider border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-xl">
          No recent activity logs.
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((act) => {
            const isApproved = act.type === 'Approved';
            const isRejected = act.type === 'Rejected';
            const isNew = act.type === 'New';

            const dotColor = isApproved ? 'bg-emerald-500 ring-emerald-500/20' : isRejected ? 'bg-rose-500 ring-rose-500/20' : isNew ? 'bg-blue-500 ring-blue-500/20' : 'bg-amber-500 ring-amber-500/20';

            return (
              <div key={act.id} className="flex gap-3 text-xs leading-relaxed">
                <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ring-4 ${dotColor}`}></span>
                <div className="flex-1">
                  <p className="font-bold text-slate-850 dark:text-slate-200">{act.title}</p>
                  <p className="text-slate-550 dark:text-slate-400 font-semibold mt-0.5">{act.desc}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 font-bold">
                    {isNaN(Date.parse(act.timestamp)) ? act.timestamp : new Date(act.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function UserDashboard() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm relative overflow-hidden">
        {/* Subtle light mesh */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/5 blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Welcome</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Manage your verification requests
            </h1>
            <p className="mt-3 max-w-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Submit verification requests once, track review status, and reuse verified credentials whenever you need them.
            </p>
          </div>
          <Button icon={Upload} onClick={() => setIsUploadModalOpen(true)} className="shrink-0">
            Request Verification
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DocumentTable />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
