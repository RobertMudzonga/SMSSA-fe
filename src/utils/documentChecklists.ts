export interface DocumentRequirement {
  name: string;
  category: string;
  isRequired: boolean;
  note?: string;
}

export const documentChecklists: Record<string, DocumentRequirement[]> = {
  'Visitors Visa 11(1)': [
    { name: 'Passport copy', category: 'Identity Documents', isRequired: true },
    { name: 'Letter of motivation for the visitors visa', category: 'Letters', isRequired: true, note: 'Will be drafted by us' },
    { name: 'Letter of support for the visitors visa', category: 'Letters', isRequired: true, note: 'Will be drafted by us' },
    { name: 'Passport + visa of Sponsor', category: 'Sponsor Documents', isRequired: true },
    { name: '3 months Bank statement of Sponsor', category: 'Financial Documents', isRequired: true },
    { name: 'Proof of address', category: 'Supporting Documents', isRequired: true },
    { name: 'Return Flight ticket reservation', category: 'Travel Documents', isRequired: true, note: 'We will assist' },
    { name: 'Sponsor\'s 3 months Bank statement', category: 'Financial Documents', isRequired: true }
  ],
  
  'Visitors Visa Extension': [
    { name: 'Passport copy', category: 'Identity Documents', isRequired: true },
    { name: 'Current visa/entry stamp', category: 'Identity Documents', isRequired: true },
    { name: 'Letter of motivation for extension', category: 'Letters', isRequired: true, note: 'We will draft. Just provide reason for extension' },
    { name: 'Letter of support from sponsor', category: 'Letters', isRequired: true },
    { name: 'Letter of consent by parent', category: 'Letters', isRequired: false, note: 'If applicable' },
    { name: 'Passport + visa of Parent/Sponsor', category: 'Sponsor Documents', isRequired: true },
    { name: '3 months Bank statement of Parent/Sponsor', category: 'Financial Documents', isRequired: true },
    { name: 'Proof of address', category: 'Supporting Documents', isRequired: true },
    { name: 'Return Flight ticket reservation', category: 'Travel Documents', isRequired: true },
    { name: 'Parent/Sponsor\'s 3 months Bank statement', category: 'Financial Documents', isRequired: true }
  ],
  
  'Critical Skills Work Visa': [
    { name: 'Application form', category: 'Application Forms', isRequired: true, note: 'We assist' },
    { name: 'Copy of Passport of Applicant', category: 'Identity Documents', isRequired: true },
    { name: 'Current visa', category: 'Identity Documents', isRequired: true },
    { name: 'Medical report', category: 'Medical Documents', isRequired: true, note: 'Attend GP or medical practitioner for general check-up' },
    { name: 'Radiology waiver', category: 'Medical Documents', isRequired: true },
    { name: 'Police clearance certificate', category: 'Background Checks', isRequired: true, note: 'From each country lived in for 12+ months (18+ years only)' },
    { name: 'Marriage certificate', category: 'Personal Documents', isRequired: false, note: 'If applicable' },
    { name: 'Birth certificate', category: 'Personal Documents', isRequired: true },
    { name: 'Qualifications', category: 'Educational Documents', isRequired: true },
    { name: 'CV', category: 'Professional Documents', isRequired: true, note: 'Word version' },
    { name: 'Reference letters (at least 2)', category: 'Professional Documents', isRequired: true },
    { name: 'SAQA Evaluation Certificate', category: 'Educational Documents', isRequired: true, note: 'Foreign qualifications only' },
    { name: 'Proof of Registration with SAQA accredited Body', category: 'Professional Documents', isRequired: true, note: 'We assist' },
    { name: 'Letter from SAQA accredited body confirming Skill', category: 'Professional Documents', isRequired: true, note: 'We assist' },
    { name: 'Contract of employment / Offer of employment', category: 'Employment Documents', isRequired: true },
    { name: 'Repatriation undertaking from employer', category: 'Employment Documents', isRequired: true, note: 'See template' },
    { name: 'Company registration documents (CIPC)', category: 'Employment Documents', isRequired: true },
    { name: 'Letter of good standing from Department of Labour', category: 'Employment Documents', isRequired: true },
    { name: '3 Months bank statement', category: 'Financial Documents', isRequired: true, note: 'Balance of R8500 reflecting' }
  ],
  
  'Critical Skills Visa - Zim Submission': [
    { name: 'Application form', category: 'Application Forms', isRequired: true, note: 'We assist' },
    { name: '2 Passport sized photos', category: 'Identity Documents', isRequired: true },
    { name: 'Copy of Passport of Applicant', category: 'Identity Documents', isRequired: true },
    { name: 'Current visa/Legalization', category: 'Identity Documents', isRequired: true },
    { name: 'Medical report', category: 'Medical Documents', isRequired: true, note: 'Attend GP or medical practitioner for general check-up' },
    { name: 'Radiology waiver', category: 'Medical Documents', isRequired: true },
    { name: 'Police clearance certificate', category: 'Background Checks', isRequired: true, note: 'From each country lived in for 12+ months (18+ years only)' },
    { name: 'Marriage certificate', category: 'Personal Documents', isRequired: false, note: 'If applicable' },
    { name: 'Birth certificate', category: 'Personal Documents', isRequired: true },
    { name: 'Qualifications (including O\'level)', category: 'Educational Documents', isRequired: true, note: 'Certified in Zimbabwe' },
    { name: 'CV', category: 'Professional Documents', isRequired: true, note: 'Word version' },
    { name: 'Reference letters (at least 2)', category: 'Professional Documents', isRequired: true },
    { name: 'SAQA Evaluation Certificate', category: 'Educational Documents', isRequired: true, note: 'Foreign qualifications only' },
    { name: 'Proof of Registration with SAQA accredited Body', category: 'Professional Documents', isRequired: true, note: 'We assist' },
    { name: 'Letter from SAQA accredited body confirming Skill', category: 'Professional Documents', isRequired: true, note: 'We assist' },
    { name: 'Contract of employment', category: 'Employment Documents', isRequired: true },
    { name: 'Offer of employment', category: 'Employment Documents', isRequired: true },
    { name: 'MIE evaluation', category: 'Educational Documents', isRequired: true },
    { name: 'Letter of support from sponsor', category: 'Sponsor Documents', isRequired: true },
    { name: 'ID copy from sponsor', category: 'Sponsor Documents', isRequired: true },
    { name: 'Repatriation undertaking from employer', category: 'Employment Documents', isRequired: true, note: 'See template' },
    { name: 'Company registration documents (CIPC)', category: 'Employment Documents', isRequired: true },
    { name: 'Letter of good standing from Department of Labour', category: 'Employment Documents', isRequired: true },
    { name: '3 Months bank statement with bank stamp', category: 'Financial Documents', isRequired: true, note: 'Balance of R8500 reflecting' }
  ],
  
  'Accompanying Dependent (Spouse)': [
    { name: 'Application form', category: 'Application Forms', isRequired: true, note: 'We assist' },
    { name: '2 passport sized photos', category: 'Identity Documents', isRequired: true },
    { name: 'Passport of Applicant', category: 'Identity Documents', isRequired: true },
    { name: 'Current visa', category: 'Identity Documents', isRequired: true },
    { name: 'Medical Report', category: 'Medical Documents', isRequired: true },
    { name: 'Radiological waiver', category: 'Medical Documents', isRequired: true },
    { name: 'Police clearance certificate from country of origin', category: 'Background Checks', isRequired: true },
    { name: 'Letter of Support from Spouse', category: 'Letters', isRequired: true, note: 'We will draft it' },
    { name: 'Passport + Visa copy of Spouse', category: 'Spouse Documents', isRequired: true },
    { name: 'Marriage Certificate / Notarial Contract OR Life Partnership Agreement', category: 'Relationship Documents', isRequired: true },
    { name: 'Proof of address', category: 'Supporting Documents', isRequired: true, note: 'Lease agreement, utility bills, or WiFi bill' },
    { name: 'Proof of Shared Financial responsibilities', category: 'Relationship Documents', isRequired: true, note: 'Documents with both names: birth certificate, car insurance, medical aid, wills' },
    { name: 'Spouse 3 months\' bank statement', category: 'Financial Documents', isRequired: true, note: 'Minimum balance of R8500' }
  ],
  
  'Spouse Visa': [
    { name: 'Application form', category: 'Application Forms', isRequired: true, note: 'We assist' },
    { name: '2 passport sized photos', category: 'Identity Documents', isRequired: true },
    { name: 'Copy of Passport of Applicant', category: 'Identity Documents', isRequired: true },
    { name: 'Current visa', category: 'Identity Documents', isRequired: true },
    { name: 'Medical Report', category: 'Medical Documents', isRequired: true },
    { name: 'Radiology waiver', category: 'Medical Documents', isRequired: true },
    { name: 'Police clearance certificate', category: 'Background Checks', isRequired: true, note: 'From each country lived in for 12+ months (18+ years only)' },
    { name: 'Letter of Support from Spouse', category: 'Letters', isRequired: true, note: 'We will draft it' },
    { name: 'ID of Spouse', category: 'Spouse Documents', isRequired: true }
  ],
  
  // Legacy visa types for backward compatibility
  'General Work Visa': [
    { name: 'Valid passport (original)', category: 'Identity', isRequired: true },
    { name: 'Passport photos (2)', category: 'Identity', isRequired: true },
    { name: 'Completed BI-1738 form', category: 'Application Forms', isRequired: true },
    { name: 'Employment contract', category: 'Employment', isRequired: true },
    { name: 'Labour waiver certificate', category: 'Employment', isRequired: true },
    { name: 'Police clearance certificate', category: 'Background Checks', isRequired: true },
    { name: 'Medical certificate', category: 'Medical', isRequired: true },
    { name: 'Radiological report', category: 'Medical', isRequired: true },
    { name: 'Proof of payment', category: 'Financial', isRequired: true }
  ],
  'Business Visa': [
    { name: 'Valid passport (original)', category: 'Identity', isRequired: true },
    { name: 'Passport photos (2)', category: 'Identity', isRequired: true },
    { name: 'Completed BI-1739 form', category: 'Application Forms', isRequired: true },
    { name: 'Business plan', category: 'Business', isRequired: true },
    { name: 'DTI registration certificate', category: 'Business', isRequired: true },
    { name: 'Proof of investment (R5 million)', category: 'Financial', isRequired: true },
    { name: 'Bank statements', category: 'Financial', isRequired: true },
    { name: 'Police clearance certificate', category: 'Background Checks', isRequired: true },
    { name: 'Medical certificate', category: 'Medical', isRequired: true },
    { name: 'Radiological report', category: 'Medical', isRequired: true },
    { name: 'Proof of payment', category: 'Financial', isRequired: true }
  ],
  'Study Visa': [
    { name: 'Valid passport (original)', category: 'Identity', isRequired: true },
    { name: 'Passport photos (2)', category: 'Identity', isRequired: true },
    { name: 'Completed BI-1738 form', category: 'Application Forms', isRequired: true },
    { name: 'Letter of acceptance from institution', category: 'Education', isRequired: true },
    { name: 'Proof of registration', category: 'Education', isRequired: true },
    { name: 'Proof of payment of tuition', category: 'Financial', isRequired: true },
    { name: 'Proof of medical cover', category: 'Medical', isRequired: true },
    { name: 'Financial proof (sponsor/self)', category: 'Financial', isRequired: true },
    { name: 'Police clearance certificate', category: 'Background Checks', isRequired: true },
    { name: 'Medical certificate', category: 'Medical', isRequired: true },
    { name: 'Radiological report', category: 'Medical', isRequired: true }
  ],
  'Relatives Visa': [
    { name: 'Valid passport (original)', category: 'Identity', isRequired: true },
    { name: 'Passport photos (2)', category: 'Identity', isRequired: true },
    { name: 'Completed BI-1740 form', category: 'Application Forms', isRequired: true },
    { name: 'Proof of relationship', category: 'Relationship', isRequired: true },
    { name: 'Sponsor\'s ID/passport copy', category: 'Sponsor Documents', isRequired: true },
    { name: 'Sponsor\'s proof of residence', category: 'Sponsor Documents', isRequired: true },
    { name: 'Sponsor\'s financial proof', category: 'Financial', isRequired: true },
    { name: 'Undertaking by sponsor', category: 'Sponsor Documents', isRequired: true },
    { name: 'Police clearance certificate', category: 'Background Checks', isRequired: true },
    { name: 'Medical certificate', category: 'Medical', isRequired: true },
    { name: 'Radiological report', category: 'Medical', isRequired: true }
  ]
};

export const MEDICAL_WARNING = '⚠️ IMPORTANT: Please keep your ORIGINAL medical reports and radiological reports. Do NOT discard them as they must be submitted with your application. Make copies for your records but retain the originals.';
