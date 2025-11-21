
import { GoogleGenAI } from "@google/genai";

// Model Constants
export const MODEL_FAST = "gemini-2.5-flash"; 
export const MODEL_SMART = "gemini-3-pro-preview"; 

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
 * Base function to call AI.
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

  // Use process.env.API_KEY if available, otherwise use fallback
  const apiKey = process.env.API_KEY || FALLBACK_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai =