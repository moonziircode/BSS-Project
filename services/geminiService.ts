import { GoogleGenAI } from "@google/genai";

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