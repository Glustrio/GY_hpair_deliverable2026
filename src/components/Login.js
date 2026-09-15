// Sign in, register and password reset, sharing one form. Password reset matters:
// without it someone who forgets theirs cannot get back into their application.

import React, { useState } from 'react';
import { signInUser, registerUser, resetPassword } from '../services/authService';

const COPY = {
  login: { title: 'Sign in', action: 'Sign in', busy: 'Signing in' },
  register: { title: 'Create an account', action: 'Create account', busy: 'Creating' },
  reset: { title: 'Reset your password', action: 'Send reset link', busy: 'Sending' },
};

const Login = () => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const copy = COPY[mode];
  const isReset = mode === 'reset';

  const go = (next) => {
    setMode(next);
    setResult(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const run =
      mode === 'login' ? signInUser(email, password)
      : mode === 'register' ? registerUser(email, password)
      : resetPassword(email);

    setResult(await run);
    setLoading(false);
  };

  return (
    <div className="container container-narrow">
      <div className="form-container">
        <h2>{copy.title}</h2>
        <p className="auth-intro">
          {isReset
            ? 'Enter your email and we will send you a link.'
            : 'You need an account so you can save your progress and come back to it.'}
        </p>

        {result && (
          <div role="alert" className={`submit-message ${result.success ? 'success' : 'error'}`}>
            {result.message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
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

          {!isReset && (
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
                // new-password on register so a manager offers to save one rather
                // than autofilling the old one.
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                aria-describedby="password-hint"
                required
                minLength={6}
              />
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-block" aria-disabled={loading}>
              {loading ? copy.busy : copy.action}
            </button>
          </div>
        </form>

        <div className="auth-switch">
          {mode === 'login' && (
            <>
              <button type="button" className="btn-link" onClick={() => go('reset')}>
                Forgot your password?
              </button>
              <p>
                No account yet?{' '}
                <button type="button" className="btn-link" onClick={() => go('register')}>
                  Create one
                </button>
              </p>
            </>
          )}
          {mode !== 'login' && (
            <button type="button" className="btn-link" onClick={() => go('login')}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
