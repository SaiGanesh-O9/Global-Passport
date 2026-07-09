import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useDocuments } from '../hooks/useDocuments.js';
import { useDocumentActions } from '../hooks/useDocumentActions.js';
import InstitutionTable from '../components/dashboard/InstitutionTable.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Select from '../components/ui/Select.jsx';
import RequestDocumentModal from '../components/dashboard/RequestDocumentModal.jsx';
import AIPreferences from '../components/ui/AIPreferences.jsx';
import {
  BarChart3,
  BadgeCheck,
  ClipboardList,
  XCircle,
  Plus,
  Settings,
  User,
  ShieldAlert,
  Layers,
  Edit2,
  Trash2,
  Check,
  X,
  FileText,
  HelpCircle,
  Save,
  Globe
} from 'lucide-react';

export const institutionNavItems = [
  { label: 'Dashboard', to: '/institution#dashboard', icon: BarChart3 },
  { label: 'Verification Services', to: '/institution#services', icon: Layers },
  { label: 'Credential Templates', to: '/institution#templates', icon: ClipboardList },
  { label: 'Incoming Requests', to: '/institution#requests', icon: ShieldAlert },
  { label: 'Profile', to: '/institution#profile', icon: User },
  { label: 'Settings', to: '/institution#settings', icon: Settings },
];

export default function InstitutionDashboard() {
  const { currentUser, userProfile } = useAuth();
  const {
    metrics,
    verificationRequests,
    organizationProfiles,
    verificationServices,
    credentialTemplates
  } = useDocuments();

  const {
    createVerificationService,
    updateVerificationService,
    deleteVerificationService,
    saveCredentialTemplate,
    saveOrganizationProfile
  } = useDocumentActions();

  const location = useLocation();
  const activeTab = location.hash.replace('#', '') || 'dashboard';

  // Resolved organization identity
  const currentOrgId = userProfile?.organizationId || 'org-northbridge';
  const orgProfile = useMemo(() => {
    return organizationProfiles.find(p => p.id === currentOrgId) || {
      id: currentOrgId,
      name: userProfile?.organizationName || 'Northbridge University',
      description: 'Educational institution providing verified academic credentials.',
      category: 'University',
      logo: null,
      contactEmail: currentUser?.email || 'admin@northbridge.edu',
      website: 'www.northbridge.edu',
      address: '100 University Ave, City Center',
      status: 'Active',
      supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Passport']
    };
  }, [organizationProfiles, currentOrgId, userProfile, currentUser]);

  // Modals / forms state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceStatus, setServiceStatus] = useState('Published');

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateInstructions, setTemplateInstructions] = useState('');
  const [templateRequirements, setTemplateRequirements] = useState([]);

  // Profile forms state
  const [profileName, setProfileName] = useState('');
  const [profileDesc, setProfileDesc] = useState('');
  const [profileCategory, setProfileCategory] = useState('University');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileWebsite, setProfileWebsite] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const saved = localStorage.getItem(`notif_prefs_${currentOrgId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      delivery: { email: true, inApp: true, push: false },
      events: { verification: true, credential: true, organization: true, admin: true, security: true, system: true },
      frequency: 'Instant'
    };
  });

  const handleSavePrefs = (updated) => {
    setNotifPrefs(updated);
    localStorage.setItem(`notif_prefs_${currentOrgId}`, JSON.stringify(updated));
  };

  // Sync profile values when profile changes
  useEffect(() => {
    if (orgProfile) {
      setProfileName(orgProfile.name || '');
      setProfileDesc(orgProfile.description || '');
      setProfileCategory(orgProfile.category || 'University');
      setProfileEmail(orgProfile.contactEmail || '');
      setProfileWebsite(orgProfile.website || '');
      setProfileAddress(orgProfile.address || '');
    }
  }, [orgProfile]);

  // Filter services belonging to current organization
  const orgServices = useMemo(() => {
    return verificationServices.filter(s => s.organizationId === currentOrgId);
  }, [verificationServices, currentOrgId]);

  // Metric Cards calculation
  const total = metrics.pending + metrics.approved + metrics.rejected;
  const approvalRate = total > 0 ? Math.round((metrics.approved / total) * 100) : 100;

  const metricCards = [
    { label: 'Pending Requests', value: String(metrics.pending), icon: ClipboardList },
    { label: 'Approved Verifications', value: String(metrics.approved), icon: BadgeCheck },
    { label: 'Rejected Requests', value: String(metrics.rejected), icon: XCircle },
  ];

  // Save/Update Service handler
  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceName) return;

    try {
      if (editingService) {
        await updateVerificationService(editingService.id, {
          name: serviceName,
          description: serviceDesc,
          status: serviceStatus
        });
      } else {
        const newServiceId = `service-${Date.now()}`;
        await createVerificationService(newServiceId, {
          id: newServiceId,
          organizationId: currentOrgId,
          name: serviceName,
          description: serviceDesc,
          status: serviceStatus
        });
        
        // Initialize an empty template for the new service
        await saveCredentialTemplate(`template-${newServiceId}`, {
          id: `template-${newServiceId}`,
          serviceId: newServiceId,
          requiredCredentials: [],
          optionalCredentials: [],
          instructions: 'Upload required verification documents.'
        });
      }

      setServiceName('');
      setServiceDesc('');
      setServiceStatus('Published');
      setEditingService(null);
      setShowServiceForm(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save service: ' + err.message);
    }
  };

  // Edit service trigger
  const triggerEditService = (service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceDesc(service.description);
    setServiceStatus(service.status || 'Published');
    setShowServiceForm(true);
  };

  // Delete service trigger
  const handleDeleteService = async (serviceId) => {
    if (confirm('Are you sure you want to delete this service and its templates?')) {
      try {
        await deleteVerificationService(serviceId);
      } catch (err) {
        console.error(err);
        alert('Failed to delete service: ' + err.message);
      }
    }
  };

  // Edit template trigger
  const triggerEditTemplate = (service) => {
    const template = credentialTemplates.find(t => t.serviceId === service.id) || {
      id: `template-${service.id}`,
      serviceId: service.id,
      requiredCredentials: [],
      optionalCredentials: [],
      instructions: ''
    };
    setEditingTemplate(template);
    setTemplateInstructions(template.instructions || '');
    
    // Combine both list with a requirement flag
    const requirements = [
      ...(template.requiredCredentials || []).map(c => ({ ...c, required: true })),
      ...(template.optionalCredentials || []).map(c => ({ ...c, required: false }))
    ];
    setTemplateRequirements(requirements);
  };

  // Save template requirements
  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    const required = templateRequirements.filter(r => r.required);
    const optional = templateRequirements.filter(r => !r.required);

    try {
      await saveCredentialTemplate(editingTemplate.id, {
        ...editingTemplate,
        instructions: templateInstructions,
        requiredCredentials: required,
        optionalCredentials: optional
      });
      setEditingTemplate(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save template: ' + err.message);
    }
  };

  // Add requirement to template
  const handleAddRequirement = (type) => {
    if (!type) return;
    setTemplateRequirements(prev => [
      ...prev,
      { type, required: true, maxFileSize: 5242880, acceptedFileTypes: ['.pdf'] }
    ]);
  };

  // Remove requirement from template
  const handleRemoveRequirement = (index) => {
    setTemplateRequirements(prev => prev.filter((_, i) => i !== index));
  };

  // Save Profile handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await saveOrganizationProfile(currentOrgId, {
        ...orgProfile,
        name: profileName,
        description: profileDesc,
        category: profileCategory,
        contactEmail: profileEmail,
        website: profileWebsite,
        address: profileAddress
      });
      alert('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile: ' + err.message);
    }
  };

  // 1. Dashboard View
  const renderDashboardTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Overview Dashboard
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {orgProfile.name} Verification Hub
            </h1>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-extrabold text-white rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Request Document
          </button>
        </div>

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

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-slate-800/40 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">Approval Performance</h3>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{approvalRate}%</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1 font-semibold">Ratio of approved vs. processed requests</p>
            <div className="mt-4 w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 border border-slate-200/20 dark:border-slate-800/20">
              <div className="bg-emerald-600 dark:bg-emerald-650 h-2 rounded-full transition-all duration-300" style={{ width: `${approvalRate}%` }}></div>
            </div>
          </Card>
          <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-slate-800/40 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">Total Workload</h3>
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
      </div>
    );
  };

  // 2. Verification Services View
  const renderServicesTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Verification Services</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1 font-semibold">
              Manage the verification pipelines offered by your organization.
            </p>
          </div>
          {!showServiceForm && (
            <Button icon={Plus} onClick={() => { setEditingService(null); setShowServiceForm(true); }}>
              Add Service
            </Button>
          )}
        </div>

        {showServiceForm ? (
          <Card className="p-6 max-w-lg bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              {editingService ? 'Edit Verification Service' : 'Create New Service'}
            </h3>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Service Name</label>
                <Input
                  required
                  placeholder="e.g. Degree Verification"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Description</label>
                <Textarea
                  placeholder="Describe the objective and processing timeline for this verification service..."
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Status</label>
                <Select value={serviceStatus} onChange={(e) => setServiceStatus(e.target.value)}>
                  <option value="Published">Published (Publicly visible)</option>
                  <option value="Draft">Draft (Hidden)</option>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowServiceForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Service
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {orgServices.length > 0 ? (
              orgServices.map(service => (
                <Card key={service.id} className="p-5 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{service.name}</h4>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                        service.status === 'Published'
                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/15'
                          : 'bg-amber-500/10 text-amber-700 border-amber-500/15'
                      }`}>
                        {service.status || 'Published'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-450 line-clamp-2 leading-relaxed">
                      {service.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-850">
                    <Button variant="secondary" className="py-1 px-2.5 text-[10px]" icon={Edit2} onClick={() => triggerEditService(service)}>
                      Edit
                    </Button>
                    <Button variant="secondary" className="py-1 px-2.5 text-[10px] text-rose-600 hover:text-rose-700" icon={Trash2} onClick={() => handleDeleteService(service.id)}>
                      Delete
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-bold py-12 text-center col-span-2 border-2 border-dashed border-slate-200/50 dark:border-slate-800/40 rounded-xl">
                No verification services created yet.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // 3. Credential Templates Builder View
  const renderTemplatesTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Credential Templates</h2>
          <p className="text-[11px] text-slate-550 dark:text-slate-450 mt-1 font-semibold">
            Define requirements checklists for each verification service.
          </p>
        </div>

        {editingTemplate ? (
          <Card className="p-6 max-w-xl bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Edit Checklist Template
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                Configure credential requirements for this service.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Instructions for Users</label>
                <Textarea
                  placeholder="Provide instructions on which documents to upload and verification parameters..."
                  value={templateInstructions}
                  onChange={(e) => setTemplateInstructions(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Required Credentials Checklist</span>
                  <div className="flex gap-1">
                    {['Passport', 'Degree Certificate', 'Transcript', 'Academic Essay', 'Custom'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const name = type === 'Custom' ? prompt('Enter custom credential name:') : type;
                          if (name) handleAddRequirement(name);
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-[9px] font-extrabold text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-800/60"
                      >
                        + {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/30">
                  {templateRequirements.length > 0 ? (
                    templateRequirements.map((req, idx) => (
                      <div key={idx} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/50 rounded-xl">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{req.type}</span>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={req.required}
                                onChange={(e) => {
                                  const updated = [...templateRequirements];
                                  updated[idx].required = e.target.checked;
                                  setTemplateRequirements(updated);
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                              />
                              Required
                            </label>
                            <span>Max size: 5MB</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(idx)}
                          className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-450 font-bold py-6 text-center">No requirements configured yet.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800/45">
                <Button variant="secondary" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                <Button variant="primary" icon={Save} onClick={handleSaveTemplate}>
                  Save Template
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {orgServices.length > 0 ? (
              orgServices.map(service => {
                const template = credentialTemplates.find(t => t.serviceId === service.id);
                const reqCount = template ? (template.requiredCredentials?.length || 0) + (template.optionalCredentials?.length || 0) : 0;
                return (
                  <Card key={service.id} className="p-5 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-sm flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{service.name} Template</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed">
                        {reqCount} credential requirements configured for this service.
                      </p>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-850">
                      <Button variant="secondary" className="py-1 px-3 text-[10px]" icon={Edit2} onClick={() => triggerEditTemplate(service)}>
                        Configure checklist
                      </Button>
                    </div>
                  </Card>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 font-bold py-12 text-center col-span-2 border-2 border-dashed border-slate-200/50 dark:border-slate-800/40 rounded-xl">
                Create a Verification Service first to build templates.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // 4. Incoming Requests Table View
  const renderRequestsTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Incoming Verification Requests</h2>
          <p className="text-[11px] text-slate-550 dark:text-slate-450 mt-1 font-semibold">
            Manage, approve, or reject user document verification claims.
          </p>
        </div>
        <InstitutionTable activeTab="pending" />
      </div>
    );
  };

  // 5. Institution Profile View
  const renderProfileTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Institution Profile</h2>
          <p className="text-[11px] text-slate-550 dark:text-slate-450 mt-1 font-semibold">
            Edit profile information displayed to users in discovery search.
          </p>
        </div>

        <Card className="p-6 max-w-lg bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Institution Name</label>
                <Input required value={profileName} onChange={(e) => setProfileName(e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Description</label>
                <Textarea value={profileDesc} onChange={(e) => setProfileDesc(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Category</label>
                <Select value={profileCategory} onChange={(e) => setProfileCategory(e.target.value)}>
                  <option value="University">University</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Employer">Employer</option>
                  <option value="Government">Government</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Website</label>
                <Input value={profileWebsite} onChange={(e) => setProfileWebsite(e.target.value)} placeholder="www.domain.edu" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Contact Email</label>
                <Input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Address</label>
                <Input value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" icon={Save}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  };

  // 6. Settings View
  const renderSettingsTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Institution & Notification Settings</h2>
          <p className="text-[11px] text-slate-550 dark:text-slate-450 mt-1 font-semibold">
            Manage your delivery preferences, subscribed events, and alert digests frequency.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
          {/* Delivery Section */}
          <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">1. Delivery Channels</h3>
            <div className="space-y-3.5 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-350">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.delivery.email}
                  onChange={(e) => handleSavePrefs({
                    ...notifPrefs,
                    delivery: { ...notifPrefs.delivery, email: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span>Email Alerts (Mock queued and console logged)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.delivery.inApp}
                  onChange={(e) => handleSavePrefs({
                    ...notifPrefs,
                    delivery: { ...notifPrefs.delivery, inApp: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span>In-App Banner Notifications Drawer</span>
              </label>
            </div>
          </Card>

          {/* Events Subscriptions Section */}
          <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">2. Event Alerts</h3>
            <div className="space-y-3 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-350">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.events.organization}
                  onChange={(e) => handleSavePrefs({
                    ...notifPrefs,
                    events: { ...notifPrefs.events, organization: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span>Organization Activity (New requests, templates updates)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.events.admin}
                  onChange={(e) => handleSavePrefs({
                    ...notifPrefs,
                    events: { ...notifPrefs.events, admin: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span>Administrative Override alerts</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.events.security}
                  onChange={(e) => handleSavePrefs({
                    ...notifPrefs,
                    events: { ...notifPrefs.events, security: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span>Security Warnings & Failed Link login attempts</span>
              </label>
            </div>
          </Card>

          {/* Digest Frequency Section */}
          <Card className="p-6 bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800/40 space-y-4 md:col-span-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">3. Notification Frequency</h3>
            <div className="space-y-2 pt-1 text-xs">
              <select
                value={notifPrefs.frequency}
                onChange={(e) => handleSavePrefs({
                  ...notifPrefs,
                  frequency: e.target.value
                })}
                className="w-full sm:w-64 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="Instant">Instant Delivery</option>
                <option value="Hourly">Hourly Digest Summary</option>
                <option value="Daily">Daily Digest Summary</option>
              </select>
            </div>
          </Card>
        </div>

        <div className="pt-4 max-w-4xl">
          <AIPreferences />
        </div>
      </div>
    );
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardTab();
      case 'services':
        return renderServicesTab();
      case 'templates':
        return renderTemplatesTab();
      case 'requests':
        return renderRequestsTab();
      case 'profile':
        return renderProfileTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderDashboardTab();
    }
  };

  return (
    <div className="space-y-6">
      {renderActiveView()}

      <RequestDocumentModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </div>
  );
}
