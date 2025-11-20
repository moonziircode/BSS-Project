import { Task, Issue, VisitNote } from '../types';

// Keys for LocalStorage
const KEYS = {
  TASKS: 'BS_OPS_TASKS',
  ISSUES: 'BS_OPS_ISSUES',
  VISITS: 'BS_OPS_VISITS',
};

// Generic helper to get data
const getItems = <T,>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Generic helper to save data
const saveItems = <T,>(key: string, items: T[]) => {
  localStorage.setItem(key, JSON.stringify(items));
};

// --- Task Service ---
export const getTasks = (): Task[] => getItems<Task>(KEYS.TASKS);
export const saveTask = (task: Task) => {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
  saveItems(KEYS.TASKS, tasks);
};
export const deleteTask = (id: string) => {
  const tasks = getTasks().filter((t) => t.id !== id);
  saveItems(KEYS.TASKS, tasks);
};

// --- Issue Service ---
export const getIssues = (): Issue[] => getItems<Issue>(KEYS.ISSUES);
export const saveIssue = (issue: Issue) => {
  const issues = getIssues();
  const index = issues.findIndex((i) => i.id === issue.id);
  if (index >= 0) {
    issues[index] = issue;
  } else {
    issues.push(issue);
  }
  saveItems(KEYS.ISSUES, issues);
};

// --- Visit Service ---
export const getVisits = (): VisitNote[] => getItems<VisitNote>(KEYS.VISITS);
export const saveVisit = (visit: VisitNote) => {
  const visits = getVisits();
  const index = visits.findIndex((v) => v.id === visit.id);
  if (index >= 0) {
    visits[index] = visit;
  } else {
    visits.push(visit);
  }
  saveItems(KEYS.VISITS, visits);
};

// --- Mock Seeder (Run once if empty) ---
export const seedData = () => {
  if (getTasks().length === 0) {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Cek Paket Stuck Hub Timur',
        description: 'Ada 50 paket stuck di HUB Timur sejak kemarin',
        createdAt: new Date().toISOString(),
        category: 'TODAY' as any,
        priority: 'PRIORITY_1' as any,
        status: 'OPEN' as any,
        division: 'Operations' as any,
        notes: '',
      },
      {
        id: '2',
        title: 'Weekly Report Mitra',
        description: 'Rekap performance mitra top 20',
        createdAt: new Date().toISOString(),
        category: 'THIS_WEEK' as any,
        priority: 'PRIORITY_2' as any,
        status: 'OPEN' as any,
        division: 'Partner Management' as any,
        notes: '',
      }
    ];
    saveItems(KEYS.TASKS, mockTasks);
  }
};