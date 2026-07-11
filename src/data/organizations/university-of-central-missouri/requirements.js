export const requirements = {
  'ucm-aviation-ms': [
    {
      type: 'Degree Certificate',
      required: true,
      details: 'Bachelor\'s degree certificate in Aviation, Science, or related field.',
      importance: 'High',
      why: 'Verifies technical aviation foundation or scientific training required for advanced safety studies.',
      satisfy: 'Upload a certified digital scan of your bachelor\'s diploma.',
      examples: ['aviation-degree.pdf', 'bs-diploma.pdf']
    },
    {
      type: 'Academic Transcript',
      required: true,
      details: 'Full transcripts from all collegiate institutions attended.',
      importance: 'High',
      why: 'Reviews prerequisites in aerodynamics, flight safety systems, and quantitative aviation metrics.',
      satisfy: 'Provide complete collegiate academic transcript PDFs.',
      examples: ['transcript-collegiate.pdf']
    },
    {
      type: 'Passport',
      required: true,
      details: 'Valid passport copy.',
      importance: 'Medium',
      why: 'Required for pilot identity verification and international aviation security compliance checks.',
      satisfy: 'Scan the main identification page containing signature, photo, and expiry.',
      examples: ['passport-data.pdf']
    }
  ],
  'ucm-cs-ms': [
    {
      type: 'Degree Certificate',
      required: true,
      details: 'Bachelor of Science in CS, Math, or Engineering fields.',
      importance: 'High',
      why: 'Confirms essential skills in computer programming, calculus, and algorithms.',
      satisfy: 'Upload your verified Bachelor of Science degree certificate.',
      examples: ['cs-degree.pdf']
    },
    {
      type: 'Academic Transcript',
      required: true,
      details: 'Official academic transcripts indicating completed coursework.',
      importance: 'High',
      why: 'Assesses specific undergraduate programming and math course performance logs.',
      satisfy: 'Submit your complete registrar-sealed academic records.',
      examples: ['official-transcript-ucm.pdf']
    },
    {
      type: 'Recommendation Letter',
      required: false,
      details: 'Two optional letters of recommendation.',
      importance: 'Low',
      why: 'Offers insight into candidates capabilities through peer supervisor reviews.',
      satisfy: 'Upload recommendation letters or list email references for system alerts.',
      examples: ['supervisor-recommendation.pdf']
    }
  ]
};
