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
          {/* The only h1 on the page. Each step uses the heading below it. */}
          <h1>HPAIR Application</h1>
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
