
import { db } from "./firebaseConfig";
import { collection, doc, setDoc, deleteDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { Task, Issue, VisitNote, Partner, SOP, Contact } from "../types";

const COLLECTIONS = {
  TASKS: "tasks",
  ISSUES: "issues",
  VISITS: "visits",
  PARTNERS: "partners",
  SOPS: "sops",
  CONTACTS: "contacts"
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

  subscribeToPartners: (callback: (partners: Partner[]) => void): Unsubscribe => {
    return onSnapshot(collection(db, COLLECTIONS.PARTNERS), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data() as Partner);
      callback(data);
    });
  },

  subscribeToSOPs: (callback: (sops: SOP[]) => void): Unsubscribe => {
    return onSnapshot(collection(db, COLLECTIONS.SOPS), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data() as SOP);
      callback(data);
    });
  },

  subscribeToContacts: (callback: (contacts: Contact[]) => void): Unsubscribe => {
    return onSnapshot(collection(db, COLLECTIONS.CONTACTS), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data() as Contact);
      callback(data);
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

  deleteVisit: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.VISITS, id));
    } catch (error) {
      console.error("Error deleting visit:", error);
    }
  },

  savePartner: async (partner: Partner): Promise<void> => {
    await setDoc(doc(db, COLLECTIONS.PARTNERS, partner.id), cleanData(partner));
  },

  deletePartner: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.PARTNERS, id));
  },

  saveSOP: async (sop: SOP): Promise<void> => {
    await setDoc(doc(db, COLLECTIONS.SOPS, sop.id), cleanData(sop));
  },

  deleteSOP: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.SOPS, id));
  },

  saveContact: async (contact: Contact): Promise<void> => {
    await setDoc(doc(db, COLLECTIONS.CONTACTS, contact.id), cleanData(contact));
  },

  deleteContact: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.CONTACTS, id));
  },
};
