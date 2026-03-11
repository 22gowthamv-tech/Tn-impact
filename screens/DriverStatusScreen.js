import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, STATUS_COLORS } from '../constants/api';
import { useDriverData } from '../hooks/useDriverData';

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || COLORS.textMuted;
  const labels = {
    idle: 'IDLE',
    on_route: 'ON ROUTE',
    delayed: 'DELAYED',
    completed: 'COMPLETED',
    rerouting: 'REROUTING',
  };
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{labels[status] || 'UNKNOWN'}</Text>
    </View>
  );
}

function StopStepper({ stops, currentStop, etas, sequence }) {
  if (!stops || stops.length === 0) return null;

  return (
    <View style={styles.stepper}>
      {stops.map((stop, i) => {
        const isCompleted = i < currentStop;
        const isCurrent = i === currentStop;
        const isUpcoming = i > currentStop;

        return (
          <View key={i} style={styles.stepRow}>
            {/* Left: dot + line */}
            <View style={styles.stepLeft}>
              <View style={[
                styles.stepDot,
                isCompleted && styles.stepDotCompleted,
                isCurrent && styles.stepDotCurrent,
                isUpcoming && styles.stepDotUpcoming,
              ]}>
                {isCompleted ? (
                  <Text style={styles.stepCheck}>✓</Text>
                ) : (
                  <Text style={[
                    styles.stepNum,
                    isCurrent && { color: COLORS.bg },
                  ]}>{i + 1}</Text>
                )}
              </View>
              {i < stops.length - 1 && (
                <View style={[
                  styles.stepLine,
                  isCompleted && styles.stepLineCompleted,
                ]} />
              )}
            </View>

            {/* Right: info */}
            <View style={[styles.stepInfo, isCurrent && styles.stepInfoCurrent]}>
              <View style={styles.stepInfoTop}>
                <Text style={[
                  styles.stepName,
                  isCompleted && styles.stepNameCompleted,
                  isCurrent && styles.stepNameCurrent,
                ]}>{stop}</Text>
                {sequence?.[i] && (
                  <Text style={styles.stepTag}>{sequence[i]}</Text>
                )}
              </View>
              <View style={styles.stepInfoBottom}>
                <Text style={styles.stepEta}>
                  {isCompleted ? '✅ Delivered' : `ETA: ${etas?.[i] || '—'}`}
                </Text>
                {isCurrent && (
                  <View style={styles.currentTag}>
                    <Text style={styles.currentTagText}>NOW</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function DriverStatusScreen({ route: navRoute }) {
  const driverId = navRoute?.params?.driverId;
  const { driver, loading, error } = useDriverData(driverId);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCenter}>
          <Text style={styles.loadingEmoji}>📊</Text>
          <Text style={styles.loadingText}>Loading status...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCenter}>
          <Text style={styles.loadingEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  const currentStop = driver?.current_stop || 0;
  const totalStops = driver?.total_stops || driver?.stops?.length || 0;
  const completedStops = Math.min(currentStop, totalStops);
  const remaining = Math.max(totalStops - completedStops, 0);
  const progressPercent = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Delivery Status</Text>
          <StatusBadge status={driver?.status} />
        </View>

        {/* Main progress card */}
        <View style={styles.progressCard}>
          <View style={styles.progressCircleArea}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
              <Text style={styles.progressLabel}>Complete</Text>
            </View>
          </View>

          <View style={styles.progressStats}>
            <View style={styles.pStatRow}>
              <Text style={styles.pStatIcon}>✅</Text>
              <Text style={styles.pStatValue}>{completedStops}</Text>
              <Text style={styles.pStatLabel}>Delivered</Text>
            </View>
            <View style={styles.pStatDivider} />
            <View style={styles.pStatRow}>
              <Text style={styles.pStatIcon}>📍</Text>
              <Text style={styles.pStatValue}>{remaining}</Text>
              <Text style={styles.pStatLabel}>Remaining</Text>
            </View>
            <View style={styles.pStatDivider} />
            <View style={styles.pStatRow}>
              <Text style={styles.pStatIcon}>📏</Text>
              <Text style={styles.pStatValue}>{driver?.total_distance?.toFixed(1) || '—'}</Text>
              <Text style={styles.pStatLabel}>km total</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarOuter}>
            <View style={[styles.progressBarInner, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressSummary}>
            Stop {completedStops}/{totalStops} {completedStops > 0 ? '✅' : ''} | {remaining} remaining
          </Text>
        </View>

        {/* Route overview pills */}
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillIcon}>🏭</Text>
            <Text style={styles.pillText}>Warehouse</Text>
          </View>
          <Text style={styles.pillArrow}>→</Text>
          {driver?.sequence?.map((s, i) => (
            <React.Fragment key={i}>
              <View style={[
                styles.pill,
                i < currentStop && styles.pillDone,
                i === currentStop && styles.pillCurrent,
              ]}>
                <Text style={styles.pillText}>{s}</Text>
              </View>
              {i < (driver.sequence.length - 1) && <Text style={styles.pillArrow}>→</Text>}
            </React.Fragment>
          ))}
        </View>

        {/* Stop stepper */}
        <View style={styles.stepperCard}>
          <Text style={styles.stepperTitle}>Delivery Stops</Text>
          <StopStepper
            stops={driver?.stops || []}
            currentStop={currentStop}
            etas={driver?.etas}
            sequence={driver?.sequence}
          />
        </View>

        {/* Driver info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Driver Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Driver ID</Text>
            <Text style={styles.infoValue}>#{driverId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>
              {driver?.lat?.toFixed(4)}, {driver?.lng?.toFixed(4)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Route Segment</Text>
            <Text style={styles.infoValue}>
              {driver?.progress ? `${Math.round(driver.progress * 100)}% of segment` : '—'}
            </Text>
          </View>
        </View>
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
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.red,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  progressCircleArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.accent,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: -2,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  pStatRow: {
    alignItems: 'center',
  },
  pStatIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  pStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  pStatLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  pStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  progressBarOuter: {
    height: 6,
    backgroundColor: 'rgba(78, 140, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  progressSummary: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  pill: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillDone: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  pillCurrent: {
    borderColor: COLORS.blue,
    backgroundColor: 'rgba(78, 140, 255, 0.15)',
  },
  pillIcon: {
    fontSize: 12,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  pillArrow: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  stepperCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  stepperTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  stepper: {},
  stepRow: {
    flexDirection: 'row',
  },
  stepLeft: {
    alignItems: 'center',
    width: 36,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
  },
  stepDotCompleted: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  stepDotCurrent: {
    borderColor: COLORS.blue,
    backgroundColor: COLORS.blue,
  },
  stepDotUpcoming: {
    borderColor: COLORS.textMuted,
    backgroundColor: 'transparent',
  },
  stepCheck: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.bg,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  stepLine: {
    width: 2,
    height: 36,
    backgroundColor: COLORS.border,
  },
  stepLineCompleted: {
    backgroundColor: COLORS.accent,
  },
  stepInfo: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 20,
    borderBottomWidth: 0,
  },
  stepInfoCurrent: {
    backgroundColor: 'rgba(78, 140, 255, 0.06)',
    borderRadius: 10,
    padding: 10,
    marginLeft: 8,
    marginBottom: 8,
  },
  stepInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  stepNameCompleted: {
    color: COLORS.accent,
    textDecorationLine: 'line-through',
  },
  stepNameCurrent: {
    color: COLORS.white,
    fontWeight: '700',
  },
  stepTag: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.blue,
    backgroundColor: COLORS.blueGlow,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  stepInfoBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  stepEta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  currentTag: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
  },
  currentTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
