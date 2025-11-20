
import { AIIssueClassification, Division } from '../../types';
import { callOpenAI, MODEL_FAST } from './aiService';

export const classifyIssue = async (inputText: string): Promise<AIIssueClassification> => {
  const prompt = `
    Analyze the following logistics issue description from Anteraja operation.
    Predict the Opcode, SOP Reference, and Division.
    
    Knowledge Base:
    - First-mile: Pickup delay, cancel pickup.
    - Mid-mile: Hub sorting, stuck at Hub, wrong routing (Opcode 285/286).
    - Last-mile: Delivery delay, courier issues, POD fake (Opcode 59/60).
    - SOP References often imply TAB QMS 287 (Drop Off), 285 (Return), etc.

    Input Text: "${inputText}"

    Return JSON format:
    {
      "opcode": "number or string code",
      "sop": "string name of SOP",
      "division": "Operations | Network | IT | Finance | Partner Management | Customer Service",
      "confidence": number (0-1),
      "reasoning": "short explanation"
    }
  `;

  return await callOpenAI(
    [{ role: "system", content: "You are an expert Logistics Operations AI." }, { role: "user", content: prompt }],
    { model: MODEL_FAST, jsonMode: true }
  );
};

export const autoFillIssueForm = async (text: string) => {
  const prompt = `
    Extract issue details from this text: "${text}".
    Return JSON:
    {
      "awb": "string (extract tracking number)",
      "partnerName": "string",
      "issueType": "string",
      "chronology": "string (tidy up the story)"
    }
  `;
  return await callOpenAI(
    [{ role: "system", content: "You are a data extraction assistant." }, { role: "user", content: prompt }],
    { model: MODEL_FAST, jsonMode: true }
  );
};
