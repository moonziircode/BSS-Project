
import { useState, useCallback } from 'react';
import { classifyIssue, autoFillIssueForm } from './aiClassifiers';
import { summarizeVisit, autoFillVisitForm } from './aiSummaries';
import { getSolutionSuggestion, getOperationalImprovement, getPriorityScore, autoFillTask } from './aiSuggestions';
import { sendMessage } from './aiChatEngine';
import { AIChatMessage, Task, Issue, VisitNote } from '../../types';

// Generic Hook Factory
function useAI<T, A extends any[]>(aiFunction: (...args: A) => Promise<T>) {
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (...args: A) => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiFunction(...args);
      setResult(res);
      return res;
    } catch (err: any) {
      console.error("AI Error:", err);
      setError(err.message || "AI Failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [aiFunction]);

  return { result, loading, error, run };
}

// --- Exported Hooks ---

export const useAIClassifier = () => useAI(classifyIssue);
export const useAIAutoFillIssue = () => useAI(autoFillIssueForm);

export const useAISummary = () => useAI(summarizeVisit);
export const useAIAutoFillVisit = () => useAI(autoFillVisitForm);

export const useAISuggestion = () => useAI(getSolutionSuggestion);
export const useAIImprovement = () => useAI(getOperationalImprovement);

export const useAIPriority = () => useAI(getPriorityScore);
export const useAIAutoFillTask = () => useAI(autoFillTask);

export const useAIChat = () => {
  const [history, setHistory] = useState<AIChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  
  const send = async (
    msg: string, 
    contextData?: { tasks: Task[], issues: Issue[], visits: VisitNote[] }
  ) => {
    setLoading(true);
    const newHistory = [...history, { role: 'user' as const, content: msg }];
    setHistory(newHistory);
    
    try {
      const res = await sendMessage(newHistory, msg, contextData);
      setHistory(prev => [...prev, { role: 'assistant', content: res.reply }]);
      return res;
    } catch (err) {
      console.error(err);
      setHistory(prev => [...prev, { role: 'assistant', content: "Maaf, terjadi kesalahan koneksi AI." }]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => setHistory([]);

  return { history, loading, send, clear };
};
