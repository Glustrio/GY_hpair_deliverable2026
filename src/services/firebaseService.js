import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'formSubmissions';

export const submitForm = async (formData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...formData,
      // Written by Google's servers, so it cannot be forged and every row shares
      // one clock. The security rules pin it with submittedAt == request.time.
      submittedAt: serverTimestamp(),
    });

    return {
      success: true,
      id: docRef.id,
      message: 'Form submitted successfully!',
    };
  } catch (error) {
    console.error('Error submitting form:', error);
    // Retrying only helps for some of these, so say which.
    if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
      return { success: false, message: 'Your session has expired. Sign in again and re-send.' };
    }
    if (error.code === 'unavailable') {
      return { success: false, message: 'Could not reach the server. Check your connection and try again.' };
    }
    return { success: false, message: 'Could not send your application. Please try again.' };
  }
};

// Scoped to one user in the query itself. Filtering in the browser would mean
// downloading everyone's submissions first, which is a privacy leak and not a filter.
export const getFormSubmissions = async (userId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('submittedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return {
      success: true,
      data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    };
  } catch (error) {
    console.error('Error fetching submissions:', error);
    // where() + orderBy() on different fields needs a composite index. The thrown
    // error carries a console link that creates it.
    if (error.code === 'failed-precondition') {
      return {
        success: false,
        message: 'This list needs a database index that has not been created yet.',
      };
    }
    return { success: false, message: 'Failed to load your submissions.' };
  }
};
