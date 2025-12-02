import { JobRole } from "./types";

export const INDUSTRIES = [
  'Technology & Software',
  'Business & Finance',
  'Design & Creative',
  'Sales & Marketing',
  'Healthcare & Science'
];

export const JOB_ROLES: JobRole[] = [
  // Technology
  { id: 't1', industry: 'Technology & Software', title: 'Frontend Engineer', level: 'Mid-Senior', tags: ['React', 'Popular'] },
  { id: 't2', industry: 'Technology & Software', title: 'Backend Developer', level: 'Senior', tags: ['Python', 'System Design'] },
  { id: 't3', industry: 'Technology & Software', title: 'Fullstack Engineer', level: 'Mid', tags: ['Node.js', 'Web'] },
  { id: 't4', industry: 'Technology & Software', title: 'Data Scientist', level: 'Senior', tags: ['AI/ML', 'Analytics'] },
  { id: 't5', industry: 'Technology & Software', title: 'DevOps Engineer', level: 'Mid-Senior', tags: ['Cloud', 'CI/CD'] },
  { id: 't6', industry: 'Technology & Software', title: 'Product Manager', level: 'Senior', tags: ['Strategy', 'Leadership'] },
  
  // Finance
  { id: 'f1', industry: 'Business & Finance', title: 'Investment Banker', level: 'Entry', tags: ['Valuation', 'M&A'] },
  { id: 'f2', industry: 'Business & Finance', title: 'Financial Analyst', level: 'Mid', tags: ['Modeling', 'Excel'] },
  { id: 'f3', industry: 'Business & Finance', title: 'Management Consultant', level: 'Senior', tags: ['Strategy', 'Case Study'] },
  { id: 'f4', industry: 'Business & Finance', title: 'Accountant', level: 'Mid', tags: ['CPA', 'Audit'] },
  { id: 'f5', industry: 'Business & Finance', title: 'Business Analyst', level: 'Entry-Mid', tags: ['Requirements', 'SQL'] },

  // Design
  { id: 'd1', industry: 'Design & Creative', title: 'UX Designer', level: 'Mid-Senior', tags: ['Figma', 'Research'] },
  { id: 'd2', industry: 'Design & Creative', title: 'UI Designer', level: 'Mid', tags: ['Visual', 'Systems'] },
  { id: 'd3', industry: 'Design & Creative', title: 'Product Designer', level: 'Senior', tags: ['End-to-End'] },
  { id: 'd4', industry: 'Design & Creative', title: 'Graphic Designer', level: 'Entry', tags: ['Branding', 'Adobe'] },

  // Marketing
  { id: 'm1', industry: 'Sales & Marketing', title: 'Digital Marketing Mgr', level: 'Senior', tags: ['Growth', 'SEO'] },
  { id: 'm2', industry: 'Sales & Marketing', title: 'Content Strategist', level: 'Mid', tags: ['Copy', 'Social'] },
  { id: 'm3', industry: 'Sales & Marketing', title: 'Sales Representative', level: 'Entry', tags: ['B2B', 'Negotiation'] },
  { id: 'm4', industry: 'Sales & Marketing', title: 'Account Executive', level: 'Senior', tags: ['Closing', 'CRM'] },

  // Healthcare
  { id: 'h1', industry: 'Healthcare & Science', title: 'Pharmaceutical Sales', level: 'Mid', tags: ['Sales', 'Bio'] },
  { id: 'h2', industry: 'Healthcare & Science', title: 'Clinical Research Coord', level: 'Entry', tags: ['Trials', 'Admin'] },
  { id: 'h3', industry: 'Healthcare & Science', title: 'Medical Admin', level: 'Entry', tags: ['Operations'] },
];

export const MOCK_JD_TEXT = `We are looking for a capable professional who can handle ambiguity, drive results, and communicate effectively with cross-functional teams. You should be proficient in modern tools and have a growth mindset.`;

export const MOCK_RESUME_TEXT = `Experienced professional with 5 years in the industry. Proven track record of delivering projects on time. specific skills include communication, leadership, and technical analysis.`;