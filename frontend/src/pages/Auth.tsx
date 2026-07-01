import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import GlassButton from '../components/GlassButton';

const Auth: React.FC = () => {
  const { theme } = useTheme();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password, username);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: `1px solid ${theme.primary}44`,
    borderRadius: theme.borderRadius,
    fontFamily: theme.font,
    fontSize: '1rem',
    color: theme.text,
    background: theme.background,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: theme.font,
        padding: '1rem',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: theme.card,
          borderRadius: theme.borderRadius,
          padding: '2.5rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: theme.shadow,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: theme.primary, margin: '0 0 0.25rem' }}>
            Memozy
          </h1>
          <p style={{ color: theme.textLight, fontSize: '0.95rem' }}>
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'signup' && (
            <input
              style={inputStyle}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}
          <input
            style={inputStyle}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && (
            <div style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>
          )}

          <GlassButton type="submit" fullWidth loading={loading} size="lg">
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </GlassButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <GlassButton variant="ghost" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </GlassButton>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
