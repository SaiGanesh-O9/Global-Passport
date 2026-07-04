import { useState } from 'react';
import { FileText, LayoutDashboard, Link2, Settings, Upload } from 'lucide-react';
import DocumentTable from '../components/dashboard/DocumentTable.jsx';
import UploadDocumentModal from '../components/dashboard/UploadDocumentModal.jsx';
import SidebarLayout from '../components/layout/SidebarLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';

const userNavItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'My Documents', to: '/dashboard', icon: FileText },
  { label: 'Shared Links', to: '/verify', icon: Link2 },
  { label: 'Settings', to: '/dashboard', icon: Settings },
];

export default function UserDashboard() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <SidebarLayout
      navItems={userNavItems}
      subtitle="Manage documents and share verified credentials."
      title="User Dashboard"
    >
      <div className="space-y-6">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-blue-700">Welcome</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Manage your verified documents
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Upload documents once, track review status, and reuse verified
                credentials whenever you need them.
              </p>
            </div>
            <Button icon={Upload} onClick={() => setIsUploadModalOpen(true)}>
              Upload New Document
            </Button>
          </div>
        </Card>

        <DocumentTable />
      </div>

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </SidebarLayout>
  );
}
