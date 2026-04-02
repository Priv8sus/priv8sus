import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onSwitchToSignup: () => void;
  onClose?: () => void;
}

export function Login({ onSwitchToSignup, onClose }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      onClose?.();
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="auth-form">
      <h2>Welcome Back</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            disabled={loading}
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="auth-switch">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToSignup} className="link-btn">
          Sign up
        </button>
      </p>
    </div>
  );
}
