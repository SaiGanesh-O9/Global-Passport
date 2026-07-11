import React, { useState } from 'react';
import { useOrganizations } from '../context/OrganizationContext.jsx';
import OrganizationCard from '../components/organizations/OrganizationCard.jsx';
import OrganizationSearch from '../components/organizations/OrganizationSearch.jsx';
import OrganizationProfile from './OrganizationProfile.jsx';
import Card from '../components/ui/Card.jsx';

export default function OrganizationsPage() {
  const { filteredOrganizations, selectedOrgId, setSelectedOrgId } = useOrganizations();
  const [activeCategory, setActiveCategory] = useState('All');

  // Filter filteredOrganizations list further by selected category pill
  const categorizedOrganizations = React.useMemo(() => {
    if (activeCategory === 'All') return filteredOrganizations;
    return filteredOrganizations.filter(org => org.category === activeCategory);
  }, [filteredOrganizations, activeCategory]);

  // If an organization profile is selected, render the profile view
  if (selectedOrgId) {
    return <OrganizationProfile />;
  }

  return (
    <div className="space-y-6">
      {/* Title Header Card */}
      <Card className="p-6 sm:p-8 bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/5 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/10">
            Partner Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight pt-1">
            Explore Certified Organizations
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            Verify academic, employment, identity, or financial credentials with accredited global partners in one unified platform.
          </p>
        </div>
      </Card>

      {/* Search and Filters Bar */}
      <OrganizationSearch activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

      {/* Directory Grid */}
      {categorizedOrganizations.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categorizedOrganizations.map((org) => (
            <div key={org.id} className="h-full">
              <OrganizationCard
                org={org}
                onClick={() => setSelectedOrgId(org.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800/50 rounded-2xl bg-white dark:bg-[#12131a]/20">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            No matching institutions or programs found.
          </p>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Try adjusting your search filters or queries.
          </p>
        </div>
      )}
    </div>
  );
}
