import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Public identifiers, not secrets. Access is enforced by firestore.rules.
// https://firebase.google.com/docs/projects/api-keys
const firebaseConfig = {
  apiKey: 'AIzaSyBffq1ANXUapIjK-wG2yGFwg2-44e3A8Pc',
  authDomain: 'hpair-deliv-6443a.firebaseapp.com',
  projectId: 'hpair-deliv-6443a',
  messagingSenderId: '908480646127',
  appId: '1:908480646127:web:e8861bd5881b714a4d041a',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
