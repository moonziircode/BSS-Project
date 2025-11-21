
import { callAI, MODEL_SMART } from './aiService';
import { AIChatMessage, AIChatResponse, Task, Issue, VisitNote, TaskCategory } from '../../types';

const SYSTEM_PROMPT = `
You are "Anteraja AI Assistant", a helpful assistant for Business Success Specialists.
Your goal is to help manage logistics partners (Pengusaha), solve operational issues (First/Mid/Last mile), and explain SOPs.

You have access to the user's real-time operational data (Tasks, Issues, Visits).
Use this data to answer questions like "Apa tugas saya hari ini?" or "Mitra mana yang harus saya kunjungi?".

Output Format:
Always return a JSON object:
{
  "reply": "Your conversational answer here (use formatting like bold or lists)",
  "suggestedActions": ["Action 1", "Action 2"] (Short button text for next steps)
}
`;

const formatContext = (tasks: Task[], issues: Issue[], visits: VisitNote[]) => {
  const today = new Date().toLocaleDateString('en-CA');
  
  const taskSummary = tasks
    .filter(t => t.status !== 'CLOSED')
    .map(t => `- [${t.category}] ${t.title} (${t.priority})`)
    .join('\n');

  const issueSummary = issues
    .filter(i => i.status !== 'DONE')
    .map(i => `- ${i.awb} (${i.partnerName}): ${i.issueType}`)
    .join('\n');

  const visitSummary = visits
    .filter(v => v.status === 'PLANNED')
    .map(v => `- ${v.partnerName} (Plan: ${v.visitDatePlan || 'Unscheduled'})`)
    .join('\n');

  return `
    CURRENT CONTEXT DATA (Today: ${today}):
    
    ACTIVE TASKS:
    ${taskSummary || 'No active tasks.'}

    OPEN ISSUES:
    ${issueSummary || 'No open issues.'}

    PLANNED VISITS:
    ${visitSummary || 'No planned visits.'}
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