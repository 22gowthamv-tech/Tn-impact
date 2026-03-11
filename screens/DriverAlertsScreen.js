import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { COLORS, ALERT_COLORS } from '../constants/api';
import { useSocket } from '../hooks/useSocket';

function getAlertIcon(type) {
  switch (type) {
    case 'traffic_reroute': return '🔄';
    case 'traffic_alert': return '⚠️';
    case 'route_optimized': return '✅';
    case 'new_order': return '📦';
    case 'weather': return '🌧️';
    default: return '📢';
  }
}

function getAlertLabel(type) {
  switch (type) {
    case 'traffic_reroute': return 'ROUTE CHANGED';
    case 'traffic_alert': return 'TRAFFIC ALERT';
    case 'route_optimized': return 'ROUTE OPTIMIZED';
    case 'new_order': return 'NEW ORDER';
    case 'weather': return 'WEATHER';
    default: return 'ALERT';
  }
}

export default function DriverAlertsScreen({ route: navRoute }) {
  const driverId = navRoute?.params?.driverId;
  const { on } = useSocket();
  const [alerts, setAlerts] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsub = on('xai_alert', (data) => {
      if (data.driver_id === driverId || data.driver_id === 'all') {
        const alert = {
          id: Date.now() + Math.random(),
          ...data,
          timestamp: new Date().toLocaleTimeString(),
        };
        setAlerts(prev => [alert, ...prev].slice(0, 50));

        // Play audio if available on web
        if (Platform.OS === 'web' && data.audio_base64) {
          try {
            const audio = new Audio('data:audio/mp3;base64,' + data.audio_base64);
            audio.play().catch(() => {});
          } catch (e) {}
        }
      }
    });
    return unsub;
  }, [driverId, on]);

  const clearAlerts = () => setAlerts([]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>🔔</Text>
          <View>
            <Text style={styles.headerTitle}>X-AI Alerts</Text>
            <Text style={styles.headerSub}>Driver #{driverId}</Text>
          </View>
        </View>
        {alerts.length > 0 && (
          <TouchableOpacity onPress={clearAlerts} activeOpacity={0.7}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Alert count badge */}
      {alerts.length > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* Alerts list */}
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔕</Text>
            <Text style={styles.emptyTitle}>No Alerts Yet</Text>
            <Text style={styles.emptyText}>
              X-AI alerts will appear here when{'\n'}traffic, weather, or route changes occur.
            </Text>
            <View style={styles.emptyPulse} />
          </View>
        ) : (
          alerts.map((alert) => {
            const color = ALERT_COLORS[alert.type] || COLORS.blue;
            return (
              <View key={alert.id} style={[styles.alertCard, { borderLeftColor: color }]}>
                <View style={styles.alertTop}>
                  <View style={[styles.alertTypeBadge, { backgroundColor: color + '22' }]}>
                    <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
                    <Text style={[styles.alertTypeText, { color }]}>{getAlertLabel(alert.type)}</Text>
                  </View>
                  <Text style={styles.alertTime}>{alert.timestamp}</Text>
                </View>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                {alert.message_translated && alert.message_translated !== alert.message && (
                  <View style={styles.translatedBox}>
                    <Text style={styles.translatedLabel}>
                      🌐 {alert.language_name || alert.language}
                    </Text>
                    <Text style={styles.translatedText}>{alert.message_translated}</Text>
                  </View>
                )}
                {alert.audio_base64 && (
                  <View style={styles.audioBadge}>
                    <Text style={styles.audioText}>🔊 Voice alert played</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  clearText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  countBadge: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 71, 87, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.red,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 4,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyPulse: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginTop: 24,
  },
  alertCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
  },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  alertIcon: {
    fontSize: 14,
  },
  alertTypeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  alertMessage: {
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 21,
    fontWeight: '500',
  },
  translatedBox: {
    marginTop: 10,
    backgroundColor: 'rgba(78, 140, 255, 0.08)',
    borderRadius: 10,
    padding: 10,
  },
  translatedLabel: {
    fontSize: 11,
    color: COLORS.blue,
    fontWeight: '600',
    marginBottom: 4,
  },
  translatedText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  audioBadge: {
    marginTop: 8,
  },
  audioText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
});
