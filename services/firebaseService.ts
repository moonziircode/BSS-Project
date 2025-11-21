import { db } from "./firebaseConfig";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Task, Issue, VisitNote } from "../types";

const COLLECTIONS = {
  TASKS: "tasks",
  ISSUES: "issues",
  VISITS: "visits",
};

export const firebaseService = {
  // --- TASKS ---
  getTasks: async (): Promise<Task[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.TASKS));
      return snapshot.docs.map((doc) => doc.data() as Task);
    } catch (error) {
      console.error("Error getting tasks:", error);
      return [];
    }
  },

  saveTask: async (task: Task): Promise<void> => {
    try {
      // Uses task.id as the document ID for easy updates
      await setDoc(doc(db, COLLECTIONS.TASKS, task.id), task);
    } catch (error) {
      console.error("Error saving task:", error);
    }
  },

  deleteTask: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.TASKS, id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  },

  // --- ISSUES ---
  getIssues: async (): Promise<Issue[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.ISSUES));
      return snapshot.docs.map((doc) => doc.data() as Issue);
    } catch (error) {
      console.error("Error getting issues:", error);
      return [];
    }
  },

  saveIssue: async (issue: Issue): Promise<void> => {
    try {
      await setDoc(doc(db, COLLECTIONS.ISSUES, issue.id), issue);
    } catch (error) {
      console.error("Error saving issue:", error);
    }
  },

  // --- VISITS ---
  getVisits: async (): Promise<VisitNote[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.VISITS));
      return snapshot.docs.map((doc) => doc.data() as VisitNote);
    } catch (error) {
      console.error("Error getting visits:", error);
      return [];
    }
  },

  saveVisit: async (visit: VisitNote): Promise<void> => {
    try {
      await setDoc(doc(db, COLLECTIONS.VISITS, visit.id), visit);
    } catch (error) {
      console.error("Error saving visit:", error);
    }
  },
};
