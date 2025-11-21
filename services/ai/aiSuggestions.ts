
import { callAI, MODEL_SMART, MODEL_FAST } from './aiService';
import { Issue, VisitNote } from '../../types';

export const getSolutionSuggestion = async (issue: Issue): Promise<string> => {
  const prompt = `
    Berikan solusi teknis dan taktis untuk masalah ini:
    Issue: ${issue.issueType}
    Opcode: ${issue.opcode}
    Kronologi: ${issue.chronology}
    
    Berikan 3 langkah perbaikan konkret untuk mitra/tim ops.
  `;

  return await callAI(
    [{ role: "system", content: "You are a Senior Logistics Operations Manager." }, { role: "user", content: prompt }],
    { model: MODEL_SMART }
  );
};

export const getOperationalImprovement = async (visit: VisitNote): Promise<string> => {
  const prompt = `
    Berdasarkan temuan visit di ${visit.partnerName}:
    "${visit.findings}"
    "${visit.operationalIssues}"
    
    Berikan rekomendasi strategi untuk meningkatkan jumlah paket (volume) dan kualitas layanan di titik ini.
  `;

  return await callAI(
    [{ role: "system", content: "You are a Business Consultant for Logistics." }, { role: "user", content: prompt }],
    { model: MODEL_SMART }
  );
};

export const getPriorityScore = async (taskTitle: string, taskDesc: string, division: string): Promise<{score: number, priorityLevel: string, reasoning: string}> => {
    const prompt = `
      Evaluate priority (1-100) for this task:
      Title: ${taskTitle}
      Desc: ${taskDesc}
      Div: ${division}
  
      Rules:
      - Score > 80 if: SLA breach, Stuck package, Urgent, "Atasan", Network Down. (Priority 1)
      - Score > 50 if: Deadline specific, Report, Visit plan. (Priority 2)
      - Score < 50: Nice to have, documentation. (Priority 3)
  
      Return JSON:
      {
        "score": number,
        "priorityLevel": "PRIORITY_1" | "PRIORITY_2" | "PRIORITY_3",
        "reasoning": "short reason"
      }
    `;
  
    return await callAI(
      [{ role: "system", content: "You are an automated task manager." }, { role: "user", content: prompt }],
      { model: MODEL_SMART, jsonMode: true }
    );
};
  
export const autoFillTask = async (text: string) => {
    const prompt = `
      Extract task details from: "${text}".
      Return JSON:
      {
        "title": "string",
        "description": "string",
        "division": "Operations | Finance | IT | Network | Customer Service | Partner Management",
        "category": "TODAY | THIS_WEEK | WAITING_UPDATE"
      }
    `;
    return await callAI(
      [{ role: "system", content: "You are a task parser." }, { role: "user", content: prompt }],
      { model: MODEL_FAST, jsonMode: true }
    );
};