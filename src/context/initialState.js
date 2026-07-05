import { VERIFICATION_STATUS } from './documentUtils.js';

export const defaultOrganizationProfiles = [
  {
    id: 'org-northbridge',
    name: 'Northbridge University',
    description: 'A leading public research university specializing in science, technology, and engineering.',
    category: 'University',
    logo: null,
    contactEmail: 'admissions@northbridge.edu',
    website: 'www.northbridge.edu',
    address: '100 University Ave, Northbridge, NB',
    status: 'Active',
    supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Passport', 'Academic Essay']
  },
  {
    id: 'org-apollo',
    name: 'Apollo Hospitals',
    description: "One of Asia's largest healthcare groups offering multi-specialty clinical care.",
    category: 'Hospital',
    logo: null,
    contactEmail: 'verification@apollohospitals.com',
    website: 'www.apollohospitals.com',
    address: '25 Medical Road, Apollo City',
    status: 'Active',
    supportedCredentialTypes: ['Medical License', 'Government Certificate']
  },
  {
    id: 'org-infosys',
    name: 'Infosys',
    description: 'A global leader in next-generation digital services and consulting.',
    category: 'Employer',
    logo: null,
    contactEmail: 'hr.verification@infosys.com',
    website: 'www.infosys.com',
    address: 'Electronics City, Bangalore, India',
    status: 'Active',
    supportedCredentialTypes: ['Employment Certificate', 'Professional Certification']
  }
];

export const defaultVerificationServices = [
  {
    id: 'service-degree',
    organizationId: 'org-northbridge',
    name: 'Degree Verification',
    description: 'Verify official student degrees and graduation records.',
    status: 'Published'
  },
  {
    id: 'service-admission',
    organizationId: 'org-northbridge',
    name: 'Student Admission',
    description: 'Submit academic transcripts and identities for admissions verification.',
    status: 'Published'
  },
  {
    id: 'service-scholarship',
    organizationId: 'org-northbridge',
    name: 'Scholarship Verification',
    description: 'Verify eligibility records for university scholarships.',
    status: 'Published'
  }
];

export const defaultCredentialTemplates = [
  {
    id: 'template-degree',
    serviceId: 'service-degree',
    requiredCredentials: [
      { type: 'Degree Certificate', required: true, maxFileSize: 5242880, acceptedFileTypes: ['.pdf'] },
      { type: 'Transcript', required: true, maxFileSize: 5242880, acceptedFileTypes: ['.pdf'] }
    ],
    optionalCredentials: [
      { type: 'Passport', required: false, maxFileSize: 2097152, acceptedFileTypes: ['.pdf', '.png', '.jpg'] }
    ],
    instructions: 'Please upload your official degree certificate and academic transcript.'
  },
  {
    id: 'template-admission',
    serviceId: 'service-admission',
    requiredCredentials: [
      { type: 'Transcript', required: true, maxFileSize: 5242880, acceptedFileTypes: ['.pdf'] },
      { type: 'Passport', required: true, maxFileSize: 2097152, acceptedFileTypes: ['.pdf', '.png', '.jpg'] }
    ],
    optionalCredentials: [
      { type: 'Academic Essay', required: false, maxFileSize: 10485760, acceptedFileTypes: ['.pdf'] }
    ],
    instructions: 'Upload your final transcripts and a valid passport copy.'
  },
  {
    id: 'template-scholarship',
    serviceId: 'service-scholarship',
    requiredCredentials: [
      { type: 'Academic Essay', required: true, maxFileSize: 10485760, acceptedFileTypes: ['.pdf'] },
      { type: 'Transcript', required: true, maxFileSize: 5242880, acceptedFileTypes: ['.pdf'] }
    ],
    optionalCredentials: [
      { type: 'Government Certificate', required: false, maxFileSize: 2097152, acceptedFileTypes: ['.pdf', '.png', '.jpg'] }
    ],
    instructions: 'Submit your scholarship essay and academic records.'
  }
];

export function createInitialDocumentState(uid) {
  // Static seed values for student credentials
  const defaultCredentials = [
    {
      id: 'cred-essay',
      type: 'Academic Essay',
      ownerEmail: 'student@localhost',
      status: 'Approved',
      verifiedAt: 'Jun 15, 2026',
      verifiedBy: 'Northbridge University',
      expiresAt: 'Jun 15, 2030',
      isReusable: true,
      isExpired: false
    },
    {
      id: 'cred-passport',
      type: 'Passport',
      ownerEmail: 'student@localhost',
      status: 'Approved',
      verifiedAt: 'Jun 10, 2026',
      verifiedBy: 'City Civic Office',
      expiresAt: 'Jun 10, 2030',
      isReusable: true,
      isExpired: false
    },
    {
      id: 'cred-degree',
      type: 'Degree Certificate',
      ownerEmail: 'student@localhost',
      status: 'Approved',
      verifiedAt: 'Jul 02, 2026',
      verifiedBy: 'Northbridge University',
      expiresAt: 'Jul 02, 2030',
      isReusable: true,
      isExpired: false
    }
  ];

  const defaultDocuments = [
    {
      id: 'doc-essay',
      credentialId: 'cred-essay',
      fileName: 'academic-essay.pdf',
      fileUrl: '',
      version: 1,
      uploadedAt: 'Jun 15, 2026',
      uploadMode: 'local',
      storageStatus: 'disabled'
    },
    {
      id: 'doc-passport',
      credentialId: 'cred-passport',
      fileName: 'passport.pdf',
      fileUrl: '',
      version: 1,
      uploadedAt: 'Jun 10, 2026',
      uploadMode: 'local',
      storageStatus: 'disabled'
    },
    {
      id: 'doc-degree',
      credentialId: 'cred-degree',
      fileName: 'degree-certificate.pdf',
      fileUrl: '',
      version: 1,
      uploadedAt: 'Jul 02, 2026',
      uploadMode: 'local',
      storageStatus: 'disabled'
    }
  ];

  return {
    organizationProfiles: defaultOrganizationProfiles,
    verificationServices: defaultVerificationServices,
    credentialTemplates: defaultCredentialTemplates,
    credentials: defaultCredentials,
    documents: defaultDocuments,
    verificationRequests: []
  };
}
