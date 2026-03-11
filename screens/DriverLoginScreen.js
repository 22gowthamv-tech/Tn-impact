import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, DRIVER_IDS } from '../constants/api';

const { width } = Dimensions.get('window');

export default function DriverLoginScreen({ navigation }) {
  const [selectedId, setSelectedId] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!selectedId) return;
    setLoggingIn(true);
    await AsyncStorage.setItem('driver_id', selectedId);
    setTimeout(() => {
      setLoggingIn(false);
      navigation.replace('Main', { driverId: selectedId });
    }, 600);
  };

  return (
    <View style={styles.container}>
      {/* Background glow effects */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.content}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🚛</Text>
          </View>
          <Text style={styles.title}>LogiRoute AI</Text>
          <Text style={styles.subtitle}>Smart Fleet Driver App</Text>
        </View>

        {/* Driver selector label */}
        <Text style={styles.selectorLabel}>Select Your Driver ID</Text>

        {/* Driver ID grid */}
        <View style={styles.grid}>
          {DRIVER_IDS.map((id) => (
            <TouchableOpacity
              key={id}
              style={[
                styles.driverCard,
                selectedId === id && styles.driverCardSelected,
              ]}
              onPress={() => setSelectedId(id)}
              activeOpacity={0.7}
            >
              <Text style={styles.driverHash}>#</Text>
              <Text style={[
                styles.driverId,
                selectedId === id && styles.driverIdSelected,
              ]}>
                {id}
              </Text>
              {selectedId === id && <View style={styles.checkDot}><Text style={styles.checkMark}>✓</Text></View>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.loginBtn, !selectedId && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={!selectedId || loggingIn}
          activeOpacity={0.8}
        >
          <View style={styles.loginBtnInner}>
            <Text style={styles.loginBtnText}>
              {loggingIn ? '⏳ Authenticating...' : '🚀 START DRIVING'}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.footer}>Trichy Fleet Management • v1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: '20%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.accentGlow,
    opacity: 0.4,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -80,
    right: '10%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: COLORS.blueGlow,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  selectorLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  driverCard: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  driverCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  driverHash: {
    fontSize: 11,
    color: COLORS.textMuted,
    position: 'absolute',
    top: 8,
    left: 10,
  },
  driverId: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  driverIdSelected: {
    color: COLORS.accent,
  },
  checkDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: '700',
  },
  loginBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  loginBtnDisabled: {
    opacity: 0.4,
  },
  loginBtnInner: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.bg,
    letterSpacing: 1,
  },
  footer: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});
