// Lists this user's own past submissions. The query is scoped server side, so there
// is nothing to filter here.

import React, { useState, useEffect, useCallback } from 'react';
import { getFormSubmissions } from '../services/firebaseService';

const formatDate = (timestamp) =>
  timestamp?.seconds ? new Date(timestamp.seconds * 1000).toLocaleString() : 'Just now';

// Takes userId as a prop rather than reading auth context itself, so its one data
// dependency is visible from the outside.
const MySubmissions = ({ userId, refreshKey }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    const result = await getFormSubmissions(userId);
    if (result.success) setSubmissions(result.data);
    else setError(result.message);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <section className="my-submissions">
      <h2>Your applications</h2>

      {error && <div className="submit-message error">{error}</div>}

      {loading && <p>Loading your applications.</p>}

      {!loading && submissions.length === 0 && <p>You have not sent an application yet.</p>}

      {!loading && submissions.length > 0 && (
        <div className="submissions-list">
          {submissions.map((submission) => (
            <div key={submission.id} className="submission-item">
              <div className="submission-header">
                <h3>Reference {submission.id.slice(-8).toUpperCase()}</h3>
                <span className="submission-date">{formatDate(submission.submittedAt)}</span>
              </div>
              <div className="submission-details">
                <p>
                  {submission.firstName} {submission.lastName}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MySubmissions;
