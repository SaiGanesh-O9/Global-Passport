import React, { useMemo } from 'react';
import { useOrganizations } from '../../context/OrganizationContext.jsx';
import OrganizationCard from './OrganizationCard.jsx';

export default function SimilarOrganizations({ currentOrg, onOrgSelect }) {
  const { organizationsList } = useOrganizations();

  const similarList = useMemo(() => {
    if (!currentOrg) return [];

    return organizationsList
      .filter(org => org.id !== currentOrg.id) // exclude current
      .map(org => {
        let score = 0;
        // Match category
        if (org.category === currentOrg.category) score += 3;
        // Match country
        if (org.country === currentOrg.country) score += 2;
        // Match state
        if (org.state && org.state === currentOrg.state) score += 1;

        return { org, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.org);
  }, [currentOrg, organizationsList]);

  if (similarList.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
          Similar Institutions
        </h3>
        <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
          Explore similar certified organizations and verification providers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {similarList.map((org) => (
          <OrganizationCard
            key={org.id}
            org={org}
            onClick={() => onOrgSelect(org.id)}
          />
        ))}
      </div>
    </div>
  );
}
