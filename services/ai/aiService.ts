
import { GoogleGenAI } from "@google/genai";

// Model Constants
// Using 2.5 Flash for both for high speed and reliability. 
// You can switch SMART to 'gemini-2.0-flash-exp' or 'gemini-1.5-pro' if desired.
export const MODEL_FAST = "gemini-2.5-flash"; 
export const MODEL_SMART = "gemini-2.5-flash"; 

// Hardcoded fallback key from project settings for client-side usage
const FALLBACK_KEY = 'AIzaSyDT5vM-7nIoVt5MXMtOIgojK24bxkP94hI';

export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  jsonMode?: boolean;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Base function to call AI (Gemini Wrapper).
 */
export const callOpenAI = async (
  messages: { role: string; content: string }[],
  options: AIRequestOptions = {}
): Promise<any> => {
  const {
    model = MODEL_FAST,
    temperature = 0.7,
    jsonMode = false,
  } = options;

  // Use process.env.API_KEY if available, otherwise use fallback
  const apiKey = process.env.API_KEY || FALLBACK_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // 1. Extract System Instruction
  const systemMsg = messages.find(m => m.role === 'system');
  const systemInstruction = systemMsg ? systemMsg.content : undefined;

  // 2. Construct Conversation History
  // Filter out system message from contents as it's handled via config
  const conversationMessages = messages.filter(m => m.role !== 'system');
  
  // Format messages into a single context string if multiple exist (Chat History)
  let contents = "";
  if (conversationMessages.length === 1) {
      contents = conversationMessages[0].content;
  } else {
      // Explicitly label turns for the model
      contents = conversationMessages.map(m => `${m.role === 'user' ? 'User' : 'Model'}: ${m.content}`).join('\n\n');
  }

  try {
    const config: any = {
        temperature,
    };
    
    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }

    if (jsonMode) {
        config.responseMimeType = "application/json";
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: config
    });

    const text = response.text || "";

    if (jsonMode) {
      try {
        // Sanitize markdown code blocks if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
      } catch (e) {
        console.error("JSON Parse Error:", e, "Text:", text);
        return {}; // Fallback
      }
    }

    return text;

  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};
