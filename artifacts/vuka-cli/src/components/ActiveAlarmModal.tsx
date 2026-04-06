import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Modal, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useColors } from '@/hooks/useColors';
import { useAlarm } from '@/context/AlarmContext';
import { startAlarmSound, stopAlarmSound } from '@/lib/alarmSound';
import { VerificationCamera } from './VerificationCamera';

export function ActiveAlarmModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { alarmStage, currentAlarm, currentObject, currentActivity, dismissAlarm, verificationResult } = useAlarm();
  const [showCamera, setShowCamera] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const soundStarted = useRef(false);

  const isActive = alarmStage === 'stage1' || alarmStage === 'stage2' || alarmStage === 'complete';

  useEffect(() => {
    if (alarmStage === 'stage1') soundStarted.current = false;

    if ((alarmStage === 'stage1' || alarmStage === 'stage2') && !soundStarted.current) {
      soundStarted.current = true;
      startAlarmSound();
      ReactNativeHapticFeedback.trigger('notificationWarning');
    }
    if (alarmStage === 'complete' || alarmStage === 'idle') {
      stopAlarmSound();
      soundStarted.current = false;
    }
    if (alarmStage === 'stage1' || alarmStage === 'stage2') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
    if (alarmStage === 'stage2') setShowCamera(false);
  }, [alarmStage]);

  useEffect(() => {
    if (verificationResult?.passed) setShowCamera(false);
  }, [verificationResult]);

  if (!isActive) return null;

  const targetLabel = alarmStage === 'stage1'
    ? (currentObject?.label ?? 'Object')
    : (currentActivity?.label ?? 'Activity');

  return (
    <Modal visible={isActive} animationType="slide" presentationStyle="fullScreen">
      {showCamera ? (
        <VerificationCamera
          stage={alarmStage as 'stage1' | 'stage2'}
          targetLabel={targetLabel}
          onClose={() => setShowCamera(false)}
        />
      ) : (
        <LinearGradient
          colors={
            alarmStage === 'complete'
              ? ['#052e16', '#0a0f1e']
              : alarmStage === 'stage2'
              ? ['#1e3a5f', '#0a0f1e']
              : ['#450a0a', '#0a0f1e']
          }
          style={styles.gradient}
        >
          <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
            {alarmStage === 'complete' ? (
              <View style={styles.completedContainer}>
                <View style={[styles.successRing, { borderColor: colors.success }]}>
                  <Icon name="check" size={56} color={colors.success} />
                </View>
                <Text style={[styles.doneTitle, { color: colors.foreground }]}>You&apos;re Awake!</Text>
                <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
                  Both stages complete. Sleep score recorded.
                </Text>
                <TouchableOpacity
                  style={[styles.doneBtn, { backgroundColor: colors.success }]}
                  onPress={dismissAlarm}
                >
                  <Text style={styles.doneBtnText}>Start Your Day</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.topSection}>
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <View style={[styles.iconRing, { borderColor: alarmStage === 'stage1' ? colors.alarmActive : colors.primary }]}>
                      <Icon
                        name={alarmStage === 'stage1' ? 'bell' : 'activity'}
                        size={48}
                        color={alarmStage === 'stage1' ? colors.alarmActive : colors.primary}
                      />
                    </View>
                  </Animated.View>
                  <Text style={[styles.stageLabel, { color: alarmStage === 'stage1' ? colors.alarmActive : colors.primary }]}>
                    {alarmStage === 'stage1' ? 'STAGE 1 — WAKE UP' : 'STAGE 2 — MORNING ROUTINE'}
                  </Text>
                  <Text style={[styles.alarmName, { color: colors.foreground }]}>
                    {currentAlarm?.label || 'Alarm'}
                  </Text>
                  <Text style={[styles.time, { color: colors.foreground }]}>{currentAlarm?.time}</Text>
                </View>

                <View style={[styles.instructionCard, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                  <Icon name="target" size={20} color={colors.primary} />
                  <View style={styles.instructionText}>
                    <Text style={[styles.instructionTitle, { color: colors.foreground }]}>
                      {alarmStage === 'stage1' ? 'Find and photograph:' : 'Photograph your activity:'}
                    </Text>
                    <Text style={[styles.instructionTarget, { color: colors.primary }]}>{targetLabel}</Text>
                    <Text style={[styles.instructionSub, { color: colors.mutedForeground }]}>
                      {alarmStage === 'stage1'
                        ? 'AI must be 75%+ confident to dismiss'
                        : 'Show your morning activity to the camera'}
                    </Text>
                  </View>
                </View>

                {verificationResult && !verificationResult.passed && (
                  <View style={[styles.failBanner, { backgroundColor: colors.destructive + '33' }]}>
                    <Icon name="x-circle" size={18} color={colors.destructive} />
                    <Text style={[styles.failText, { color: colors.destructive }]}>
                      Verification failed ({Math.round(verificationResult.confidence * 100)}% confidence). Try again.
                    </Text>
                  </View>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.cameraBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      ReactNativeHapticFeedback.trigger('impactHeavy');
                      stopAlarmSound();
                      setShowCamera(true);
                    }}
                  >
                    <Icon name="camera" size={24} color="#fff" />
                    <Text style={styles.cameraBtnText}>Open Camera</Text>
                  </TouchableOpacity>

                  {!currentAlarm?.strictMode && (
                    <TouchableOpacity
                      style={[styles.snoozeBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        ReactNativeHapticFeedback.trigger('impactMedium');
                        stopAlarmSound();
                        dismissAlarm();
                      }}
                    >
                      <Icon name="moon" size={18} color={colors.mutedForeground} />
                      <Text style={[styles.snoozeBtnText, { color: colors.mutedForeground }]}>
                        Dismiss (No Score)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </LinearGradient>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
  topSection: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  iconRing: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  stageLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  alarmName: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  time: { fontSize: 48, fontWeight: '700', marginTop: 4 },
  instructionCard: {
    flexDirection: 'row', gap: 14, padding: 18, borderRadius: 16, marginBottom: 16,
  },
  instructionText: { flex: 1 },
  instructionTitle: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  instructionTarget: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  instructionSub: { fontSize: 12 },
  failBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, marginBottom: 16,
  },
  failText: { flex: 1, fontSize: 13, fontWeight: '500' },
  actions: { gap: 12 },
  cameraBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 18, borderRadius: 16,
  },
  cameraBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  snoozeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  snoozeBtnText: { fontSize: 14, fontWeight: '500' },
  completedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successRing: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  doneTitle: { fontSize: 36, fontWeight: '700', marginBottom: 12 },
  doneSub: { fontSize: 15, textAlign: 'center', paddingHorizontal: 32, marginBottom: 40 },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 18, borderRadius: 16 },
  doneBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
