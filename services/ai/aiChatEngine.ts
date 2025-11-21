
import { callAI, MODEL_SMART } from './aiService';
import { AIChatMessage, AIChatResponse, Task, Issue, VisitNote, TaskCategory, Priority, Division, TaskStatus } from '../../types';

const getDateContext = () => {
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  const formatDate = (d: Date) => d.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
  
  const todayStr = formatDate(now);
  
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  // Next Week (Monday)
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
  const nextMondayStr = formatDate(nextMonday);

  return `
    INFO WAKTU SAAT INI:
    - Hari ini: ${days[now.getDay()]}, ${todayStr}
    - Besok: ${tomorrowStr}
    - Senin Depan: ${nextMondayStr}
  `;
};

const SYSTEM_PROMPT = `
You are "Anteraja Super Assistant", an intelligent operational bot for Business Success Specialists.
Your capability includes reading the database and **EXECUTING ACTIONS** to modify the database.

### ROLE & BEHAVIOR
1.  **Assist & Execute**: If the user asks to create, schedule, or remind, you MUST generate a JSON Action.
2.  **Data Aware**: You have access to the user's Tasks, Issues, and Visit Plans. Use this to answer questions like "Do I have visits next week?".
3.  **Language**: Professional Indonesian.

### HOW TO EXECUTE ACTIONS (CRITICAL)
When the user wants to create a Task or Visit, do NOT just say "I did it".
You must return a JSON object with an "action" field containing the data.

#### 1. CREATING A TASK
Trigger keywords: "Buat tugas", "Ingatkan saya", "Catat task", "Remind me".
JSON Structure:
{
  "reply": "Siap, tugas '[Title]' telah ditambahkan ke daftar [Category].",
  "suggestedActions": [],
  "action": {
    "type": "CREATE_TASK",
    "data": {
      "title": "Short & Clear Title",
      "description": "Full details from user",
      "category": "TODAY" | "THIS_WEEK" | "WAITING_UPDATE",
      "priority": "PRIORITY_1" (High/Urgent) | "PRIORITY_2" (Deadline) | "PRIORITY_3" (Normal),
      "status": "OPEN",
      "division": "Operations" | "Finance" | "IT" | "Network" | "CS" | "PM",
      "deadline": "YYYY-MM-DD" (Calculate based on user request, e.g. 'Tomorrow')
    }
  }
}

#### 2. SCHEDULING A VISIT
Trigger keywords: "Jadwalkan visit", "Plan visit", "Kunjungan ke".
JSON Structure:
{
  "reply": "Oke, rencana kunjungan ke [Partner] dijadwalkan untuk tanggal [Date].",
  "suggestedActions": [],
  "action": {
    "type": "CREATE_VISIT",
    "data": {
      "partnerName": "Partner Name",
      "visitDatePlan": "YYYY-MM-DD",
      "status": "PLANNED",
      "findings": "",
      "operationalIssues": "",
      "suggestions": "",
      "ordersLastMonth": 0,
      "ordersDailyAvg": 0,
      "googleMapsLink": "",
      "coordinates": ""
    }
  }
}

### RESPONSE FORMAT
Always return a valid JSON object.
If no action is needed, return:
{
  "reply": "Your answer here...",
  "suggestedActions": ["Suggestion 1", "Suggestion 2"]
}
`;

const formatContext = (tasks: Task[], issues: Issue[], visits: VisitNote[]) => {
  // Sort visits by date to help AI understand the timeline
  const sortedVisits = [...visits]
    .filter(v => v.status !== 'DONE') // Only future/planned
    .sort((a, b) => (a.visitDatePlan || '9999').localeCompare(b.visitDatePlan || '9999'));

  const sortedTasks = [...tasks]
    .filter(t => t.status !== 'CLOSED')
    .sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));

  const taskSummary = sortedTasks.length > 0 
    ? sortedTasks.map(t => `- [${t.deadline || 'No Date'}] ${t.title} (${t.priority})`).join('\n')
    : 'No active tasks.';

  const issueSummary = issues.length > 0
    ? issues.filter(i => i.status !== 'DONE').map(i => `- ${i.awb} (${i.partnerName}): ${i.issueType}`).join('\n')
    : 'No open issues.';

  const visitSummary = sortedVisits.length > 0
    ? sortedVisits.map(v => `- [${v.visitDatePlan || 'Unscheduled'}] Visit ke ${v.partnerName}`).join('\n')
    : 'No planned visits.';

  return `
    ${getDateContext()}

    === DATABASE CONTENTS (READ ONLY) ===
    
    [ACTIVE TASKS & DEADLINES]
    ${taskSummary}

    [OPEN ISSUES / SLA]
    ${issueSummary}

    [FUTURE VISIT PLANS]
    ${visitSummary}
  `;
};

export const sendMessage = async (
  history: AIChatMessage[], 
  userMessage: string,
  contextData?: { tasks: Task[], issues: Issue[], visits: VisitNote[] }
): Promise<AIChatResponse> => {
  
  let systemContent = SYSTEM_PROMPT;
  
  if (contextData) {
    const contextString = formatContext(contextData.tasks, contextData.issues, contextData.visits);
    systemContent += `\n\n${contextString}`;
  }

  const messages = [
    { role: "system", content: systemContent },
    ...history,
    { role: "user", content: userMessage }
  ];

  return await callAI(messages, { model: MODEL_SMART, jsonMode: true });
};
