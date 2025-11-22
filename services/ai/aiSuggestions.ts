
import { callAI, MODEL_SMART, MODEL_FAST } from './aiService';
import { Issue, VisitNote, Partner, SOP, Contact } from '../../types';

export const getSolutionSuggestion = async (issue: Issue): Promise<string> => {
  const prompt = `
    Berikan solusi teknis dan taktis untuk masalah ini:
    Issue: ${issue.issueType}
    Opcode: ${issue.opcode}
    Kronologi: ${issue.chronology}
    
    Berikan 3 langkah perbaikan konkret untuk mitra/tim ops.
  `;

  return await callAI(
    [{ role: "system", content: "You are a Senior Logistics Operations Manager." }, { role: "user", content: prompt }],
    { model: MODEL_SMART }
  );
};

export const getOperationalImprovement = async (visit: VisitNote): Promise<string> => {
  const prompt = `
    Berdasarkan temuan visit di ${visit.partnerName}:
    "${visit.findings}"
    "${visit.operationalIssues}"
    
    Berikan rekomendasi strategi untuk meningkatkan jumlah paket (volume) dan kualitas layanan di titik ini.
  `;

  return await callAI(
    [{ role: "system", content: "You are a Business Consultant for Logistics." }, { role: "user", content: prompt }],
    { model: MODEL_SMART }
  );
};

export const getPriorityScore = async (taskTitle: string, taskDesc: string, division: string): Promise<{score: number, priorityLevel: string, reasoning: string}> => {
    const prompt = `
      Evaluate priority (1-100) for this task:
      Title: ${taskTitle}
      Desc: ${taskDesc}
      Div: ${division}
  
      Rules:
      - Score > 80 if: SLA breach, Stuck package, Urgent, "Atasan", Network Down. (Priority 1)
      - Score > 50 if: Deadline specific, Report, Visit plan. (Priority 2)
      - Score < 50: Nice to have, documentation. (Priority 3)
  
      Return JSON:
      {
        "score": number,
        "priorityLevel": "PRIORITY_1" | "PRIORITY_2" | "PRIORITY_3",
        "reasoning": "short reason"
      }
    `;
  
    return await callAI(
      [{ role: "system", content: "You are an automated task manager." }, { role: "user", content: prompt }],
      { model: MODEL_SMART, jsonMode: true }
    );
};
  
export const autoFillTask = async (text: string) => {
    const prompt = `
      Extract task details from: "${text}".
      Return JSON:
      {
        "title": "string",
        "description": "string",
        "division": "Operations | Finance | IT | Network | Customer Service | Partner Management",
        "category": "TODAY | THIS_WEEK | WAITING_UPDATE"
      }
    `;
    return await callAI(
      [{ role: "system", content: "You are a task parser." }, { role: "user", content: prompt }],
      { model: MODEL_FAST, jsonMode: true }
    );
};

// --- NEW FEATURES ---

export const analyzePartnerTrend = async (partner: Partner): Promise<string> => {
  const trend = partner.volumeM1 > partner.volumeM2 ? "NAIK" : "TURUN";
  const prompt = `
    Analisa performa Mitra Anteraja ini:
    Nama: ${partner.name}
    Status: ${partner.status}
    Volume 2 Bulan Lalu: ${partner.volumeM3}
    Volume Bulan Lalu: ${partner.volumeM2}
    Volume Bulan Ini: ${partner.volumeM1}
    Tren: ${trend}

    Berikan output singkat:
    1. **Analisa**: Apa kemungkinan penyebab tren ini?
    2. **Strategi**: Berikan 2 langkah taktis untuk BSS agar volume mitra ini meningkat bulan depan.
    3. **Topik Obrolan**: 1 Pertanyaan kunci untuk ditanyakan ke pemilik saat kunjungan/telepon.
  `;

  return await callAI(
    [{ role: "system", content: "You are a Senior Business Consultant for Logistics Partners." }, { role: "user", content: prompt }],
    { model: MODEL_SMART }
  );
};

export const askSOP = async (question: string, sops: SOP[]): Promise<string> => {
  // Context stuffing (send SOP summaries to AI)
  const context = sops.map(s => `Judul: ${s.title}\nIsi: ${s.content}`).join('\n---\n');
  
  const prompt = `
    Jawab pertanyaan user berdasarkan SOP Anteraja di bawah ini.
    Jika jawaban tidak ada di SOP, katakan "Tidak ditemukan di SOP yang tersedia".
    
    Data SOP:
    ${context}

    Pertanyaan User: "${question}"
    Jawab dengan singkat dan jelas.
  `;

  return await callAI(
    [{ role: "system", content: "You are an SOP Expert Bot." }, { role: "user", content: prompt }],
    { model: MODEL_SMART }
  );
};

export const draftMessage = async (contact: Contact, topic: string): Promise<string> => {
  const prompt = `
    Buatkan draft pesan WhatsApp profesional (sopan tapi *to the point*) untuk rekan kerja internal.
    
    Penerima: ${contact.name} (${contact.role} - Divisi ${contact.division})
    Topik: ${topic}
    
    Gunakan gaya bahasa korporat Indonesia yang baik.
  `;

  return await callAI(
    [{ role: "system", content: "You are a communication assistant." }, { role: "user", content: prompt }],
    { model: MODEL_FAST }
  );
};
