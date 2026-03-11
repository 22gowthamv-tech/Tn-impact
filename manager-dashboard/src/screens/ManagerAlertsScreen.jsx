import React, { useRef, useEffect } from 'react';

const ALERT_TYPE_CONFIG = {
  traffic_reroute:  { icon: '🚧', color: '#ef4444', label: 'Traffic Reroute' },
  traffic_alert:    { icon: '⚠️', color: '#eab308', label: 'Traffic Alert' },
  route_optimized:  { icon: '🗺️', color: '#3b82f6', label: 'Route Optimized' },
  new_order:        { icon: '📦', color: '#22c55e', label: 'New Order' },
  weather:          { icon: '🌧️', color: '#06b6d4', label: 'Weather' },
  delay:            { icon: '⏳', color: '#f97316', label: 'Delay' },
};

export default function ManagerAlertsScreen({ alerts = [] }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current && alerts.length > 0) {
      listRef.current.scrollTop = 0;
    }
  }, [alerts.length]);

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>X-AI Alert Feed</h2>
          <p style={styles.subtitle}>
            Fleet-wide AI explanations for all routing decisions
          </p>
        </div>
        <div style={styles.countChip}>
          <span style={styles.countDot} />
          {alerts.length} alerts
        </div>
      </div>

      {/* Alert Categories Summary */}
      <div style={styles.categories}>
        {Object.entries(ALERT_TYPE_CONFIG).map(([type, config]) => {
          const count = alerts.filter(a => a.type === type).length;
          return (
            <div key={type} style={{
              ...styles.categoryChip,
              borderColor: count > 0 ? `${config.color}40` : 'rgba(255,255,255,0.06)',
              background: count > 0 ? `${config.color}10` : 'rgba(255,255,255,0.02)',
            }}>
              <span>{config.icon}</span>
              <span style={{ color: count > 0 ? config.color : '#64748b' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Alert List */}
      <div style={styles.alertList} ref={listRef}>
        {alerts.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🤖</div>
            <div style={styles.emptyTitle}>No alerts yet</div>
            <div style={styles.emptyText}>
              X-AI explanations will appear here when the backend processes routing decisions, traffic events, or weather changes.
            </div>
          </div>
        )}

        {alerts.map((alert, idx) => {
          const config = ALERT_TYPE_CONFIG[alert.type] || ALERT_TYPE_CONFIG.traffic_alert;
          return (
            <div
              key={alert.id || idx}
              style={{
                ...styles.alertItem,
                borderLeftColor: config.color,
                animation: idx === 0 ? 'slideInRight 0.35s ease-out' : 'none',
              }}
              className={idx === 0 ? 'animate-slide-in' : ''}
            >
              {/* Alert Header */}
              <div style={styles.alertHeader}>
                <div style={styles.alertMeta}>
                  <span style={{
                    ...styles.typeBadge,
                    background: `${config.color}20`,
                    color: config.color,
                    borderColor: `${config.color}40`,
                  }}>
                    {config.icon} {config.label}
                  </span>
                  <span style={styles.driverTag}>
                    {alert.driver_id === 'all' ? '🏢 Fleet-wide' : `🚛 Driver #${alert.driver_id}`}
                  </span>
                </div>
                <span style={styles.timestamp}>{alert.timestamp}</span>
              </div>

              {/* Alert Message */}
              <div style={styles.alertMessage}>
                {alert.message}
              </div>

              {/* Translated Message */}
              {alert.message_translated && alert.message_translated !== alert.message && (
                <div style={styles.translated}>
                  <span style={styles.langBadge}>
                    {alert.language_name || alert.language || 'Translation'}
                  </span>
                  {alert.message_translated}
                </div>
              )}

              {/* Audio indicator */}
              {alert.audio_base64 && (
                <div style={styles.audioRow}>
                  <button
                    style={styles.playBtn}
                    onClick={() => {
                      try {
                        const audio = new Audio('data:audio/mp3;base64,' + alert.audio_base64);
                        audio.play();
                      } catch (e) { console.warn('Audio play failed', e); }
                    }}
                  >
                    🔊 Play Voice Alert
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: 24,
    gap: 16,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  countChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 500,
    flexShrink: 0,
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 6px #22c55e',
    animation: 'pulse 2s infinite',
    display: 'inline-block',
  },
  categories: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  categoryChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    borderRadius: 8,
    border: '1px solid',
    fontSize: 12,
    fontWeight: 600,
  },
  alertList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 40px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 1.5,
    maxWidth: 360,
  },
  alertItem: {
    background: 'rgba(17,24,39,0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderLeft: '3px solid',
    borderRadius: 12,
    padding: '14px 16px',
    transition: 'border-color 0.2s',
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  alertMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 600,
    border: '1px solid',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  driverTag: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 500,
  },
  timestamp: {
    fontSize: 11,
    color: '#475569',
    fontWeight: 500,
    fontVariantNumeric: 'tabular-nums',
  },
  alertMessage: {
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: 1.5,
  },
  translated: {
    marginTop: 8,
    padding: '8px 10px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 1.4,
  },
  langBadge: {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 4,
    background: 'rgba(6,182,212,0.15)',
    color: '#06b6d4',
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    marginRight: 6,
  },
  audioRow: {
    marginTop: 8,
  },
  playBtn: {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid rgba(168,85,247,0.3)',
    background: 'rgba(168,85,247,0.1)',
    color: '#c084fc',
    fontFamily: 'Inter, sans-serif',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
