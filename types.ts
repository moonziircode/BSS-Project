
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

export interface EscalationLog {
  id: string;
  timestamp: string;
  actor: string; // e.g. "You", "Pak Budi"
  action: string; // e.g. "Sent Email", "WhatsApp Call"
  note: string;
}

export interface Issue {
  id: string;
  awb: string;
  partnerName: string;
  issueType: string;
  opcode: string;
  sopRelated: string;
  chronology: string;
  division: Division;
  status: IssueStatus;
  createdAt: string;
  screenshotUrl?: string;
  escalationLog?: EscalationLog[]; // New Field
}

export interface VisitNote {
  id: string;
  partnerName: string;
  googleMapsLink: string;
  coordinates: string;
  visitDatePlan: string;
  visitDateActual: string;
  ordersLastMonth: number;
  ordersDailyAvg: number;
  findings: string;
  operationalIssues: string;
  suggestions: string;
  summary?: string;
  status: VisitStatus;
}

// --- New Data Models ---

export interface Partner {
  id: string;
  // Core Identifiers
  name: string; // External Store Name
  nia: string; // NIA
  nik?: string; // NIK
  
  // Operational Details
  serviceType: string; // Service Type
  uz: string; // UZ
  stagingCode: string; // Staging Code
  openingHour?: string;
  closingHour?: string;
  
  // Owner Info
  ownerName: string; // First Name + Last Name
  phone: string; // No. Telp
  
  // Location
  address: string; // Address
  city: string; // City
  district: string; // District
  zipCode: string; // Zip Code
  province?: string; // Province
  coordinates: string; // "lat, long" (Combined from Longitude/Latitude)
  googleMapsLink?: string; // Optional Link
  
  // Meta
  joinedDate: string; // Registered Date
  status: 'GROWTH' | 'STAGNANT' | 'AT_RISK';
  
  // Historical Volume (Internal Tracking)
  volumeM3: number; // 2 months ago
  volumeM2: number; // Last month
  volumeM1: number; // Current Month (to date)
}

export interface SOP {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  lastUpdated: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  division: Division;
  phone: string;
  email: string;
}

export interface DashboardStats {
  tasksToday: number;
  issuesCritical: number;
  pendingVisits: number;
}

// --- AI Types ---

export interface AIPriorityResult {
  score: number;
  priorityLevel: Priority;
  reasoning: string;
}

export interface AIIssueClassification {
  opcode: string;
  sop: string;
  division: Division;
  confidence: number;
  reasoning: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatResponse {
  reply: string;
  suggestedActions: string[];
  action?: 
    | { type: 'CREATE_TASK'; data: Task }
    | { type: 'CREATE_VISIT'; data: VisitNote };
}
