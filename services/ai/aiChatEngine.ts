
import { callOpenAI, MODEL_SMART } from './aiService';
import { AIChatMessage, AIChatResponse } from '../../types';

const SYSTEM_PROMPT = `
You are "Anteraja AI Assistant", a helpful assistant for Business Success Specialists.
Your goal is to help manage logistics partners (Pengusaha), solve operational issues (First/Mid/Last mile), and explain SOPs.

You have knowledge of:
- Anteraja Opcodes (59, 285, 287, etc.)
- SOPs (Standard Operating Procedures)
- Dashboard metrics (SLA, Stuck, Productivity)

Output Format:
Always return a JSON object:
{
  "reply": "Your conversational answer here (use formatting like bold or lists)",
  "suggestedActions": ["Action 1", "Action 2"] (Short button text for next steps)
}
`;

export const sendMessage = async (history: AIChatMessage[], userMessage: string): Promise<AIChatResponse> => {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: userMessage }
  ];

  return await callOpenAI(messages, { model: MODEL_SMART, jsonMode: true });
};
