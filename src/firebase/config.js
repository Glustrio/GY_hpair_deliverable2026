import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// These values are public identifiers, not secrets. A client-side app has to ship
// them to every browser, so they are readable in the bundle no matter where they
// live. Access is enforced by firestore.rules instead.
// https://firebase.google.com/docs/projects/api-keys
//
// REPLACE THIS BLOCK with the config from your own Firebase project:
// Project settings -> General -> Your apps -> SDK setup and configuration -> Config
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
