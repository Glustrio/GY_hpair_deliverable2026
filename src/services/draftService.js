import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'drafts';

// A draft is data at rest against a schema that can still change. Bump this when
// field names change so an old draft is discarded instead of restored into a form
// whose fields no longer match.
const DRAFT_VERSION = 1;

// Stored against the signed-in account rather than in the browser. The form holds a
// date of birth, a home address and a phone number, and browser storage has no
// expiry, is not cleared on sign out, and is readable by anyone with the profile
// directory. On a shared machine that leaves one applicant's details for the next.
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
