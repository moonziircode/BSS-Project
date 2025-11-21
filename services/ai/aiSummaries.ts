
import { callAI, MODEL_SMART } from './aiService';
import { VisitNote } from '../../types';

export const summarizeVisit = async (visit: Partial<VisitNote>): Promise<string> => {
  const prompt = `
    Buat ringkasan kunjungan profesional (bullet points) untuk Supervisor Anteraja berdasarkan data ini:
    Mitra: ${visit.partnerName}
    Temuan: ${visit.findings}
    Isu: ${visit.operationalIssues}
    Saran: ${visit.suggestions}
    Data Order: ${visit.ordersLastMonth} (Avg: ${visit.ordersDailyAvg})

    Format:
    - **Highlight**: [Poin utama]
    - **Action Item**: [Apa yang harus dilakukan]
    - **Status**: [Positif/Negatif/Netral]
  `;

  return await callAI(
    [{ role: "system", content: "You are a Business Success Specialist Assistant." }, { role: "user", content: prompt }],
    { model: MODEL_SMART }
  );
};

export const autoFillVisitForm = async (rawText: string) => {
  const prompt = `
     Extract visit data from text: "${rawText}".
     Return JSON:
     {
        "partnerName": "string",
        "googleMapsLink": "string",
        "coordinates": "string",
        "ordersLastMonth": number,
        "findings": "string",
        "operationalIssues": "string",
        "suggestions": "string"
     }
     If info is missing, use empty string or 0.
  `;
  
  return await callAI(
    [{ role: "system", content: "You are a data extractor." }, { role: "user", content: prompt }],
    { model: MODEL_SMART, jsonMode: true }
  );
};