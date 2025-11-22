
import { callAI, MODEL_SMART } from './aiService';
import { AIChatMessage, AIChatResponse, Task, Issue, VisitNote, Partner, SOP } from '../../types';

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
Your capability includes reading the database (Tasks, Issues, Visits, Partners, SOPs) and **EXECUTING ACTIONS**.

### ROLE & BEHAVIOR
1.  **Assist & Execute**: If asked to create/schedule, return a JSON Action.
2.  **Data Aware**: You know the Partners' health status and SOP details.
3.  **Language**: Professional Indonesian.

### KNOWLEDGE BASE ACCESS
- If asked about SOPs (e.g., "How to handle opcode 59?"), READ the SOP section below.
- If asked about Partners (e.g., "Is Toko A growing?"), READ the Partner section below.

### HOW TO EXECUTE ACTIONS
#### 1. CREATING A TASK
Trigger: "Buat tugas", "Ingatkan saya".
JSON: { "action": { "type": "CREATE_TASK", "data": { ... } } }

#### 2. SCHEDULING A VISIT
Trigger: "Jadwalkan visit", "Plan visit".
JSON: { "action": { "type": "CREATE_VISIT", "data": { ... } } }

### RESPONSE FORMAT
Return JSON with "reply", "suggestedActions", and optional "action".
`;

const formatContext = (tasks: Task[], issues: Issue[], visits: VisitNote[], partners: Partner[], sops: SOP[]) => {
  const sortedVisits = [...visits]
    .filter(v => v.status !== 'DONE')
    .sort((a, b) => (a.visitDatePlan || '9999').localeCompare(b.visitDatePlan || '9999'));

  const sortedTasks = [...tasks]
    .filter(t => t.status !== 'CLOSED')
    .sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));

  const partnerSummary = partners.map(p => `- ${p.name} (${p.status}): Vol ${p.volumeM1}`).join('\n');
  const sopSummary = sops.map(s => `- ${s.title} [${s.category}]`).join('\n');

  return `
    ${getDateContext()}

    === DATABASE CONTENTS (READ ONLY) ===
    
    [ACTIVE TASKS]
    ${sortedTasks.map(t => `- [${t.deadline}] ${t.title}`).join('\n')}

    [OPEN ISSUES]
    ${issues.filter(i => i.status !== 'DONE').map(i => `- ${i.awb}: ${i.issueType}`).join('\n')}

    [PLANNED VISITS]
    ${sortedVisits.map(v => `- [${v.visitDatePlan}] ${v.partnerName}`).join('\n')}

    [PARTNER STATUS]
    ${partnerSummary}

    [AVAILABLE SOPs]
    ${sopSummary}
  `;
};

export const sendMessage = async (
  history: AIChatMessage[], 
  userMessage: string,
  contextData?: { tasks: Task[], issues: Issue[], visits: VisitNote[], partners: Partner[], sops: SOP[] }
): Promise<AIChatResponse> => {
  
  let systemContent = SYSTEM_PROMPT;
  
  if (contextData) {
    const contextString = formatContext(
        contextData.tasks, 
        contextData.issues, 
        contextData.visits,
        contextData.partners,
        contextData.sops
    );
    systemContent += `\n\n${contextString}`;
  }

  const messages = [
    { role: "system", content: systemContent },
    ...history,
    { role: "user", content: userMessage }
  ];

  return await callAI(messages, { model: MODEL_SMART, jsonMode: true });
};
