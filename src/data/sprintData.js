export const userVerificationRequests = [
  {
    requestedOrganization: 'Northbridge University',
    purpose: 'Degree Verification',
    credentialType: 'Degree Certificate',
    requestDate: 'Jul 02, 2026',
    status: 'Completed',
  },
  {
    requestedOrganization: 'BrightPath Labs',
    purpose: 'Employment Verification',
    credentialType: 'Employment Record',
    requestDate: 'Jul 03, 2026',
    status: 'Pending',
  },
  {
    requestedOrganization: 'City Civic Office',
    purpose: 'Identity Verification',
    credentialType: 'Address Proof',
    requestDate: 'Jun 28, 2026',
    status: 'Rejected',
  },
];

export const organizationInboxRequests = [
  {
    requester: 'Aarav Sharma',
    requestingOrganization: 'Horizon Bank',
    credentialType: 'Transcript',
    requestedOrganization: 'Northbridge University',
    requestDate: 'Jul 04, 2026',
    status: 'Pending',
  },
  {
    requester: 'Meera Iyer',
    requestingOrganization: 'Summit Insurance',
    credentialType: 'Enrollment Letter',
    requestedOrganization: 'Northbridge University',
    requestDate: 'Jul 03, 2026',
    status: 'Pending',
  },
  {
    requester: 'Dev Patel',
    requestingOrganization: 'Atlas Employers',
    credentialType: 'Degree Certificate',
    requestedOrganization: 'Northbridge University',
    requestDate: 'Jul 01, 2026',
    status: 'Pending',
  },
];

export const industryUseCases = [
  {
    industry: 'Hiring',
    title: 'Degree Verification',
    description: 'Employers request degree verification directly from universities.',
  },
  {
    industry: 'Healthcare',
    title: 'Medical Record Verification',
    description: 'Hospitals and insurers verify medical credentials at the source.',
  },
  {
    industry: 'Education',
    title: 'Transcript Verification',
    description: 'Universities confirm academic records without repeated manual checks.',
  },
  {
    industry: 'Banking',
    title: 'Income Verification',
    description: 'Banks request verified income and employment details from trusted organizations.',
  },
  {
    industry: 'Insurance',
    title: 'Claim Verification',
    description: 'Insurance companies validate claims through authorized verification workflows.',
  },
  {
    industry: 'Government',
    title: 'Identity Verification',
    description: 'Government agencies request identity verification from issuing organizations.',
  },
];
