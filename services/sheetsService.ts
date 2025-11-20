
import { Task, Issue, VisitNote, TaskCategory, Priority, TaskStatus, Division, IssueStatus, VisitStatus } from '../types';

// Constants provided by user
export const DEFAULT_SPREADSHEET_ID = '1IaQoRLmQRGt_I4SK8Tlyuwt3FLE4Xw9JrYExxOkA4UM';
export const DEFAULT_CLIENT_ID = '969131868502-3edmgo35ehebgo8p52ed0kb7p0sghujv.apps.googleusercontent.com';
export const DEFAULT_API_KEY = 'AIzaSyDT5vM-7nIoVt5MXMtOIgojK24bxkP94hI';

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// Sheet Names
const SHEETS = {
  TASKS: 'TASK_MANAGER',
  ISSUES: 'ISSUE_TRACKER',
  VISITS: 'VISIT_NOTES',
};

// Global Types for Google API
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export class SheetsService {
  private tokenClient: any;
  private spreadsheetId: string;
  private isInitialized = false;

  constructor(spreadsheetId: string = DEFAULT_SPREADSHEET_ID) {
    this.spreadsheetId = spreadsheetId;
  }

  public setSpreadsheetId(id: string) {
    this.spreadsheetId = id;
  }

  // Initialize GAPI Client
  public async initClient(apiKey: string): Promise<void> {
    if (this.isInitialized) return;
    
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error("Google API Script not loaded"));
        return;
      }
      
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: apiKey,
            discoveryDocs: [DISCOVERY_DOC],
          });
          this.isInitialized = true;
          resolve();
        } catch (error) {
          console.error("GAPI Init Error", error);
          reject(error);
        }
      });
    });
  }

  // Initialize GIS Token Client
  public initTokenClient(clientId: string, onTokenReceived: () => void): void {
    if (!window.google) return;

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          onTokenReceived();
        }
      },
    });
  }

  // Trigger Sign In
  public requestAccessToken(): void {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      console.error('Token client not initialized');
    }
  }

  // --- Helper: Ensure Sheets Exist ---
  public async ensureSheetsExist() {
    try {
      const meta = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      
      const existingTitles = meta.result.sheets.map((s: any) => s.properties.title);
      const requests = [];

      // Create TASKS sheet if missing
      if (!existingTitles.includes(SHEETS.TASKS)) {
        requests.push({ addSheet: { properties: { title: SHEETS.TASKS } } });
      }
      // Create ISSUES sheet if missing
      if (!existingTitles.includes(SHEETS.ISSUES)) {
        requests.push({ addSheet: { properties: { title: SHEETS.ISSUES } } });
      }
      // Create VISITS sheet if missing
      if (!existingTitles.includes(SHEETS.VISITS)) {
        requests.push({ addSheet: { properties: { title: SHEETS.VISITS } } });
      }

      if (requests.length > 0) {
        await window.gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: { requests },
        });
      }
      
      // Always attempt to update headers to ensure new schema is applied
      await this.addHeaders();

    } catch (error) {
      console.error('Error ensuring sheets exist:', error);
      throw error;
    }
  }

  private async addHeaders() {
    // Updated Headers to match new fields
    const values = [
      { range: `${SHEETS.TASKS}!A1:J1`, values: [['ID', 'Title', 'Description', 'CreatedAt', 'Deadline', 'Category', 'Priority', 'Status', 'Division', 'Notes']] },
      { range: `${SHEETS.ISSUES}!A1:K1`, values: [['ID', 'AWB', 'PartnerName', 'IssueType', 'Opcode', 'SOP', 'Chronology', 'Division', 'Status', 'CreatedAt', 'Screenshot']] },
      // Added Status Column
      { range: `${SHEETS.VISITS}!A1:M1`, values: [['ID', 'PartnerName', 'MapsLink', 'Coordinates', 'PlanDate', 'ActualDate', 'OrdersTotal', 'OrdersAvg', 'Findings', 'OpIssues', 'Suggestions', 'Summary', 'Status']] },
    ];

    for (const v of values) {
       try {
         await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: v.range,
            valueInputOption: 'RAW',
            resource: { values: v.values }
         });
       } catch (e) {
         // Ignore if header update fails
         console.warn("Header update warning", e);
       }
    }
  }

  // --- TASKS CRUD ---

  public async getTasks(): Promise<Task[]> {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.TASKS}!A2:J`,
      });
      
      const rows = response.result.values || [];
      return rows.map((row: any[]) => ({
        id: row[0],
        title: row[1],
        description: row[2],
        createdAt: row[3],
        deadline: row[4],
        category: row[5] as TaskCategory,
        priority: row[6] as Priority,
        status: row[7] as TaskStatus,
        division: row[8] as Division,
        notes: row[9] || '',
      }));
    } catch (e) {
      console.error('Error fetching tasks', e);
      return [];
    }
  }

  public async saveTask(task: Task): Promise<void> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    
    const row = [
      task.id, task.title, task.description, task.createdAt, task.deadline || '',
      task.category, task.priority, task.status, task.division, task.notes
    ];

    if (index >= 0) {
      const range = `${SHEETS.TASKS}!A${index + 2}:J${index + 2}`;
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: { values: [row] },
      });
    } else {
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.TASKS}!A1`,
        valueInputOption: 'RAW',
        resource: { values: [row] },
      });
    }
  }

  public async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    const newTasks = tasks.filter(t => t.id !== id);
    await this.rewriteSheet(SHEETS.TASKS, newTasks.map(t => [
       t.id, t.title, t.description, t.createdAt, t.deadline||'', t.category, t.priority, t.status, t.division, t.notes
    ]));
  }

  // --- ISSUES CRUD ---

  public async getIssues(): Promise<Issue[]> {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.ISSUES}!A2:K`,
      });
      const rows = response.result.values || [];
      return rows.map((row: any[]) => ({
        id: row[0],
        awb: row[1],
        partnerName: row[2] || '', // New mapped field
        issueType: row[3],
        opcode: row[4],
        sopRelated: row[5],
        chronology: row[6],
        division: row[7] as Division,
        status: row[8] as IssueStatus,
        createdAt: row[9],
        screenshotUrl: row[10]
      }));
    } catch (e) {
      console.error('Error fetching issues', e);
      return [];
    }
  }

  public async saveIssue(issue: Issue): Promise<void> {
    const issues = await this.getIssues();
    const index = issues.findIndex(i => i.id === issue.id);
    
    const row = [
      issue.id, issue.awb, issue.partnerName, issue.issueType, issue.opcode, issue.sopRelated,
      issue.chronology, issue.division, issue.status, issue.createdAt, issue.screenshotUrl || ''
    ];

    if (index >= 0) {
      const range = `${SHEETS.ISSUES}!A${index + 2}:K${index + 2}`;
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: { values: [row] },
      });
    } else {
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.ISSUES}!A1`,
        valueInputOption: 'RAW',
        resource: { values: [row] },
      });
    }
  }

  // --- VISITS CRUD ---

  public async getVisits(): Promise<VisitNote[]> {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.VISITS}!A2:M`, // Extended Range
      });
      const rows = response.result.values || [];
      return rows.map((row: any[]) => ({
        id: row[0],
        partnerName: row[1],
        googleMapsLink: row[2],
        coordinates: row[3],
        visitDatePlan: row[4],
        visitDateActual: row[5],
        ordersLastMonth: Number(row[6] || 0),
        ordersDailyAvg: Number(row[7] || 0),
        findings: row[8],
        operationalIssues: row[9],
        suggestions: row[10],
        summary: row[11],
        status: (row[12] || 'PLANNED') as VisitStatus
      }));
    } catch (e) {
      console.error('Error fetching visits', e);
      return [];
    }
  }

  public async saveVisit(visit: VisitNote): Promise<void> {
    const visits = await this.getVisits();
    const index = visits.findIndex(v => v.id === visit.id);
    
    const row = [
      visit.id, visit.partnerName, visit.googleMapsLink, visit.coordinates, 
      visit.visitDatePlan, visit.visitDateActual, visit.ordersLastMonth, visit.ordersDailyAvg,
      visit.findings, visit.operationalIssues, visit.suggestions, visit.summary || '',
      visit.status || 'PLANNED'
    ];

    if (index >= 0) {
      const range = `${SHEETS.VISITS}!A${index + 2}:M${index + 2}`;
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: { values: [row] },
      });
    } else {
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.VISITS}!A1`,
        valueInputOption: 'RAW',
        resource: { values: [row] },
      });
    }
  }

  // Helper to rewrite sheet
  private async rewriteSheet(sheetName: string, rows: any[][]) {
    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A2:Z5000`,
    });
    
    if (rows.length > 0) {
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2`,
        valueInputOption: 'RAW',
        resource: { values: rows },
      });
    }
  }
}

export const sheetsService = new SheetsService();