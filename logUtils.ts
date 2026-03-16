import { collection, addDoc, Firestore } from 'firebase/firestore';

export async function logAction(db: Firestore, user: string, action: string, details: string) {
  try {
    await addDoc(collection(db, 'logs'), {
      user,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log action:", error);
  }
}
