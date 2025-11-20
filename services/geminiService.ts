
import { GoogleGenAI } from "@google/genai";
import { VisitNote } from "../types";

const getAI = () => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateVisitSummary = async (
  findings: string,
  issues: string,
  suggestions: string
): Promise<string> => {
  const ai = getAI();
  if (!ai) return "AI Key Missing: Summary unavailable.";

  try {
    const prompt = `
      Sebagai asisten Business Success Specialist, buat ringkasan padat (maksimal 3-4 kalimat) 
      dari laporan kunjungan berikut:
      Temuan: ${findings}
      Isu Operasional: ${issues}
      Saran: ${suggestions}
      
      Fokus pada action item dan isu kritikal.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Gagal generate summary.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error saat menghubungi AI.";
  }
};

export const refineChronology = async (rawText: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return rawText;

  try {
    const prompt = `
      Rapihkan kronologi kejadian berikut agar menjadi profesional, mudah dibaca (bisa format poin-poin jika perlu), 
      dan jelas alurnya untuk laporan operasional. Jangan ubah fakta, hanya perbaiki tata bahasa dan struktur.
      
      Teks Asli:
      ${rawText}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || rawText;
  } catch (error) {
    console.error("Gemini Error:", error);
    return rawText;
  }
};

export const determinePriority = (title: string, description: string): string => {
  // Basic Rule-based Logic (Fast & Offline friendly)
  const text = `${title} ${description}`.toLowerCase();
  
  // P1 Keywords
  if (
    text.includes('stuck') || 
    text.includes('sla') || 
    text.includes('komplain') || 
    text.includes('urgent') || 
    text.includes('jaringan') ||
    text.includes('atasan') ||
    text.includes('emergency')
  ) {
    return 'PRIORITY_1';
  }

  // P2 Keywords
  if (
    text.includes('report') || 
    text.includes('laporan') || 
    text.includes('visit') || 
    text.includes('mapping') || 
    text.includes('weekly') ||
    text.includes('deadline')
  ) {
    return 'PRIORITY_2';
  }

  // Default P3
  return 'PRIORITY_3';
};

export const parseVisitNoteRaw = async (rawText: string): Promise<Partial<VisitNote>> => {
  const ai = getAI();
  if (!ai) return {};

  try {
    const prompt = `
      You are an intelligent data extraction assistant for a logistics operations app.
      Extract the following fields from the raw unstructured text below and return them as a JSON object.
      
      Raw Text:
      "${rawText}"

      Output JSON Schema (Do not include markdown formatting, just raw JSON):
      {
        "partnerName": "string (Extract the business/partner name)",
        "googleMapsLink": "string (Extract URL starting with https://maps...)",
        "coordinates": "string (Extract lat,long if present)",
        "ordersLastMonth": "number (Extract numeric value related to orders/month)",
        "findings": "string (Extract general observations, potential, conditions)",
        "operationalIssues": "string (Extract problems, complaints, broken items)",
        "suggestions": "string (Extract action items or future plans)"
      }

      If a field is not found, return an empty string or 0. 
      Translate the extracted content to professional Indonesian.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return {};
  }
};
