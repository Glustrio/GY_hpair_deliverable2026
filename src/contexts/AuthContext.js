// Holds the signed in user so any component can read it without prop drilling.
// Firebase tells us when sign in state changes, and this re-renders the tree.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange } from '../services/authService';

const AuthContext = createContext();

// Throws rather than returning undefined if used outside the provider, so the mistake
// surfaces immediately instead of as a confusing null further down.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    userId: user?.uid || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
