import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getSocket } from '../services/socket';
import { BACKEND_URL } from '../constants/api';

export default function FleetStatsScreen() {
  const [stats, setStats] = useState({
    on_time: 0,
    delayed: 0,
    critical: 0,
    success_rate: 0,
    avg_delay: '0min',
  });
  const [drivers, setDrivers] = useState([]);
  const [animatedValues, setAnimatedValues] = useState({});

  // Fetch fleet stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/fleet_stats`);
        setStats(res.data);
      } catch (e) { /* backend not up */ }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch drivers for the table
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/drivers`);
        setDrivers(res.data);
      } catch (e) { /* ok */ }
    };

    fetchDrivers();
    const interval = setInterval(fetchDrivers, 5000);
    return () => clearInterval(interval);
  }, []);

  // Socket.IO for live stats
  useEffect(() => {
    const socket = getSocket();

    const onFleetStats = (data) => {
      setStats(data);
    };

    socket.on('fleet_stats', onFleetStats);
    return () => socket.off('fleet_stats', onFleetStats);
  }, []);

  const successPct = Math.round((stats.success_rate || 0) * 100);
  const totalDrivers = drivers.length || 10;
  const onTimePct = Math.round((stats.on_time / totalDrivers) * 100);

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Top Metric Cards */}
      <div style={styles.metricsGrid}>
        <MetricCard
          icon="✅"
          label="On Time"
          value={stats.on_time}
          suffix={`/ ${totalDrivers}`}
          color="#22c55e"
          gradient="linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))"
          borderColor="rgba(34,197,94,0.3)"
        />
        <MetricCard
          icon="⏳"
          label="Delayed"
          value={stats.delayed}
          suffix="drivers"
          color="#eab308"
          gradient="linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))"
          borderColor="rgba(234,179,8,0.3)"
        />
        <MetricCard
          icon="🚨"
          label="Critical"
          value={stats.critical || 0}
          suffix="alerts"
          color="#ef4444"
          gradient="linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))"
          borderColor="rgba(239,68,68,0.3)"
        />
        <MetricCard
          icon="📈"
          label="Success Rate"
          value={successPct}
          suffix="%"
          color="#3b82f6"
          gradient="linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))"
          borderColor="rgba(59,130,246,0.3)"
        />
        <MetricCard
          icon="⏱️"
          label="Avg Delay"
          value={stats.avg_delay || '0min'}
          color="#a855f7"
          gradient="linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))"
          borderColor="rgba(168,85,247,0.3)"
          isText
        />
        <MetricCard
          icon="🎯"
          label="On-Time Rate"
          value={onTimePct}
          suffix="%"
          color="#06b6d4"
          gradient="linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))"
          borderColor="rgba(6,182,212,0.3)"
        />
      </div>

      {/* Progress Bars */}
      <div style={styles.progressSection}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Fleet Performance</h3>
          <div style={styles.progressBars}>
            <ProgressBar label="On-Time Delivery" value={onTimePct} color="#22c55e" />
            <ProgressBar label="Success Rate" value={successPct} color="#3b82f6" />
            <ProgressBar label="Fleet Utilization" value={Math.round((drivers.filter(d => d.status === 'on_route').length / totalDrivers) * 100)} color="#a855f7" />
          </div>
        </div>

        {/* Status Distribution */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Status Distribution</h3>
          <div style={styles.statusGrid}>
            {[
              { status: 'on_route', label: 'On Route', color: '#22c55e', icon: '🚛' },
              { status: 'idle', label: 'Idle', color: '#3b82f6', icon: '⏸️' },
              { status: 'delayed', label: 'Delayed', color: '#eab308', icon: '⚠️' },
              { status: 'completed', label: 'Completed', color: '#a855f7', icon: '✅' },
            ].map(item => {
              const count = drivers.filter(d => d.status === item.status).length;
              return (
                <div key={item.status} style={styles.statusItem}>
                  <div style={{ ...styles.statusCount, color: item.color }}>{count}</div>
                  <div style={styles.statusLabel}>
                    <span>{item.icon}</span> {item.label}
                  </div>
                  <div style={styles.statusBar}>
                    <div style={{
                      ...styles.statusBarFill,
                      width: `${(count / totalDrivers) * 100}%`,
                      background: item.color,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Driver Table */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Driver Details</h3>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Driver</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Progress</th>
                <th style={styles.th}>Distance</th>
                <th style={styles.th}>Stops</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(driver => (
                <tr key={driver.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.driverCell}>
                      <div style={{
                        ...styles.dot,
                        background: STATUS_COLORS_MAP[driver.status] || '#3b82f6',
                      }} />
                      #{driver.id}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusChip,
                      background: `${STATUS_COLORS_MAP[driver.status] || '#3b82f6'}20`,
                      color: STATUS_COLORS_MAP[driver.status] || '#3b82f6',
                      borderColor: `${STATUS_COLORS_MAP[driver.status] || '#3b82f6'}40`,
                    }}>
                      {driver.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {driver.total_stops > 0
                      ? `${driver.current_stop || 0}/${driver.total_stops}`
                      : '—'}
                  </td>
                  <td style={styles.td}>
                    {driver.total_distance ? `${driver.total_distance} km` : '—'}
                  </td>
                  <td style={styles.td}>
                    {driver.stops ? driver.stops.join(', ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS_MAP = {
  on_route: '#22c55e',
  idle: '#3b82f6',
  delayed: '#eab308',
  completed: '#a855f7',
  rerouting: '#f97316',
};

function MetricCard({ icon, label, value, suffix, color, gradient, borderColor, isText }) {
  return (
    <div style={{
      ...metricStyles.card,
      background: gradient,
      borderColor: borderColor,
    }}>
      <div style={metricStyles.icon}>{icon}</div>
      <div style={{ ...metricStyles.value, color }}>
        {isText ? value : <>{value}<span style={metricStyles.suffix}>{suffix}</span></>}
      </div>
      <div style={metricStyles.label}>{label}</div>
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  return (
    <div style={progressStyles.container}>
      <div style={progressStyles.header}>
        <span style={progressStyles.label}>{label}</span>
        <span style={{ ...progressStyles.value, color }}>{value}%</span>
      </div>
      <div style={progressStyles.track}>
        <div style={{
          ...progressStyles.fill,
          width: `${Math.min(value, 100)}%`,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          boxShadow: `0 0 12px ${color}40`,
        }} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 24,
    overflowY: 'auto',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  progressSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  card: {
    background: 'rgba(17,24,39,0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: 16,
  },
  progressBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  statusItem: {
    padding: 12,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  statusCount: {
    fontSize: 24,
    fontWeight: 800,
  },
  statusLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBar: {
    height: 3,
    borderRadius: 2,
    background: 'rgba(255,255,255,0.06)',
    marginTop: 8,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.5s ease-out',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    color: '#64748b',
    fontWeight: 600,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tr: {
    transition: 'background 0.2s',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    color: '#94a3b8',
    fontSize: 12,
  },
  driverCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 600,
    color: '#f1f5f9',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  statusChip: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 600,
    border: '1px solid',
    textTransform: 'capitalize',
  },
};

const metricStyles = {
  card: {
    padding: '18px 16px',
    borderRadius: 14,
    border: '1px solid',
    textAlign: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  icon: {
    fontSize: 24,
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1,
  },
  suffix: {
    fontSize: 14,
    fontWeight: 500,
    opacity: 0.7,
    marginLeft: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
};

const progressStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 500,
  },
  value: {
    fontSize: 13,
    fontWeight: 700,
  },
  track: {
    height: 6,
    borderRadius: 3,
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
  },
};
