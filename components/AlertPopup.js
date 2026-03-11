import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { COLORS, ALERT_COLORS } from '../constants/api';
import { useSocket } from '../hooks/useSocket';

export default function AlertPopup({ driverId }) {
  const { on } = useSocket();
  const [alert, setAlert] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const showAlert = useCallback((data) => {
    if (data.driver_id !== driverId && data.driver_id !== 'all') return;

    setAlert(data);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.delay(6000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start(() => setAlert(null));
  }, [driverId, fadeAnim]);

  useEffect(() => {
    const unsub = on('xai_alert', showAlert);
    return unsub;
  }, [on, showAlert]);

  const dismiss = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => setAlert(null));
  };

  if (!alert) return null;

  const color = ALERT_COLORS[alert.type] || COLORS.red;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity style={[styles.card, { borderColor: color }]} onPress={dismiss} activeOpacity={0.9}>
        <View style={[styles.stripe, { backgroundColor: color }]} />
        <View style={styles.content}>
          <Text style={styles.icon}>
            {alert.type === 'traffic_reroute' ? '🔄' :
             alert.type === 'new_order' ? '📦' :
             alert.type === 'weather' ? '🌧️' : '⚠️'}
          </Text>
          <View style={styles.textArea}>
            <Text style={[styles.label, { color }]}>
              {alert.type === 'traffic_reroute' ? 'ROUTE CHANGED' :
               alert.type === 'traffic_alert' ? 'TRAFFIC ALERT' :
               alert.type?.toUpperCase().replace(/_/g, ' ')}
            </Text>
            <Text style={styles.message} numberOfLines={3}>{alert.message}</Text>
          </View>
          <Text style={styles.tapHint}>TAP</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  stripe: {
    width: 5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  icon: {
    fontSize: 28,
  },
  textArea: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  message: {
    fontSize: 13,
    color: COLORS.white,
    lineHeight: 19,
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
