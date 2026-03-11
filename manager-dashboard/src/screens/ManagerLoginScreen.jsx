import React, { useState } from 'react';

export default function ManagerLoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    setTimeout(() => onLogin(name.trim()), 800);
  };

  return (
    <div style={styles.container}>
      {/* Animated background orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />

      <div style={styles.card} className="animate-fade-in">
        {/* Logo */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>🚛</div>
          <h1 style={styles.title}>LogiRoute AI</h1>
          <p style={styles.subtitle}>Fleet Manager Dashboard</p>
        </div>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>MANAGER LOGIN</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Manager Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              style={styles.input}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            style={{
              ...styles.btn,
              opacity: !name.trim() || isLoading ? 0.5 : 1,
              cursor: !name.trim() || isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <span style={styles.spinner}>⏳</span>
            ) : (
              <>
                <span>Access Dashboard</span>
                <span style={styles.arrow}>→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p style={styles.footer}>
          Real-time fleet monitoring for 10 drivers across Trichy
        </p>

        {/* Connection status */}
        <div style={styles.status}>
          <div style={styles.statusDot} />
          Backend: localhost:8080
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
    top: '10%',
    left: '10%',
    animation: 'pulse 8s ease-in-out infinite',
  },
  orb2: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
    bottom: '10%',
    right: '15%',
    animation: 'pulse 10s ease-in-out infinite reverse',
  },
  orb3: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
    top: '50%',
    right: '30%',
    animation: 'pulse 12s ease-in-out infinite',
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 420,
    background: 'rgba(17,24,39,0.85)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '48px 40px',
    zIndex: 1,
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 48,
    width: 80,
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
    borderRadius: 20,
    boxShadow: '0 0 40px rgba(59,130,246,0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    background: 'linear-gradient(135deg, #fff 0%, #06b6d4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 500,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    color: '#64748b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
  },
  input: {
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#f1f5f9',
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 24px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    color: '#fff',
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.3s',
    boxShadow: '0 0 20px rgba(59,130,246,0.3)',
  },
  arrow: {
    fontSize: 18,
    transition: 'transform 0.2s',
  },
  spinner: {
    animation: 'pulse 1s infinite',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#475569',
    marginTop: 24,
    lineHeight: 1.5,
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    fontSize: 11,
    color: '#475569',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#f97316',
  },
};
