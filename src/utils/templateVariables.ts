// Utility functions for template variable substitution

export interface TemplateVariable {
  name: string;
  label: string;
  description?: string;
  type: 'text' | 'date' | 'number' | 'textarea';
}

export const commonVariables: TemplateVariable[] = [
  { name: 'clientName', label: 'Client Name', type: 'text' },
  { name: 'passportNumber', label: 'Passport Number', type: 'text' },
  { name: 'sponsorName', label: 'Sponsor Name', type: 'text' },
  { name: 'currentDate', label: 'Current Date', type: 'date' },
  { name: 'visitStartDate', label: 'Visit Start Date', type: 'date' },
  { name: 'visitEndDate', label: 'Visit End Date', type: 'date' },
  { name: 'homeCountry', label: 'Home Country', type: 'text' },
  { name: 'companyName', label: 'Company Name', type: 'text' },
  { name: 'jobTitle', label: 'Job Title', type: 'text' },
];

export function extractVariables(content: string): string[] {
  const regex = /{{(\w+)}}/g;
  const matches = content.matchAll(regex);
  const variables = new Set<string>();
  
  for (const match of matches) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
}

export function substituteVariables(
  content: string,
  values: Record<string, string>
): string {
  let result = content;
  
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || `{{${key}}}`);
  });
  
  return result;
}

export function getVariableLabel(variableName: string): string {
  const common = commonVariables.find(v => v.name === variableName);
  if (common) return common.label;
  
  // Convert camelCase to Title Case
  return variableName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
