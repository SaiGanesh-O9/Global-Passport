import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { organizationsData, getAllOrganizations } from '../data/organizations/index.js';

const OrganizationContext = createContext(null);

export const OrganizationProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState(null);

  // Sync hash routing on mounting and hashchange
  useEffect(() => {
    const syncWithHash = () => {
      const hash = window.location.hash || '';
      if (hash.startsWith('#organizations')) {
        const query = hash.split('?')[1] || '';
        const params = new URLSearchParams(query);
        const orgId = params.get('id') || null;
        const progId = params.get('program') || null;
        
        setSelectedOrgId(orgId);
        setSelectedProgramId(progId);
      }
    };

    syncWithHash();
    window.addEventListener('hashchange', syncWithHash);
    return () => window.removeEventListener('hashchange', syncWithHash);
  }, []);

  // List of all organization profiles
  const organizationsList = useMemo(() => getAllOrganizations(), []);

  // Detailed data of the selected organization
  const selectedOrgData = useMemo(() => {
    if (!selectedOrgId) return null;
    return organizationsData[selectedOrgId] || null;
  }, [selectedOrgId]);

  // Selected program details
  const selectedProgramData = useMemo(() => {
    if (!selectedProgramId || !selectedOrgData) return null;
    return (selectedOrgData.programs || []).find(p => p.id === selectedProgramId) || null;
  }, [selectedProgramId, selectedOrgData]);

  // Selected requirements
  const selectedRequirements = useMemo(() => {
    if (!selectedProgramId || !selectedOrgData) return null;
    return (selectedOrgData.requirements || {})[selectedProgramId] || null;
  }, [selectedProgramId, selectedOrgData]);

  // Scoped AI context payload
  const aiContext = useMemo(() => {
    if (!selectedOrgId) return null;
    const orgProf = selectedOrgData?.profile || null;
    return {
      currentOrg: orgProf ? {
        id: orgProf.id,
        name: orgProf.name,
        category: orgProf.category,
        website: orgProf.website,
        country: orgProf.country,
        state: orgProf.state
      } : null,
      currentProgram: selectedProgramData ? {
        id: selectedProgramData.id,
        name: selectedProgramData.name,
        degree: selectedProgramData.degree,
        tuition: selectedProgramData.tuition,
        duration: selectedProgramData.duration
      } : null,
      currentRequirementSet: selectedRequirements || null
    };
  }, [selectedOrgId, selectedOrgData, selectedProgramData, selectedRequirements]);

  // Perform search across organizations, programs, requirements, and scholarships
  const filteredOrganizations = useMemo(() => {
    if (!searchQuery) return organizationsList;
    const query = searchQuery.toLowerCase();

    return organizationsList.filter(org => {
      // 1. Check profile attributes
      const nameMatch = org.name.toLowerCase().includes(query);
      const descMatch = (org.description || '').toLowerCase().includes(query);
      const categoryMatch = (org.category || '').toLowerCase().includes(query);
      const tagsMatch = (org.searchTags || []).some(t => t.toLowerCase().includes(query));
      if (nameMatch || descMatch || categoryMatch || tagsMatch) return true;

      // Get detailed data to search programs/scholarships/requirements
      const details = organizationsData[org.id];
      if (!details) return false;

      // 2. Check programs
      const programMatch = (details.programs || []).some(prog => 
        prog.name.toLowerCase().includes(query) || 
        prog.description.toLowerCase().includes(query) ||
        prog.degree.toLowerCase().includes(query)
      );
      if (programMatch) return true;

      // 3. Check scholarships
      const scholarshipMatch = (details.scholarships || []).some(s =>
        s.name.toLowerCase().includes(query) ||
        s.eligibility.toLowerCase().includes(query)
      );
      if (scholarshipMatch) return true;

      // 4. Check requirements
      const requirementMatch = Object.values(details.requirements || {}).some(reqList =>
        reqList.some(req => req.type.toLowerCase().includes(query) || req.details.toLowerCase().includes(query))
      );
      if (requirementMatch) return true;

      return false;
    });
  }, [searchQuery, organizationsList]);

  return (
    <OrganizationContext.Provider value={{
      searchQuery,
      setSearchQuery,
      selectedOrgId,
      setSelectedOrgId,
      selectedProgramId,
      setSelectedProgramId,
      selectedOrgData,
      selectedProgramData,
      selectedRequirements,
      aiContext,
      filteredOrganizations,
      organizationsList
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganizations = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganizations must be used within an OrganizationProvider');
  }
  return context;
};
