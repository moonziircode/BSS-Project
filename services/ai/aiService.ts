
import { GoogleGenAI } from "@google/genai";

// Model Constants for Gemini
export const MODEL_FAST = "gemini-2.5-flash"; 
export const MODEL_SMART = "gemini-2.5-flash"; // Using Flash for speed/cost

export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  jsonMode?: boolean;
}

const getApiKey = (): string => {
  // 1. Try Vite Env (VITE_GEMINI_API_KEY)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {}

  // 2. Try Standard Process Env (API_KEY or GEMINI_API_KEY)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      if (process.env.API_KEY) return process.env.API_KEY;
      // @ts-ignore
      if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    }
  } catch (e) {}

  return "";
};

const apiKey = getApiKey();

/**
 * Base function to call Google Gemini API.
 */
export const callAI = async (
  messages: { role: string; content: string }[],
  options: AIRequestOptions = {}
): Promise<any> => {
  const {
    model = MODEL_FAST,
    temperature = 0.7,
    jsonMode = false,
  } = options;

  if (!apiKey) {
    const errorMsg = "Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in .env or ensure process.env.API_KEY is available.";
    console.error(errorMsg);
    return jsonMode ? {} : "AI Service Unavailable: Missing API Key.";
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    // Transform OpenAI-style messages to Gemini Content format
    let systemInstruction = "";
    const contents = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction += msg.content + "\n";
      } else if (msg.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'assistant') {
        contents.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }

    const config: any = {
      temperature: temperature,
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
        // Clean markdown code blocks if present (Gemini sometimes adds ```json ... ```)
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleanText);
      } catch (e) {
        console.error("JSON Parse Error:", e, "Text:", text);
        return {}; 
      }
    }

    return text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return jsonMode ? {} : "Error communicating with AI service.";
  }
};
