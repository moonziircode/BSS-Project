
import { GoogleGenAI } from "@google/genai";

// Model Constants for Gemini
export const MODEL_FAST = "gemini-2.5-flash"; 
export const MODEL_SMART = "gemini-2.5-flash"; // Using Flash for speed/cost, upgrade to pro if needed

export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  jsonMode?: boolean;
}

// Safe Environment Variable Accessor
const getEnvVar = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
    // @ts-ignore
    else if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    console.warn(`Error reading env var ${key}`, e);
  }
  return "";
};

const apiKey = getEnvVar("VITE_GEMINI_API_KEY");

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
    const errorMsg = "Gemini API Key (VITE_GEMINI_API_KEY) is missing.";
    console.error(errorMsg);
    throw new Error(errorMsg);
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
    throw error;
  }
};
