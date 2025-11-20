export enum Priority {
  P1 = 'PRIORITY_1', // High Impact
  P2 = 'PRIORITY_2', // Deadline Driven
  P3 = 'PRIORITY_3', // Nice to have
}

export enum TaskCategory {
  TODAY = 'TODAY',
  THIS_WEEK = 'THIS_WEEK',
  WAITING_UPDATE = 'WAITING_UPDATE',
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
}

export enum Division {
  OPS = 'Operations',
  FINANCE = 'Finance',
  IT = 'IT',
  NETWORK = 'Network',
  CS = 'Customer Service',
  PM = 'Partner Management',
  OTHER = 'Other'
}

export enum IssueStatus {
  OPEN = 'OPEN',
  PROGRESS = 'PROGRESS',
  DONE = 'DONE',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: string; // ISO Date
  deadline?: string;
  category: TaskCategory;
  priority: Priority;
  status: TaskStatus;
  division: Division;
  notes: string;
}

export interface Issue {
  id: string;
  awbOrPartnerId: string;
  issueType: string;
  opcode: string;
  sopRelated: string;
  chronology: string;
  division: Division;
  status: IssueStatus;
  createdAt: string; // ISO Date for SLA calculation
  screenshotUrl?: string;
}

export interface VisitNote {
  id: string;
  partnerName: string;
  nia: string;
  visitDate: string;
  findings: string;
  operationalIssues: string;
  suggestions: string;
  summary?: string; // AI Generated
}

export interface DashboardStats {
  tasksToday: number;
  issuesCritical: number; // SLA Breach
  pendingVisits: number;
}