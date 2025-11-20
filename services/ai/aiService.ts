import { GoogleGenAI } from "@google/genai";

// Model Constants
// Mapping to Gemini models as per guidelines
export const MODEL_FAST = "gemini-2.5-flash"; 
export const MODEL_SMART = "gemini-3-pro-preview"; 

export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  jsonMode?: boolean;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Base function to call AI.
 * Migrated to use Google GenAI SDK but kept function name for compatibility.
 */
export const callOpenAI = async (
  messages: { role: string; content: string }[],
  options: AIRequestOptions = {}
): Promise<any> => {
  const {
    model = MODEL_FAST,
    temperature = 0.7,
    jsonMode = false,
    maxRetries = 2,
  } = options;

  // Use process.env.API_KEY as per guidelines
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Extract system instruction
      const systemInstruction = messages.find(m => m.role === 'system')?.content;
      
      // Map messages to Gemini content format
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

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
        model,
        contents,
        config
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      if (jsonMode) {
        // Handle Markdown code blocks if present
        const cleanText = text.replace(/```json\s*|\s*```/g, "").replace(/```\s*|\s*```/g, "");
        return JSON.parse(cleanText);
      }

      return text;

    } catch (error: any) {
      attempt++;
      console.warn(`AI Attempt ${attempt} failed:`, error);
      
      if (attempt > maxRetries) {
        throw error;
      }
      // Simple exponential backoff
      await new Promise(res => setTimeout(res, 1000 * attempt));
    }
  }
};