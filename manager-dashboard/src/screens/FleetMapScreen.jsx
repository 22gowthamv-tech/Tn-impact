import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import { getSocket } from '../services/socket';
import { BACKEND_URL, TRICHY_CENTER, STATUS_COLORS, STATUS_LABELS } from '../constants/api';

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
}

export default function FleetMapScreen() {
  const [drivers, setDrivers] = useState([]);
  const [trafficEdges, setTrafficEdges] = useState({});
  const [selectedDriver, setSelectedDriver] = useState(null);
  const driversRef = useRef([]);

  // Poll drivers every 5 seconds
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/drivers`);
        driversRef.current = res.data;
        setDrivers([...res.data]);
      } catch (e) { /* backend not up */ }
    };

    fetchDrivers();
    const interval = setInterval(fetchDrivers, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch traffic edges
  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/traffic_edges`);
        setTrafficEdges(res.data || {});
      } catch (e) { /* ok */ }
    };

    fetchTraffic();
    const interval = setInterval(fetchTraffic, 8000);
    return () => clearInterval(interval);
  }, []);

  // Socket.IO for live GPS updates
  useEffect(() => {
    const socket = getSocket();

    const onGpsUpdate = (data) => {
      const updated = driversRef.current.map(d =>
        d.id === data.driver_id
          ? { ...d, lat: data.lat, lng: data.lng, status: data.status, progress: data.progress, current_stop: data.current_stop }
          : d
      );
      driversRef.current = updated;
      setDrivers([...updated]);
    };

    const onRouteUpdated = (data) => {
      const updated = driversRef.current.map(d =>
        d.id === data.driver_id
          ? { ...d, road_path: data.road_path, route: data.new_route, sequence: data.sequence, etas: data.etas }
          : d
      );
      driversRef.current = updated;
      setDrivers([...updated]);
    };

    const onTrafficUpdate = (data) => {
      setTrafficEdges(prev => ({
        ...prev,
        [data.edge_id]: data
      }));
    };

    socket.on('gps_update', onGpsUpdate);
    socket.on('route_updated', onRouteUpdated);
    socket.on('traffic_update', onTrafficUpdate);

    return () => {
      socket.off('gps_update', onGpsUpdate);
      socket.off('route_updated', onRouteUpdated);
      socket.off('traffic_update', onTrafficUpdate);
    };
  }, []);

  const getDriverColor = useCallback((status) => STATUS_COLORS[status] || '#3b82f6', []);

  const activeTrafficCount = Object.values(trafficEdges).filter(e => e && e.level !== 'CLEAR').length;

  return (
    <div style={styles.container}>
      {/* Sidebar Panel */}
      <div style={styles.sidebar}>
        {/* Summary Cards */}
        <div style={styles.summaryRow}>
          <div style={{ ...styles.summaryCard, borderColor: 'rgba(34,197,94,0.3)' }}>
            <div style={{ ...styles.summaryNum, color: '#22c55e' }}>
              {drivers.filter(d => d.status === 'on_route').length}
            </div>
            <div style={styles.summaryLabel}>Active</div>
          </div>
          <div style={{ ...styles.summaryCard, borderColor: 'rgba(234,179,8,0.3)' }}>
            <div style={{ ...styles.summaryNum, color: '#eab308' }}>
              {drivers.filter(d => d.status === 'delayed').length}
            </div>
            <div style={styles.summaryLabel}>Delayed</div>
          </div>
          <div style={{ ...styles.summaryCard, borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={{ ...styles.summaryNum, color: '#ef4444' }}>
              {activeTrafficCount}
            </div>
            <div style={styles.summaryLabel}>Traffic</div>
          </div>
        </div>

        {/* Driver List */}
        <div style={styles.driverListHeader}>
          <span style={styles.sectionLabel}>DRIVERS</span>
          <span style={styles.countBadge}>{drivers.length}</span>
        </div>
        <div style={styles.driverList}>
          {drivers.map(driver => (
            <button
              key={driver.id}
              onClick={() => setSelectedDriver(selectedDriver?.id === driver.id ? null : driver)}
              style={{
                ...styles.driverItem,
                ...(selectedDriver?.id === driver.id ? styles.driverItemActive : {}),
              }}
            >
              <div style={{
                ...styles.driverDot,
                background: getDriverColor(driver.status),
                boxShadow: driver.status === 'on_route' ? `0 0 8px ${getDriverColor(driver.status)}` : 'none',
              }} />
              <div style={styles.driverInfo}>
                <div style={styles.driverName}>Driver #{driver.id}</div>
                <div style={styles.driverStatus}>
                  {STATUS_LABELS[driver.status] || driver.status}
                  {driver.status === 'on_route' && driver.total_stops > 0 && (
                    <span> · Stop {(driver.current_stop || 0) + 1}/{driver.total_stops}</span>
                  )}
                </div>
              </div>
              {driver.status === 'on_route' && driver.total_stops > 0 && (
                <div style={styles.progressRing}>
                  <svg width="28" height="28" viewBox="0 0 28 28">
                    <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                    <circle
                      cx="14" cy="14" r="11" fill="none"
                      stroke={getDriverColor(driver.status)}
                      strokeWidth="2.5"
                      strokeDasharray={`${((driver.current_stop || 0) / driver.total_stops) * 69.1} 69.1`}
                      strokeLinecap="round"
                      transform="rotate(-90 14 14)"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
          {drivers.length === 0 && (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 24 }}>🔄</span>
              <span>Waiting for driver data…</span>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div style={styles.mapWrapper}>
        <MapContainer
          center={TRICHY_CENTER}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            maxZoom={19}
            subdomains="abcd"
          />

          {/* Warehouse marker */}
          <CircleMarker
            center={TRICHY_CENTER}
            radius={9}
            pathOptions={{ fillColor: '#f97316', fillOpacity: 1, color: '#fff', weight: 2 }}
          >
            <Popup>🏭 <b>Central Warehouse</b><br />Trichy Junction</Popup>
          </CircleMarker>

          {/* Driver routes */}
          {drivers.map(driver => {
            const path = driver.road_path?.length > 1 ? driver.road_path : driver.route;
            if (!path || path.length < 2) return null;
            return (
              <Polyline
                key={`route-${driver.id}`}
                positions={path}
                pathOptions={{
                  color: getDriverColor(driver.status),
                  weight: selectedDriver?.id === driver.id ? 5 : 3,
                  opacity: selectedDriver ? (selectedDriver.id === driver.id ? 0.9 : 0.2) : 0.6,
                  dashArray: driver.status === 'idle' ? '6 4' : null,
                }}
              />
            );
          })}

          {/* Driver stop markers */}
          {drivers.map(driver => {
            if (!driver.route || driver.route.length < 2) return null;
            return driver.route.slice(1).map((stop, i) => (
              <CircleMarker
                key={`stop-${driver.id}-${i}`}
                center={stop}
                radius={5}
                pathOptions={{
                  fillColor: getDriverColor(driver.status),
                  fillOpacity: selectedDriver ? (selectedDriver.id === driver.id ? 0.8 : 0.1) : 0.5,
                  color: '#fff',
                  weight: 1,
                  opacity: selectedDriver ? (selectedDriver.id === driver.id ? 1 : 0.1) : 0.5,
                }}
              >
                <Popup>
                  <b>Driver #{driver.id}</b> - Stop {i + 1}<br />
                  {driver.stops ? driver.stops[i] : `P${i + 1}`}<br />
                  {driver.etas ? `ETA: ${driver.etas[i]}` : ''}
                </Popup>
              </CircleMarker>
            ));
          })}

          {/* Live GPS dots */}
          {drivers.map(driver => (
            <CircleMarker
              key={`gps-${driver.id}`}
              center={[driver.lat, driver.lng]}
              radius={selectedDriver?.id === driver.id ? 10 : 7}
              pathOptions={{
                fillColor: getDriverColor(driver.status),
                fillOpacity: 1,
                color: '#fff',
                weight: 2,
                opacity: selectedDriver ? (selectedDriver.id === driver.id ? 1 : 0.3) : 0.9,
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
                  <b>🚛 Driver #{driver.id}</b><br />
                  Status: {STATUS_LABELS[driver.status] || driver.status}<br />
                  {driver.total_stops > 0 && <>Progress: Stop {(driver.current_stop || 0) + 1}/{driver.total_stops}<br /></>}
                  {driver.total_distance && <>Distance: {driver.total_distance} km<br /></>}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {selectedDriver && <MapUpdater center={[selectedDriver.lat, selectedDriver.lng]} />}
        </MapContainer>

        {/* Map Legend */}
        <div style={styles.legend}>
          <div style={styles.legendTitle}>LEGEND</div>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} style={styles.legendItem}>
              <div style={{ ...styles.legendDot, background: STATUS_COLORS[key] }} />
              <span>{label}</span>
            </div>
          ))}
          <div style={styles.legendItem}>
            <div style={{ width: 16, height: 3, borderRadius: 2, background: '#ef4444' }} />
            <span>Traffic Jam</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
  },
  sidebar: {
    width: 300,
    flexShrink: 0,
    background: 'rgba(17,24,39,0.95)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  summaryRow: {
    display: 'flex',
    gap: 8,
    padding: '16px 16px 8px',
  },
  summaryCard: {
    flex: 1,
    padding: '10px 8px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    textAlign: 'center',
  },
  summaryNum: {
    fontSize: 22,
    fontWeight: 800,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  driverListHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px 8px',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  countBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: '#94a3b8',
    background: 'rgba(255,255,255,0.06)',
    padding: '2px 8px',
    borderRadius: 10,
  },
  driverList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 8px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  driverItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    color: '#f1f5f9',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  driverItemActive: {
    background: 'rgba(59,130,246,0.1)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  driverDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  driverInfo: {
    flex: 1,
    minWidth: 0,
  },
  driverName: {
    fontSize: 13,
    fontWeight: 600,
  },
  driverStatus: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  progressRing: {
    flexShrink: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 32,
    color: '#64748b',
    fontSize: 12,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    background: 'rgba(10,14,26,0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '12px 14px',
    zIndex: 999,
    fontSize: 11,
    color: '#94a3b8',
  },
  legendTitle: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: '#64748b',
    marginBottom: 8,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
};
