export const requirements = {
  'iowa-mechanical-ms': [
    {
      type: 'Degree Certificate',
      required: true,
      details: 'Bachelor of Science degree in Engineering or related fields.',
      importance: 'High',
      why: 'Verifies the completion of foundational math, physics, and basic engineering design coursework.',
      satisfy: 'Upload your official engineering degree diploma certificate.',
      examples: ['engineering-degree.pdf', 'diploma-mechanical.pdf']
    },
    {
      type: 'Academic Transcript',
      required: true,
      details: 'Full academic history indicating official coursework and degree award.',
      importance: 'High',
      why: 'Confirms completion of prerequisite upper-level engineering courses with adequate grade records.',
      satisfy: 'Request an official electronic transcript from your home university registrar.',
      examples: ['transcript-full.pdf']
    },
    {
      type: 'Passport',
      required: true,
      details: 'Identity validation documents.',
      importance: 'Medium',
      why: 'Required for SEVIS and student visa processing for international candidates.',
      satisfy: 'Scan and upload a clear PDF of your valid passport details page.',
      examples: ['passport-id.pdf']
    }
  ],
  'iowa-civil-ms': [
    {
      type: 'Degree Certificate',
      required: true,
      details: 'Bachelor\'s degree certificate in Civil Engineering or related field.',
      importance: 'High',
      why: 'Confirms foundational structural and environmental engineering background prerequisites.',
      satisfy: 'Provide your certified undergraduate degree diploma.',
      examples: ['degree-civil.pdf']
    },
    {
      type: 'Academic Transcript',
      required: true,
      details: 'Official transcripts reflecting a GPA of 3.0/4.0 or above.',
      importance: 'High',
      why: 'Assesses applicant capabilities across advanced core structural analysis courses.',
      satisfy: 'Request transcripts directly via Parchment or registrar networks to your vault.',
      examples: ['official-transcript-civil.pdf']
    },
    {
      type: 'Recommendation Letter',
      required: false,
      details: 'Optional letters from academic supervisors.',
      importance: 'Low',
      why: 'Supports candidacy evaluation with additional professional peer letters.',
      satisfy: 'Optionally request a reference link or upload a signed letter of support.',
      examples: ['recommendation-civil.pdf']
    }
  ]
};
