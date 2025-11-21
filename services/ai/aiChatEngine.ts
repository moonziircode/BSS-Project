
import { callAI, MODEL_SMART } from './aiService';
import { AIChatMessage, AIChatResponse, Task, Issue, VisitNote, TaskCategory, Priority, Division, TaskStatus } from '../../types';

const getDateContext = () => {
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
  
  // Calculate Next Week
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  const nextWeekStr = nextWeek.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');

  return `
    HARI INI: ${days[now.getDay()]}, ${todayStr}
    PEKAN DEPAN MULAI: ${nextWeekStr}
  `;
};

const SYSTEM_PROMPT = `
You are "Anteraja Super Assistant", the central brain of the Business Ecosystem Dashboard.
Your goal is to manage the specialist's schedule, solve operational issues, and execute commands.

CAPABILITIES:
1. **READ EVERYTHING**: You have access to ALL Tasks, Issues, and Visit Plans in the database.
2. **PLANNING**: You can see future dates. If asked about "Next Week", check the "PLANNED VISITS" list for dates starting from next week.
3. **ACTION**: You can CREATE Tasks and Visits directly.

DATA CONTEXT:
The user will provide a list of active items below. Use this data to answer questions accurately.
If the user asks "Apa agenda pekan depan?", look at items with dates in the future.

COMMAND INSTRUCTIONS:
If the user asks to Create/Schedule/Remind something, you MUST return a JSON with an "action" field.

Format for Creating a TASK:
{
  "reply": "Siap, saya sudah buatkan tugasnya.",
  "suggestedActions": [],
  "action": {
    "type": "CREATE_TASK",
    "data": {
      "title": "Short Title",
      "description": "Full details",
      "category": "TODAY" | "THIS_WEEK",
      "priority": "PRIORITY_1" | "PRIORITY_2" | "PRIORITY_3",
      "status": "OPEN",
      "division": "Operations",
      "deadline": "YYYY-MM-DD" (Optional)
    }
  }
}

Format for Creating a VISIT PLAN:
{
  "reply": "Oke, rencana visit sudah dijadwalkan.",
  "suggestedActions": [],
  "action": {
    "type": "CREATE_VISIT",
    "data": {
      "partnerName": "Partner Name",
      "visitDatePlan": "YYYY-MM-DD",
      "status": "PLANNED",
      "findings": "",
      "operationalIssues": "",
      "suggestions": ""
    }
  }
}

If no action is needed, just return "reply" and "suggestedActions".
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

    === DATABASE CONTENTS ===
    
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
