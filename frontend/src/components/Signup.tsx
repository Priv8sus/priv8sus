import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SignupProps {
  onSwitchToLogin: () => void;
  onClose?: () => void;
}

export function Signup({ onSwitchToLogin, onClose }: SignupProps) {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await signup(email, password);
    setLoading(false);

    if (result.success) {
      onClose?.();
    } else {
      setError(result.error || 'Signup failed');
    }
  };

  return (
    <div className="auth-form">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-confirm">Confirm Password</label>
          <input
            id="signup-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            required
            disabled={loading}
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="link-btn">
          Sign in
        </button>
      </p>
    </div>
  );
}
