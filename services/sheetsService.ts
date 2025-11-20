import { Task, Issue, VisitNote, TaskCategory, Priority, TaskStatus, Division, IssueStatus } from '../types';

// Constants
export const DEFAULT_SPREADSHEET_ID = '1IaQoRLmQRGt_I4SK8Tlyuwt3FLE4Xw9JrYExxOkA4UM';
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
    return new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: apiKey,
            discoveryDocs: [DISCOVERY_DOC],
          });
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Initialize GIS Token Client
  public initTokenClient(clientId: string, onTokenReceived: () => void): void {
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
        // Add headers
        await this.addHeaders();
      }
    } catch (error) {
      console.error('Error ensuring sheets exist:', error);
      throw error;
    }
  }

  private async addHeaders() {
    const values = [
      { range: `${SHEETS.TASKS}!A1:J1`, values: [['ID', 'Title', 'Description', 'CreatedAt', 'Deadline', 'Category', 'Priority', 'Status', 'Division', 'Notes']] },
      { range: `${SHEETS.ISSUES}!A1:J1`, values: [['ID', 'AWB/Partner', 'IssueType', 'Opcode', 'SOP', 'Chronology', 'Division', 'Status', 'CreatedAt', 'Screenshot']] },
      { range: `${SHEETS.VISITS}!A1:H1`, values: [['ID', 'PartnerName', 'NIA', 'VisitDate', 'Findings', 'OpIssues', 'Suggestions', 'Summary']] },
    ];

    for (const v of values) {
       await window.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: v.range,
          valueInputOption: 'RAW',
          resource: { values: v.values }
       });
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
    // Check if task exists to update, or append
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    
    const row = [
      task.id, task.title, task.description, task.createdAt, task.deadline || '',
      task.category, task.priority, task.status, task.division, task.notes
    ];

    if (index >= 0) {
      // Update (Row index + 2 because A1 is header and array is 0-indexed)
      const range = `${SHEETS.TASKS}!A${index + 2}:J${index + 2}`;
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: { values: [row] },
      });
    } else {
      // Append
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.TASKS}!A1`,
        valueInputOption: 'RAW',
        resource: { values: [row] },
      });
    }
  }

  public async deleteTask(id: string): Promise<void> {
    // Deleting rows is complex in Sheets API without breaking order.
    // For simplicity in this app, we will mark it as CLOSED or handle logic in UI.
    // But strictly, to delete:
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;

    // We'll just clear the content of the row to avoid shifting complexity for now
    // or better, we rewrite the whole sheet (inefficient but safe for small data)
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
        range: `${SHEETS.ISSUES}!A2:J`,
      });
      const rows = response.result.values || [];
      return rows.map((row: any[]) => ({
        id: row[0],
        awbOrPartnerId: row[1],
        issueType: row[2],
        opcode: row[3],
        sopRelated: row[4],
        chronology: row[5],
        division: row[6] as Division,
        status: row[7] as IssueStatus,
        createdAt: row[8],
        screenshotUrl: row[9]
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
      issue.id, issue.awbOrPartnerId, issue.issueType, issue.opcode, issue.sopRelated,
      issue.chronology, issue.division, issue.status, issue.createdAt, issue.screenshotUrl || ''
    ];

    if (index >= 0) {
      const range = `${SHEETS.ISSUES}!A${index + 2}:J${index + 2}`;
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
        range: `${SHEETS.VISITS}!A2:H`,
      });
      const rows = response.result.values || [];
      return rows.map((row: any[]) => ({
        id: row[0],
        partnerName: row[1],
        nia: row[2],
        visitDate: row[3],
        findings: row[4],
        operationalIssues: row[5],
        suggestions: row[6],
        summary: row[7]
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
      visit.id, visit.partnerName, visit.nia, visit.visitDate, visit.findings,
      visit.operationalIssues, visit.suggestions, visit.summary || ''
    ];

    if (index >= 0) {
      const range = `${SHEETS.VISITS}!A${index + 2}:H${index + 2}`;
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

  // Helper to rewrite sheet (used for delete)
  private async rewriteSheet(sheetName: string, rows: any[][]) {
    // Clear
    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A2:Z1000`,
    });
    
    if (rows.length > 0) {
      // Write new
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
