import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { COLORS, BACKEND_URL } from '../constants/api';

const PLACEHOLDER_ADDRESSES = [
  'Woraiyur Market',
  'Srirangam Temple',
  'Gandhi Market',
  'Anna Nagar',
  'Thillai Nagar',
];

export default function RouteInputScreen({ route: navRoute }) {
  const driverId = navRoute?.params?.driverId;
  const [addresses, setAddresses] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const updateAddress = (index, value) => {
    const next = [...addresses];
    next[index] = value;
    setAddresses(next);
  };

  const validCount = addresses.filter(a => a.trim().length > 0).length;

  const handleOptimize = async () => {
    const filledAddresses = addresses.filter(a => a.trim().length > 0);
    if (filledAddresses.length < 2) {
      setError('Enter at least 2 delivery addresses');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await axios.post(`${BACKEND_URL}/driver/${driverId}/route`, {
        addresses: filledAddresses,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to optimize route. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setAddresses(['', '', '', '', '']);
    setResult(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>📍</Text>
          <Text style={styles.headerTitle}>Route Planner</Text>
          <Text style={styles.headerSub}>Driver #{driverId} • Enter delivery stops</Text>
        </View>

        {/* Address inputs */}
        <View style={styles.inputsCard}>
          {addresses.map((addr, i) => (
            <View key={i} style={styles.inputRow}>
              <View style={[styles.stopDot, addr.trim() && styles.stopDotFilled]}>
                <Text style={styles.stopNum}>{i + 1}</Text>
              </View>
              {i < addresses.length - 1 && <View style={styles.stopLine} />}
              <TextInput
                style={styles.input}
                placeholder={PLACEHOLDER_ADDRESSES[i]}
                placeholderTextColor={COLORS.textMuted}
                value={addr}
                onChangeText={(v) => updateAddress(i, v)}
                editable={!loading}
              />
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.optimizeBtn, (validCount < 2 || loading) && styles.btnDisabled]}
            onPress={handleOptimize}
            disabled={validCount < 2 || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={COLORS.bg} size="small" />
                <Text style={styles.optimizeBtnText}>  Optimizing Route...</Text>
              </View>
            ) : (
              <Text style={styles.optimizeBtnText}>🚀 OPTIMIZE ROUTE ({validCount} stops)</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Loading message */}
        {loading && (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingEmoji}>🗺️</Text>
            <Text style={styles.loadingTitle}>Geocoding & Solving TSP...</Text>
            <Text style={styles.loadingSubtext}>
              This takes 10-20 seconds{'\n'}(Nominatim geocodes 1 address/sec + OSRM routing)
            </Text>
            <View style={styles.shimmer} />
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultEmoji}>✅</Text>
              <Text style={styles.resultTitle}>Route Optimized!</Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{result.total_distance?.toFixed(1) || '—'}</Text>
                <Text style={styles.statLabel}>km total</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{result.stops?.length || '—'}</Text>
                <Text style={styles.statLabel}>stops</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{result.etas?.[result.etas.length - 1] || '—'}</Text>
                <Text style={styles.statLabel}>ETA final</Text>
              </View>
            </View>

            {/* Optimized sequence */}
            <View style={styles.sequenceSection}>
              <Text style={styles.sequenceLabel}>Optimized Sequence:</Text>
              {result.stops?.map((stop, i) => (
                <View key={i} style={styles.seqRow}>
                  <View style={styles.seqDot}>
                    <Text style={styles.seqDotText}>{i + 1}</Text>
                  </View>
                  <View style={styles.seqInfo}>
                    <Text style={styles.seqName}>{stop}</Text>
                    <Text style={styles.seqEta}>ETA: {result.etas?.[i] || '—'}</Text>
                  </View>
                  <Text style={styles.seqTag}>{result.sequence?.[i]}</Text>
                </View>
              ))}
            </View>

            {/* X-AI explanation */}
            {result.xai_explanation && (
              <View style={styles.xaiBox}>
                <Text style={styles.xaiLabel}>🧠 AI Explanation</Text>
                <Text style={styles.xaiText}>{result.xai_explanation}</Text>
              </View>
            )}
          </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  headerEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  inputsCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  stopDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(78, 140, 255, 0.15)',
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  stopDotFilled: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
  },
  stopNum: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  stopLine: {
    position: 'absolute',
    left: 13,
    top: 30,
    width: 2,
    height: 14,
    backgroundColor: 'rgba(78, 140, 255, 0.2)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(78, 140, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  optimizeBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  optimizeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.bg,
    letterSpacing: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  clearBtnText: {
    fontSize: 13,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  loadingCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  loadingEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
  },
  loadingSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  shimmer: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    borderRadius: 2,
    marginTop: 16,
  },
  errorCard: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
    marginBottom: 20,
  },
  errorEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.red,
    lineHeight: 19,
  },
  resultCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(78, 140, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sequenceSection: {
    marginBottom: 16,
  },
  sequenceLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  seqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  seqDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  seqDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.bg,
  },
  seqInfo: {
    flex: 1,
  },
  seqName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  seqEta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  seqTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.blue,
    backgroundColor: COLORS.blueGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  xaiBox: {
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.2)',
  },
  xaiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xaiText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
