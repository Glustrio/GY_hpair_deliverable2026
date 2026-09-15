import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'drafts';

// Bump when field names change, so old drafts are discarded rather than restored.
const DRAFT_VERSION = 1;

// On the account, not in the browser. This holds a home address, and browser storage
// has no expiry and is not cleared on sign out.
export const saveDraft = async (userId, values, stepIndex) => {
  try {
    await setDoc(doc(db, COLLECTION_NAME, userId), {
      version: DRAFT_VERSION,
      values,
      stepIndex,
      savedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving draft:', error);
    return { success: false };
  }
};

export const loadDraft = async (userId) => {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION_NAME, userId));
    if (!snapshot.exists()) return { success: true, draft: null };

    const data = snapshot.data();
    if (data.version !== DRAFT_VERSION) return { success: true, draft: null };

    return { success: true, draft: data };
  } catch (error) {
    console.error('Error loading draft:', error);
    return { success: false, draft: null };
  }
};

export const clearDraft = async (userId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, userId));
    return { success: true };
  } catch (error) {
    console.error('Error clearing draft:', error);
    return { success: false };
  }
};
