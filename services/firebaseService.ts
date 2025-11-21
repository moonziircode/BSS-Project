
import { db } from "./firebaseConfig";
import { collection, doc, setDoc, deleteDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { Task, Issue, VisitNote } from "../types";

const COLLECTIONS = {
  TASKS: "tasks",
  ISSUES: "issues",
  VISITS: "visits",
};

// Helper to remove undefined fields because Firestore setDoc crashes on them
const cleanData = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

export const firebaseService = {
  // --- REAL-TIME LISTENERS ---

  subscribeToTasks: (callback: (tasks: Task[]) => void): Unsubscribe => {
    return onSnapshot(collection(db, COLLECTIONS.TASKS), (snapshot) => {
      const tasks = snapshot.docs.map((doc) => doc.data() as Task);
      callback(tasks);
    }, (error) => {
      console.error("Error listening to tasks:", error);
    });
  },

  subscribeToIssues: (callback: (issues: Issue[]) => void): Unsubscribe => {
    return onSnapshot(collection(db, COLLECTIONS.ISSUES), (snapshot) => {
      const issues = snapshot.docs.map((doc) => doc.data() as Issue);
      callback(issues);
    }, (error) => {
      console.error("Error listening to issues:", error);
    });
  },

  subscribeToVisits: (callback: (visits: VisitNote[]) => void): Unsubscribe => {
    return onSnapshot(collection(db, COLLECTIONS.VISITS), (snapshot) => {
      const visits = snapshot.docs.map((doc) => doc.data() as VisitNote);
      callback(visits);
    }, (error) => {
      console.error("Error listening to visits:", error);
    });
  },

  // --- WRITE OPERATIONS ---

  saveTask: async (task: Task): Promise<void> => {
    try {
      await setDoc(doc(db, COLLECTIONS.TASKS, task.id), cleanData(task));
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

  saveIssue: async (issue: Issue): Promise<void> => {
    try {
      await setDoc(doc(db, COLLECTIONS.ISSUES, issue.id), cleanData(issue));
    } catch (error) {
      console.error("Error saving issue:", error);
    }
  },

  saveVisit: async (visit: VisitNote): Promise<void> => {
    try {
      await setDoc(doc(db, COLLECTIONS.VISITS, visit.id), cleanData(visit));
    } catch (error) {
      console.error("Error saving visit:", error);
    }
  },
};
