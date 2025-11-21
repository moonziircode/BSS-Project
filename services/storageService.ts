/**
 * Local Storage Service
 * Primarily used for Session/User Preference flags now that data is on Firebase.
 */

const KEYS = {
  HAS_SEEN_CHECKLIST: 'BS_OPS_HAS_SEEN_CHECKLIST'
};

export const hasSeenChecklistToday = (): boolean => {
  const stored = sessionStorage.getItem(KEYS.HAS_SEEN_CHECKLIST);
  return stored === 'true';
};

export const markChecklistAsSeen = () => {
  sessionStorage.setItem(KEYS.HAS_SEEN_CHECKLIST, 'true');
};