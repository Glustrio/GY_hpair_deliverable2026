import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Public identifiers, not secrets. Access is enforced by firestore.rules.
// https://firebase.google.com/docs/projects/api-keys
const firebaseConfig = {
  apiKey: 'AIzaSyClZzu2rYz8juxlNh8TUmAvakK0a6Lqz5M',
  authDomain: 'gordon-s-project.firebaseapp.com',
  projectId: 'gordon-s-project',
  messagingSenderId: '516156090984',
  appId: '1:516156090984:web:855fc4eb86c3760709e9dd',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
