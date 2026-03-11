import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, TRICHY_CENTER, BACKEND_URL } from '../constants/api';
import { useDriverData } from '../hooks/useDriverData';
import { useSocket } from '../hooks/useSocket';

// Leaflet imports are web-only
let MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap;
if (Platform.OS === 'web') {
  const RL = require('react-leaflet');
  MapContainer = RL.MapContainer;
  TileLayer = RL.TileLayer;
  Polyline = RL.Polyline;
  CircleMarker = RL.CircleMarker;
  Marker = RL.Marker;
  Popup = RL.Popup;
  useMap = RL.useMap;
}

// Component to animate GPS dot smoothly
function AnimatedGPSDot({ lat, lng }) {
  return (
    <>
      {/* Outer pulse ring */}
      <CircleMarker
        center={[lat, lng]}
        radius={18}
        pathOptions={{
          color: COLORS.green,
          fillColor: COLORS.greenGlow,
          fillOpacity: 0.3,
          weight: 1,
        }}
      />
      {/* Inner solid dot */}
      <CircleMarker
        center={[lat, lng]}
        radius={8}
        pathOptions={{
          color: '#fff',
          fillColor: COLORS.green,
          fillOpacity: 1,
          weight: 2,
        }}
      />
    </>
  );
}

// Stop markers
function StopMarkers({ route, sequence }) {
  if (!route || route.length < 2) return null;
  const stops = route.slice(1); // skip warehouse

  return stops.map((coord, i) => (
    <CircleMarker
      key={i}
      center={coord}
      radius={10}
      pathOptions={{
        color: COLORS.blue,
        fillColor: COLORS.bgCard,
        fillOpacity: 0.9,
        weight: 3,
      }}
    >
      <Popup>
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>
          {sequence?.[i] || `Stop ${i + 1}`}
        </span>
      </Popup>
    </CircleMarker>
  ));
}

// Traffic overlay edges
function TrafficOverlay({ trafficEdges }) {
  if (!trafficEdges || trafficEdges.length === 0) return null;

  return trafficEdges.map((edge, i) => {
    if (!edge.coords || edge.coords.length < 2) return null;
    return (
      <Polyline
        key={`traffic-${i}`}
        positions={edge.coords}
        pathOptions={{
          color: edge.color || COLORS.red,
          weight: 6,
          opacity: 0.7,
          dashArray: '10, 8',
        }}
      />
    );
  });
}

export default function DriverMapScreen({ route: navRoute }) {
  const driverId = navRoute?.params?.driverId;
  const { driver, loading } = useDriverData(driverId);
  const { on, connected } = useSocket();
  const [trafficEdges, setTrafficEdges] = useState([]);

  // Listen for traffic updates
  useEffect(() => {
    const unsub = on('traffic_update', (data) => {
      setTrafficEdges(prev => {
        const filtered = prev.filter(e => e.edge_id !== data.edge_id);
        if (data.level !== 'CLEAR') {
          filtered.push(data);
        }
        return filtered;
      });
    });
    return unsub;
  }, [on]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.fallbackText}>Map available on web only</Text>
      </View>
    );
  }

  const roadPath = driver?.road_path?.length > 1 ? driver.road_path : driver?.route;
  const hasRoute = roadPath && roadPath.length > 1;
  const driverPos = driver?.lat && driver?.lng ? [driver.lat, driver.lng] : null;

  return (
    <View style={styles.container}>
      {/* Status bar overlay */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View style={[styles.connDot, { backgroundColor: connected ? COLORS.green : COLORS.red }]} />
          <Text style={styles.statusText}>
            Driver #{driverId}
          </Text>
        </View>
        {driver && (
          <View style={styles.statusRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driver.status) }]}>
              <Text style={styles.statusBadgeText}>{driver.status?.toUpperCase() || 'IDLE'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Map */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <MapContainer
          center={driverPos || TRICHY_CENTER}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
            maxZoom={19}
          />

          {/* Route polyline */}
          {hasRoute && (
            <Polyline
              positions={roadPath}
              pathOptions={{
                color: COLORS.blue,
                weight: 5,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {/* Warehouse marker */}
          {driver?.warehouse && (
            <CircleMarker
              center={driver.warehouse}
              radius={12}
              pathOptions={{
                color: COLORS.orange,
                fillColor: COLORS.orange,
                fillOpacity: 0.9,
                weight: 3,
              }}
            >
              <Popup>🏭 Warehouse</Popup>
            </CircleMarker>
          )}

          {/* Stop markers */}
          <StopMarkers route={driver?.route} sequence={driver?.sequence} />

          {/* Traffic overlay */}
          <TrafficOverlay trafficEdges={trafficEdges} />

          {/* GPS dot */}
          {driverPos && <AnimatedGPSDot lat={driver.lat} lng={driver.lng} />}
        </MapContainer>
      </div>

      {/* Progress overlay */}
      {driver && driver.status === 'on_route' && (
        <View style={styles.progressOverlay}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(driver.progress || 0) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round((driver.progress || 0) * 100)}% → Stop {(driver.current_stop || 0) + 1}/{driver.total_stops || '?'}
          </Text>
        </View>
      )}
    </View>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'on_route': return COLORS.accent;
    case 'delayed': return COLORS.orange;
    case 'completed': return COLORS.green;
    case 'rerouting': return COLORS.blue;
    default: return COLORS.textMuted;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    position: 'relative',
  },
  fallbackText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  statusBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 39, 0.88)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backdropFilter: 'blur(12px)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.bg,
    letterSpacing: 0.5,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 1000,
    backgroundColor: 'rgba(10, 14, 39, 0.88)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(78, 140, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
