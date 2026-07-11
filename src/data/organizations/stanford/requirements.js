export const requirements = {
  'stanford-cs-ms': [
    {
      type: 'Degree Certificate',
      required: true,
      details: 'Official Bachelor\'s degree certificate in CS or related quantitative field.',
      importance: 'High',
      why: 'Verifies completion of a foundational undergraduate education prerequisite for advanced computer science study.',
      satisfy: 'Request an official digital degree certificate from your undergraduate institution\'s registrar and upload it here.',
      examples: ['degree-certificate.pdf', 'graduation-diploma.pdf']
    },
    {
      type: 'Academic Transcript',
      required: true,
      details: 'Complete academic records from all post-secondary institutions.',
      importance: 'High',
      why: 'Allows the admissions committee to review your coursework performance, rigor, and GPA achievements.',
      satisfy: 'Obtain an official electronic transcript (eTranscript) from your university registrar portal.',
      examples: ['official-transcript.pdf', 'academic-record.pdf']
    },
    {
      type: 'English Proficiency Score',
      required: false,
      details: 'TOEFL iBT (minimum 100) or IELTS (minimum 7.5).',
      importance: 'Medium',
      why: 'Ensures applicants have the necessary language communication capability to succeed in university seminars.',
      satisfy: 'Send scores from ETS (TOEFL code 4704) and upload a copy of your test taker scorecard.',
      examples: ['toefl-scorecard.pdf', 'ielts-report.pdf']
    },
    {
      type: 'Recommendation Letter',
      required: true,
      details: 'Three letters of recommendation from academic or professional references.',
      importance: 'High',
      why: 'Provides external evaluation of your research capabilities, work ethic, and academic potential.',
      satisfy: 'Register your recommenders inside the application portal; they will receive secure direct submission links.',
      examples: ['recommendation-letter-1.pdf', 'reference-academic.pdf']
    }
  ],
  'stanford-mba': [
    {
      type: 'Degree Certificate',
      required: true,
      details: 'Official Bachelor\'s degree certificate from an accredited institution.',
      importance: 'High',
      why: 'Verifies completion of standard university-level education prerequisites.',
      satisfy: 'Provide your official bachelor\'s degree diploma or graduation certificate.',
      examples: ['diploma.pdf', 'degree-certificate.pdf']
    },
    {
      type: 'Academic Transcript',
      required: true,
      details: 'Full academic transcript history.',
      importance: 'High',
      why: 'Evaluates your intellectual capability and academic consistency during undergraduate years.',
      satisfy: 'Upload a certified PDF of your undergraduate transcripts.',
      examples: ['transcript-bachelors.pdf']
    },
    {
      type: 'Resume',
      required: true,
      details: 'A detailed resume illustrating professional accomplishments.',
      importance: 'High',
      why: 'Assesses leadership impact, career trajectory, and professional experience.',
      satisfy: 'Upload a clean, single-page professional CV in PDF format.',
      examples: ['professional-resume.pdf', 'cv.pdf']
    },
    {
      type: 'Passport',
      required: true,
      details: 'Identity proof for international verification.',
      importance: 'Medium',
      why: 'Required for global student visa compliance and identity verification audits.',
      satisfy: 'Scan the biographical data page of your valid passport and upload it securely.',
      examples: ['passport-page.jpg', 'passport-scan.pdf']
    }
  ]
};
