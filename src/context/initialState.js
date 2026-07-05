import { VERIFICATION_STATUS } from './documentUtils.js';

export const defaultOrganizationProfiles = [
  // 1. Universities
  {
    id: 'org-iowa',
    name: 'Iowa State University',
    description: 'A major public land-grant research university in Ames, Iowa.',
    category: 'University',
    logo: null,
    contactEmail: 'registrar@iastate.edu',
    website: 'www.iastate.edu',
    address: 'Ames, IA 50011',
    status: 'Active',
    supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Passport', 'Recommendation Letter', 'English Proficiency Score']
  },
  {
    id: 'org-ucm',
    name: 'University of Central Missouri',
    description: 'A public university offering comprehensive regional academic programs.',
    category: 'University',
    logo: null,
    contactEmail: 'admissions@ucmo.edu',
    website: 'www.ucmo.edu',
    address: 'Warrensburg, MO 64093',
    status: 'Active',
    supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Student ID', 'Recommendation Letter']
  },
  {
    id: 'org-msu',
    name: 'Missouri State University',
    description: 'A public university system with its main campus in Springfield, Missouri.',
    category: 'University',
    logo: null,
    contactEmail: 'records@missouristate.edu',
    website: 'www.missouristate.edu',
    address: 'Springfield, MO 65897',
    status: 'Active',
    supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Student ID']
  },
  {
    id: 'org-asu',
    name: 'Arizona State University',
    description: 'One of the largest public universities in the United States by enrollment.',
    category: 'University',
    logo: null,
    contactEmail: 'verify@asu.edu',
    website: 'www.asu.edu',
    address: 'Tempe, AZ 85281',
    status: 'Active',
    supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Student ID', 'English Proficiency Score']
  },
  {
    id: 'org-utd',
    name: 'University of Texas at Dallas',
    description: 'A public research university in the University of Texas System.',
    category: 'University',
    logo: null,
    contactEmail: 'registrar@utdallas.edu',
    website: 'www.utdallas.edu',
    address: 'Richardson, TX 75080',
    status: 'Active',
    supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Student ID']
  },
  {
    id: 'org-northeastern',
    name: 'Northeastern University',
    description: 'A private research university with its main campus in Boston, Massachusetts.',
    category: 'University',
    logo: null,
    contactEmail: 'registrar@northeastern.edu',
    website: 'www.northeastern.edu',
    address: 'Boston, MA 02115',
    status: 'Active',
    supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Student ID', 'Recommendation Letter']
  },
  {
    id: 'org-stanford',
    name: 'Stanford University',
    description: 'A private research university in Stanford, California.',
    category: 'University',
    logo: null,
    contactEmail: 'records@stanford.edu',
    website: 'www.stanford.edu',
    address: 'Stanford, CA 94305',
    status: 'Active',
    supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Student ID', 'Recommendation Letter']
  },
  {
    id: 'org-oxford',
    name: 'University of Oxford',
    description: 'A collegiate research university in Oxford, England.',
    category: 'University',
    logo: null,
    contactEmail: 'verifications@ox.ac.uk',
    website: 'www.ox.ac.uk',
    address: 'Oxford OX1 2JD, United Kingdom',
    status: 'Active',
    supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Student ID', 'Recommendation Letter']
  },
  {
    id: 'org-melbourne',
    name: 'University of Melbourne',
    description: 'A public research university located in Melbourne, Australia.',
    category: 'University',
    logo: null,
    contactEmail: 'verify@unimelb.edu.au',
    website: 'www.unimelb.edu.au',
    address: 'Melbourne VIC 3010, Australia',
    status: 'Active',
    supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Student ID', 'English Proficiency Score']
  },
  {
    id: 'org-nus',
    name: 'National University of Singapore',
    description: 'A national research university in Singapore.',
    category: 'University',
    logo: null,
    contactEmail: 'transcripts@nus.edu.sg',
    website: 'www.nus.edu.sg',
    address: '21 Lower Kent Ridge Rd, Singapore 119077',
    status: 'Active',
    supportedCredentialTypes: ['Degree Certificate', 'Academic Transcript', 'Student ID', 'English Proficiency Score']
  },

  // 2. Employers
  {
    id: 'org-microsoft',
    name: 'Microsoft',
    description: 'A global technology corporation producing software and cloud solutions.',
    category: 'Employer',
    logo: null,
    contactEmail: 'verifications@microsoft.com',
    website: 'www.microsoft.com',
    address: 'One Microsoft Way, Redmond, WA',
    status: 'Active',
    supportedCredentialTypes: ['Employment Letter', 'Experience Letter', 'Government ID', 'Resume', 'Degree Certificate']
  },
  {
    id: 'org-google',
    name: 'Google',
    description: 'A global technology company specializing in search, cloud systems, and advertising.',
    category: 'Employer',
    logo: null,
    contactEmail: 'hr-verify@google.com',
    website: 'www.google.com',
    address: '1600 Amphitheatre Pkwy, Mountain View, CA',
    status: 'Active',
    supportedCredentialTypes: ['Employment Letter', 'Experience Letter', 'Government ID', 'Resume', 'Degree Certificate']
  },
  {
    id: 'org-amazon',
    name: 'Amazon',
    description: 'A multinational technology company focusing on e-commerce and cloud computing.',
    category: 'Employer',
    logo: null,
    contactEmail: 'amazon-verify@amazon.com',
    website: 'www.amazon.com',
    address: '410 Terry Ave N, Seattle, WA',
    status: 'Active',
    supportedCredentialTypes: ['Employment Letter', 'Experience Letter', 'Government ID', 'Resume']
  },
  {
    id: 'org-deloitte',
    name: 'Deloitte',
    description: 'One of the Big Four professional services networks in the world.',
    category: 'Employer',
    logo: null,
    contactEmail: 'verify@deloitte.com',
    website: 'www.deloitte.com',
    address: '30 Rockefeller Plaza, New York, NY',
    status: 'Active',
    supportedCredentialTypes: ['Employment Letter', 'Experience Letter', 'Government ID', 'Resume']
  },
  {
    id: 'org-tcs',
    name: 'TCS',
    description: 'Tata Consultancy Services, a global IT services and consulting company.',
    category: 'Employer',
    logo: null,
    contactEmail: 'verify@tcs.com',
    website: 'www.tcs.com',
    address: 'Mittal Towers, Nariman Point, Mumbai, India',
    status: 'Active',
    supportedCredentialTypes: ['Employment Letter', 'Experience Letter', 'Government ID', 'Resume']
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
    supportedCredentialTypes: ['Employment Letter', 'Experience Letter', 'Government ID', 'Resume', 'Salary Slips']
  },
  {
    id: 'org-accenture',
    name: 'Accenture',
    description: 'A professional services company specializing in IT services and consulting.',
    category: 'Employer',
    logo: null,
    contactEmail: 'verify.accenture@accenture.com',
    website: 'www.accenture.com',
    address: 'Dublin, Ireland',
    status: 'Active',
    supportedCredentialTypes: ['Employment Letter', 'Experience Letter', 'Government ID', 'Resume']
  },
  {
    id: 'org-ibm',
    name: 'IBM',
    description: 'International Business Machines Corporation, a global technology leader.',
    category: 'Employer',
    logo: null,
    contactEmail: 'verify@ibm.com',
    website: 'www.ibm.com',
    address: 'Armonk, New York, NY',
    status: 'Active',
    supportedCredentialTypes: ['Employment Letter', 'Experience Letter', 'Government ID', 'Resume']
  },
  {
    id: 'org-capgemini',
    name: 'Capgemini',
    description: 'A global leader in partnering with companies to transform and manage their business.',
    category: 'Employer',
    logo: null,
    contactEmail: 'verify@capgemini.com',
    website: 'www.capgemini.com',
    address: 'Paris, France',
    status: 'Active',
    supportedCredentialTypes: ['Employment Letter', 'Experience Letter', 'Government ID', 'Resume']
  },
  {
    id: 'org-cognizant',
    name: 'Cognizant',
    description: 'A multinational technology company providing custom business services.',
    category: 'Employer',
    logo: null,
    contactEmail: 'verify@cognizant.com',
    website: 'www.cognizant.com',
    address: 'Teaneck, New Jersey, NJ',
    status: 'Active',
    supportedCredentialTypes: ['Employment Letter', 'Experience Letter', 'Government ID', 'Resume']
  },

  // 3. Banks & Financial Institutions
  {
    id: 'org-hdfc',
    name: 'HDFC Bank',
    description: 'Indias leading private sector bank offering financial solutions.',
    category: 'Bank',
    logo: null,
    contactEmail: 'verification@hdfcbank.com',
    website: 'www.hdfcbank.com',
    address: 'Lower Parel, Mumbai, India',
    status: 'Active',
    supportedCredentialTypes: ['Bank Statement', 'Income Certificate', 'PAN', 'Aadhaar', 'Passport', 'Admission Letter']
  },
  {
    id: 'org-sbi',
    name: 'State Bank of India',
    description: 'A public sector banking and financial services statutory body in India.',
    category: 'Bank',
    logo: null,
    contactEmail: 'verify@sbi.co.in',
    website: 'www.sbi.co.in',
    address: 'Madame Cama Road, Mumbai, India',
    status: 'Active',
    supportedCredentialTypes: ['Bank Statement', 'Income Certificate', 'PAN', 'Aadhaar', 'Passport']
  },
  {
    id: 'org-icici',
    name: 'ICICI Bank',
    description: 'A leading private sector bank in India offering commercial and personal banking services.',
    category: 'Bank',
    logo: null,
    contactEmail: 'verify@icicibank.com',
    website: 'www.icicibank.com',
    address: 'Bandra Kurla Complex, Mumbai, India',
    status: 'Active',
    supportedCredentialTypes: ['Bank Statement', 'Income Certificate', 'PAN', 'Aadhaar', 'Passport']
  },
  {
    id: 'org-axis',
    name: 'Axis Bank',
    description: 'The third-largest private sector bank in India, offering comprehensive financial suites.',
    category: 'Bank',
    logo: null,
    contactEmail: 'verify@axisbank.com',
    website: 'www.axisbank.com',
    address: 'Wadia International Centre, Mumbai, India',
    status: 'Active',
    supportedCredentialTypes: ['Bank Statement', 'Income Certificate', 'PAN', 'Aadhaar', 'Passport']
  },
  {
    id: 'org-bofa',
    name: 'Bank of America',
    description: 'A multinational investment bank and financial services holding company.',
    category: 'Bank',
    logo: null,
    contactEmail: 'verifications@bofa.com',
    website: 'www.bankofamerica.com',
    address: '100 North Tryon St, Charlotte, NC',
    status: 'Active',
    supportedCredentialTypes: ['Bank Statement', 'Income Certificate', 'PAN', 'Aadhaar', 'Passport']
  },

  // 4. Government
  {
    id: 'org-passport',
    name: 'Passport Office',
    description: 'Official national passport issuing authority.',
    category: 'Government',
    logo: null,
    contactEmail: 'passport-verify@gov.in',
    website: 'www.passportindia.gov.in',
    address: 'Patiala House, New Delhi, India',
    status: 'Active',
    supportedCredentialTypes: ['Passport', 'Birth Certificate', 'Address Proof']
  },
  {
    id: 'org-digilocker',
    name: 'DigiLocker',
    description: 'A secure cloud-based platform for storage, sharing and verification of documents.',
    category: 'Government',
    logo: null,
    contactEmail: 'support@digilocker.gov.in',
    website: 'www.digilocker.gov.in',
    address: 'Electronics Niketan, New Delhi, India',
    status: 'Active',
    supportedCredentialTypes: ['Aadhaar', 'PAN', 'Birth Certificate', 'Driver\'s License']
  },
  {
    id: 'org-uidai',
    name: 'UIDAI',
    description: 'Unique Identification Authority of India managing Aadhaar identities.',
    category: 'Government',
    logo: null,
    contactEmail: 'aadhaar-verify@uidai.gov.in',
    website: 'www.uidai.gov.in',
    address: 'Bangla Road, New Delhi, India',
    status: 'Active',
    supportedCredentialTypes: ['Aadhaar', 'Address Proof', 'Birth Certificate']
  },
  {
    id: 'org-mea',
    name: 'Ministry of External Affairs',
    description: 'Government ministry responsible for international relations and document apostilles.',
    category: 'Government',
    logo: null,
    contactEmail: 'apostille-verify@mea.gov.in',
    website: 'www.mea.gov.in',
    address: 'South Block, New Delhi, India',
    status: 'Active',
    supportedCredentialTypes: ['Passport', 'Aadhaar', 'Birth Certificate', 'Degree Certificate']
  },
  {
    id: 'org-itax',
    name: 'Income Tax Department',
    description: 'Government revenue agency responsible for collecting taxes and verifying income returns.',
    category: 'Government',
    logo: null,
    contactEmail: 'verify@incometax.gov.in',
    website: 'www.incometaxindia.gov.in',
    address: 'Connaught Place, New Delhi, India',
    status: 'Active',
    supportedCredentialTypes: ['PAN', 'Tax Return', 'Income Certificate']
  },

  // 5. Professional Certification Bodies
  {
    id: 'org-aws',
    name: 'AWS Training & Certification',
    description: 'Global cloud learning and credentials validation agency by Amazon Web Services.',
    category: 'Certification Body',
    logo: null,
    contactEmail: 'certification-verify@amazon.com',
    website: 'aws.amazon.com/certification',
    address: '410 Terry Ave N, Seattle, WA',
    status: 'Active',
    supportedCredentialTypes: ['Professional Certificate', 'Candidate ID', 'Exam Score Report']
  },
  {
    id: 'org-mslearn',
    name: 'Microsoft Learn',
    description: 'Microsoft learning platform providing certifications and credential verifications.',
    category: 'Certification Body',
    logo: null,
    contactEmail: 'verify@microsoft.com',
    website: 'learn.microsoft.com',
    address: 'One Microsoft Way, Redmond, WA',
    status: 'Active',
    supportedCredentialTypes: ['Professional Certificate', 'Candidate ID']
  },
  {
    id: 'org-cisco',
    name: 'Cisco Networking Academy',
    description: 'IT skills and career building certifications program.',
    category: 'Certification Body',
    logo: null,
    contactEmail: 'academy-verify@cisco.com',
    website: 'www.netacad.com',
    address: '170 West Tasman Dr, San Jose, CA',
    status: 'Active',
    supportedCredentialTypes: ['Professional Certificate', 'Candidate ID', 'Exam Score Report']
  },
  {
    id: 'org-oracle',
    name: 'Oracle University',
    description: 'Global learning platform for Oracle technology certifications and badges.',
    category: 'Certification Body',
    logo: null,
    contactEmail: 'verify@oracle.com',
    website: 'education.oracle.com',
    address: 'Redwood Shores, California, CA',
    status: 'Active',
    supportedCredentialTypes: ['Professional Certificate', 'Candidate ID']
  },
  {
    id: 'org-comptia',
    name: 'CompTIA',
    description: 'Computing Technology Industry Association providing professional certifications.',
    category: 'Certification Body',
    logo: null,
    contactEmail: 'verify@comptia.org',
    website: 'www.comptia.org',
    address: 'Downers Grove, Illinois, IL',
    status: 'Active',
    supportedCredentialTypes: ['Professional Certificate', 'Candidate ID', 'Exam Score Report']
  }
];

export const defaultVerificationServices = [
  // Iowa State University Services
  {
    id: 'service-iowa-degree',
    organizationId: 'org-iowa',
    name: 'Degree Verification',
    description: 'Official verification of degrees and graduation records.',
    status: 'Published'
  },
  // UCM Services
  {
    id: 'service-ucm-admission',
    organizationId: 'org-ucm',
    name: 'Student Admission',
    description: 'Verify transcripts and identities for university admissions.',
    status: 'Published'
  },
  // Stanford Services
  {
    id: 'service-stanford-degree',
    organizationId: 'org-stanford',
    name: 'Degree Verification',
    description: 'Verify degree certificate validity.',
    status: 'Published'
  },
  // Microsoft Services
  {
    id: 'service-microsoft-employ',
    organizationId: 'org-microsoft',
    name: 'Employment Verification',
    description: 'Validate candidate resume records and official degrees.',
    status: 'Published'
  },
  // HDFC Services
  {
    id: 'service-hdfc-loan',
    organizationId: 'org-hdfc',
    name: 'Education Loan Processing',
    description: 'Verify student admission documents, passport details, and family income certificates.',
    status: 'Published'
  },
  // Passport Office Services
  {
    id: 'service-passport-verify',
    organizationId: 'org-passport',
    name: 'Identity Verification',
    description: 'Verify official passport identity cards and birth certificates.',
    status: 'Published'
  },
  // AWS Services
  {
    id: 'service-aws-verify',
    organizationId: 'org-aws',
    name: 'AWS Badge Validation',
    description: 'Verify candidate professional cloud certifications.',
    status: 'Published'
  }
];

export const defaultCredentialTemplates = [
  // Iowa State University Templates
  {
    id: 'template-iowa-degree',
    serviceId: 'service-iowa-degree',
    requiredCredentials: [
      { type: 'Degree Certificate', required: true, maxFileSize: 5242880, acceptedFileTypes: ['.pdf'] },
      { type: 'Academic Transcript', required: true, maxFileSize: 5242880, acceptedFileTypes: ['.pdf'] },
      { type: 'Passport', required: true, maxFileSize: 2097152, acceptedFileTypes: ['.pdf', '.png', '.jpg'] }
    ],
    optionalCredentials: [
      { type: 'Recommendation Letter', required: false, maxFileSize: 2097152, acceptedFileTypes: ['.pdf'] },
      { type: 'English Proficiency Score', required: false, maxFileSize: 2097152, acceptedFileTypes: ['.pdf'] }
    ],
    instructions: 'Upload your final degree certificate, academic transcript, and passport copy.'
  },
  // UCM Templates
  {
    id: 'template-ucm-admission',
    serviceId: 'service-ucm-admission',
    requiredCredentials: [
      { type: 'Academic Transcript', required: true, maxFileSize: 5242880, acceptedFileTypes: ['.pdf'] },
      { type: 'Passport', required: true, maxFileSize: 2097152, acceptedFileTypes: ['.pdf', '.png', '.jpg'] }
    ],
    optionalCredentials: [
      { type: 'Recommendation Letter', required: false, maxFileSize: 2097152, acceptedFileTypes: ['.pdf'] }
    ],
    instructions: 'Please upload transcript and identity proof.'
  },
  // Microsoft Templates
  {
    id: 'template-microsoft-employ',
    serviceId: 'service-microsoft-employ',
    requiredCredentials: [
      { type: 'Degree Certificate', required: true, maxFileSize: 5242880, acceptedFileTypes: ['.pdf'] },
      { type: 'Resume', required: true, maxFileSize: 2097152, acceptedFileTypes: ['.pdf'] },
      { type: 'Government ID', required: true, maxFileSize: 2097152, acceptedFileTypes: ['.pdf', '.png'] }
    ],
    optionalCredentials: [
      { type: 'Experience Letter', required: false, maxFileSize: 5242880, acceptedFileTypes: ['.pdf'] }
    ],
    instructions: 'Submit degree and resume profiles.'
  },
  // HDFC Templates
  {
    id: 'template-hdfc-loan',
    serviceId: 'service-hdfc-loan',
    requiredCredentials: [
      { type: 'Admission Letter', required: true, maxFileSize: 5242880, acceptedFileTypes: ['.pdf'] },
      { type: 'Passport', required: true, maxFileSize: 2097152, acceptedFileTypes: ['.pdf', '.png'] },
      { type: 'PAN', required: true, maxFileSize: 2097152, acceptedFileTypes: ['.pdf', '.png'] },
      { type: 'Aadhaar', required: true, maxFileSize: 2097152, acceptedFileTypes: ['.pdf', '.png'] },
      { type: 'Income Certificate', required: true, maxFileSize: 5242880, acceptedFileTypes: ['.pdf'] }
    ],
    optionalCredentials: [
      { type: 'Bank Statement', required: false, maxFileSize: 10485760, acceptedFileTypes: ['.pdf'] }
    ],
    instructions: 'Submit your education loan application records.'
  },
  // Passport Templates
  {
    id: 'template-passport-verify',
    serviceId: 'service-passport-verify',
    requiredCredentials: [
      { type: 'Passport', required: true, maxFileSize: 2097152, acceptedFileTypes: ['.pdf', '.png'] },
      { type: 'Birth Certificate', required: true, maxFileSize: 2097152, acceptedFileTypes: ['.pdf', '.png'] }
    ],
    optionalCredentials: [
      { type: 'Address Proof', required: false, maxFileSize: 2097152, acceptedFileTypes: ['.pdf'] }
    ],
    instructions: 'Provide official passport and birth records.'
  },
  // AWS Templates
  {
    id: 'template-aws-verify',
    serviceId: 'service-aws-verify',
    requiredCredentials: [
      { type: 'Professional Certificate', required: true, maxFileSize: 2097152, acceptedFileTypes: ['.pdf', '.png'] },
      { type: 'Candidate ID', required: true, maxFileSize: 102400, acceptedFileTypes: ['.pdf'] }
    ],
    optionalCredentials: [
      { type: 'Exam Score Report', required: false, maxFileSize: 10485760, acceptedFileTypes: ['.pdf'] }
    ],
    instructions: 'Submit cloud certification proof.'
  }
];

export const globalCredentialCatalog = [
  "Passport",
  "Aadhaar",
  "PAN",
  "Driver's License",
  "Birth Certificate",
  "Degree Certificate",
  "Academic Transcript",
  "Student ID",
  "Admission Letter",
  "Enrollment Certificate",
  "Resume",
  "Experience Letter",
  "Internship Certificate",
  "Employment Letter",
  "Salary Slips",
  "Income Certificate",
  "Bank Statement",
  "Tax Return",
  "Visa",
  "IELTS Score",
  "TOEFL Score",
  "DET Score",
  "Recommendation Letter",
  "Research Paper",
  "Professional Certificate",
  "Police Clearance Certificate",
  "Utility Bill",
  "Address Proof",
  "Photograph",
  "Signature"
];

export function createInitialDocumentState(uid) {
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
