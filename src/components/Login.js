import React, { useState } from 'react';
import { signInUser, registerUser } from '../services/authService';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let result;
      if (isLogin) {
        result = await signInUser(email, password);
      } else {
        result = await registerUser(email, password);
      }

      setMessage(result.message);
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2>{isLogin ? 'Sign in' : 'Create an account'}</h2>
        <p>{isLogin ? 'Sign in to access the form challenge' : 'Create an account to get started'}</p>

        {message && (
          <div
            role="alert"
            className={`submit-message ${message.includes('successful') ? 'success' : 'error'}`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <p className="form-hint" id="password-hint">
              At least 6 characters.
            </p>
            <input
              id="password"
              name="password"
              type="password"
              // current-password on sign in, new-password on register, so a password
              // manager offers to save a new one rather than autofilling the old one.
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              aria-describedby="password-hint"
              required
              minLength={6}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage('');
              }}
              className="btn-link"
            >
              {isLogin ? 'Register here' : 'Login here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
