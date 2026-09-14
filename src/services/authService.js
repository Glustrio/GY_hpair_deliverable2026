// Authentication service using Firebase Auth
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase/config';

// Register a new user
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { 
      success: true, 
      user: userCredential.user,
      message: 'Registration successful!' 
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { 
      success: false, 
      message: getErrorMessage(error.code) 
    };
  }
};

// Sign in existing user
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { 
      success: true, 
      user: userCredential.user,
      message: 'Login successful!' 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      message: getErrorMessage(error.code) 
    };
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, message: 'Logged out successfully!' };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: 'Failed to logout' };
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};


// Helper function to get user-friendly error messages
const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please try logging in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    // Firebase now returns one generic code for a bad email and a bad password, so
    // the two cases below almost never fire. Email enumeration protection is on by
    // default, which stops an attacker probing which addresses have accounts.
    case 'auth/invalid-credential':
      return 'That email and password do not match an account. Check both and try again.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please register first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
};
