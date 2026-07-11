// Aggregate and export all organization data modules dynamically
import * as stanfordProfile from './stanford/profile.js';
import * as stanfordPrograms from './stanford/programs.js';
import * as stanfordRequirements from './stanford/requirements.js';
import * as stanfordDeadlines from './stanford/deadlines.js';
import * as stanfordScholarships from './stanford/scholarships.js';
import * as stanfordContacts from './stanford/contacts.js';
import * as stanfordFaq from './stanford/faq.js';

import * as iowaProfile from './iowa-state/profile.js';
import * as iowaPrograms from './iowa-state/programs.js';
import * as iowaRequirements from './iowa-state/requirements.js';
import * as iowaDeadlines from './iowa-state/deadlines.js';
import * as iowaScholarships from './iowa-state/scholarships.js';
import * as iowaContacts from './iowa-state/contacts.js';
import * as iowaFaq from './iowa-state/faq.js';

import * as ucmProfile from './university-of-central-missouri/profile.js';
import * as ucmPrograms from './university-of-central-missouri/programs.js';
import * as ucmRequirements from './university-of-central-missouri/requirements.js';
import * as ucmDeadlines from './university-of-central-missouri/deadlines.js';
import * as ucmScholarships from './university-of-central-missouri/scholarships.js';
import * as ucmContacts from './university-of-central-missouri/contacts.js';
import * as ucmFaq from './university-of-central-missouri/faq.js';

export const organizationsData = {
  'org-stanford': {
    profile: stanfordProfile.profile,
    programs: stanfordPrograms.programs,
    requirements: stanfordRequirements.requirements,
    deadlines: stanfordDeadlines.deadlines,
    timelines: stanfordDeadlines.timelines,
    scholarships: stanfordScholarships.scholarships,
    contacts: stanfordContacts.contacts,
    fees: stanfordContacts.fees,
    faq: stanfordFaq.faq
  },
  'org-iowa': {
    profile: iowaProfile.profile,
    programs: iowaPrograms.programs,
    requirements: iowaRequirements.requirements,
    deadlines: iowaDeadlines.deadlines,
    timelines: iowaDeadlines.timelines,
    scholarships: iowaScholarships.scholarships,
    contacts: iowaContacts.contacts,
    fees: iowaContacts.fees,
    faq: iowaFaq.faq
  },
  'org-ucm': {
    profile: ucmProfile.profile,
    programs: ucmPrograms.programs,
    requirements: ucmRequirements.requirements,
    deadlines: ucmDeadlines.deadlines,
    timelines: ucmDeadlines.timelines,
    scholarships: ucmScholarships.scholarships,
    contacts: ucmContacts.contacts,
    fees: ucmContacts.fees,
    faq: ucmFaq.faq
  }
};

export const getOrganizationData = (orgId) => {
  return organizationsData[orgId] || null;
};

export const getAllOrganizations = () => {
  return Object.values(organizationsData).map(org => org.profile);
};
