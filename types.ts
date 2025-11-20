
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

export type VisitStatus = 'PLANNED' | 'DONE' | 'RESCHEDULED';

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
  awb: string;
  partnerName: string; // New Field
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
  // Removed NIA
  googleMapsLink: string; // New
  coordinates: string; // New
  visitDatePlan: string; // New
  visitDateActual: string; // New
  ordersLastMonth: number; // New
  ordersDailyAvg: number; // New
  findings: string;
  operationalIssues: string;
  suggestions: string;
  summary?: string; // AI Generated
  status: VisitStatus; // New Field
}

export interface DashboardStats {
  tasksToday: number;
  issuesCritical: number; // SLA Breach
  pendingVisits: number;
}