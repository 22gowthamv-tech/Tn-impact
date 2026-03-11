import React, { useState, useEffect, useCallback } from 'react';
import { getSocket } from './services/socket';
import ManagerLoginScreen from './screens/ManagerLoginScreen';
import FleetMapScreen from './screens/FleetMapScreen';
import FleetStatsScreen from './screens/FleetStatsScreen';
import ManagerAlertsScreen from './screens/ManagerAlertsScreen';

const TABS = [
  { id: 'map',    label: 'Fleet Map',   icon: '🗺️' },
  { id: 'stats',  label: 'Statistics',  icon: '📊' },
  { id: 'alerts', label: 'X-AI Alerts', icon: '🤖' },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [managerName, setManagerName] = useState('');
  const [activeTab, setActiveTab] = useState('map');
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;

    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onXaiAlert = (data) => {
      const newAlert = {
        ...data,
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setAlerts(prev => [newAlert, ...prev].slice(0, 200));
      if (activeTab !== 'alerts') {
        setUnreadAlerts(prev => prev + 1);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('xai_alert', onXaiAlert);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('xai_alert', onXaiAlert);
    };
  }, [isLoggedIn, activeTab]);

  const handleLogin = useCallback((name) => {
    setManagerName(name);
    setIsLoggedIn(true);
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    if (tabId === 'alerts') setUnreadAlerts(0);
  }, []);

  if (!isLoggedIn) {
    return <ManagerLoginScreen onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🚛</span>
            <div>
              <div style={styles.logoText}>LogiRoute AI</div>
              <div style={styles.logoSub}>Fleet Manager Dashboard</div>
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                ...styles.navBtn,
                ...(activeTab === tab.id ? styles.navBtnActive : {})
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'alerts' && unreadAlerts > 0 && (
                <span style={styles.badge}>{unreadAlerts > 99 ? '99+' : unreadAlerts}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.headerRight}>
          <div style={{
            ...styles.connDot,
            background: connected ? '#22c55e' : '#ef4444',
            boxShadow: connected ? '0 0 8px #22c55e' : '0 0 8px #ef4444'
          }} />
          <span style={styles.connText}>{connected ? 'Live' : 'Offline'}</span>
          <div style={styles.avatar}>{managerName.charAt(0).toUpperCase()}</div>
        </div>
      </header>

      {/* Content */}
      <main style={styles.main}>
        {activeTab === 'map'    && <FleetMapScreen />}
        {activeTab === 'stats'  && <FleetStatsScreen />}
        {activeTab === 'alerts' && <ManagerAlertsScreen alerts={alerts} />}
      </main>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: 64,
    background: 'rgba(17,24,39,0.92)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    fontSize: 28,
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
    borderRadius: 10,
    boxShadow: '0 0 20px rgba(59,130,246,0.3)',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #fff, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 500,
    letterSpacing: 0.5,
  },
  nav: {
    display: 'flex',
    gap: 4,
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 4,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    fontFamily: 'Inter, sans-serif',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
  },
  navBtnActive: {
    background: 'rgba(59,130,246,0.15)',
    color: '#f1f5f9',
    boxShadow: '0 0 12px rgba(59,130,246,0.15)',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    background: '#ef4444',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 5px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    transition: 'all 0.3s',
  },
  connText: {
    fontSize: 12,
    fontWeight: 500,
    color: '#94a3b8',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    marginLeft: 6,
  },
  main: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
};
