import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import MultiStepForm from './components/MultiStepForm';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container">
        <div className="form-container">
          <p>Checking your sign in.</p>
        </div>
      </div>
    );
  }

  return user ? children : <Login />;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <header className="App-header">
          {/* The h1 text is visually hidden rather than removed, so the page still has
              a real heading for screen readers and the logo is not the only label. */}
          <h1>
            <img src={`${process.env.PUBLIC_URL}/hpair-logo.webp`} alt="HPAIR" height="34" />
            <span className="visually-hidden">HPAIR Application</span>
          </h1>
        </header>
        <main>
          <ProtectedRoute>
            <MultiStepForm />
          </ProtectedRoute>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
