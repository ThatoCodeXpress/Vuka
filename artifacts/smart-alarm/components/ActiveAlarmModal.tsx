import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAlarm } from "@/context/AlarmContext";
import { VerificationCamera } from "./VerificationCamera";

export function ActiveAlarmModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { alarmStage, currentAlarm, currentObject, currentActivity, dismissAlarm, verificationResult, alarms, triggerAlarm } = useAlarm();
  const [showCamera, setShowCamera] = useState(false);
  const pulseAnim = new Animated.Value(1);

  const isActive = alarmStage === "stage1" || alarmStage === "stage2" || alarmStage === "complete";

  useEffect(() => {
    if (alarmStage === "stage1" || alarmStage === "stage2") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
    if (alarmStage === "stage2") {
      setShowCamera(false);
    }
  }, [alarmStage]);

  useEffect(() => {
    if (verificationResult?.passed && (alarmStage === "stage2" || alarmStage === "stage1")) {
      setShowCamera(false);
    }
  }, [verificationResult, alarmStage]);

  if (!isActive) return null;

  const targetLabel =
    alarmStage === "stage1"
      ? currentObject?.label ?? "Object"
      : currentActivity?.label ?? "Activity";

  return (
    <Modal visible={isActive} animationType="slide" presentationStyle="fullScreen">
      {showCamera ? (
        <VerificationCamera
          stage={alarmStage as "stage1" | "stage2"}
          targetLabel={targetLabel}
          onClose={() => setShowCamera(false)}
        />
      ) : (
        <LinearGradient
          colors={
            alarmStage === "complete"
              ? ["#052e16", "#0a0f1e"]
              : alarmStage === "stage2"
              ? ["#1e3a5f", "#0a0f1e"]
              : ["#450a0a", "#0a0f1e"]
          }
          style={styles.gradient}
        >
          <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
            {alarmStage === "complete" ? (
              <CompletedView onDismiss={dismissAlarm} colors={colors} />
            ) : (
              <>
                <View style={styles.topSection}>
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <View style={[styles.iconRing, { borderColor: alarmStage === "stage1" ? colors.alarmActive : colors.alarmIdle }]}>
                      <Feather
                        name={alarmStage === "stage1" ? "bell" : "activity"}
                        size={48}
                        color={alarmStage === "stage1" ? colors.alarmActive : colors.alarmIdle}
                      />
                    </View>
                  </Animated.View>
                  <View style={styles.stageInfo}>
                    <Text style={[styles.stageLabel, { color: alarmStage === "stage1" ? colors.alarmActive : colors.alarmIdle }]}>
                      {alarmStage === "stage1" ? "STAGE 1" : "STAGE 2"}
                    </Text>
                    <Text style={[styles.alarmName, { color: colors.foreground }]}>
                      {currentAlarm?.label || "Alarm"}
                    </Text>
                    <Text style={[styles.time, { color: colors.foreground }]}>
                      {currentAlarm?.time}
                    </Text>
                  </View>
                </View>

                <View style={[styles.instructionCard, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
                  <Feather name="target" size={20} color={colors.primary} />
                  <View style={styles.instructionText}>
                    <Text style={[styles.instructionTitle, { color: colors.foreground }]}>
                      {alarmStage === "stage1" ? "Find and photograph:" : "Photograph your activity:"}
                    </Text>
                    <Text style={[styles.instructionTarget, { color: colors.primary }]}>
                      {targetLabel}
                    </Text>
                    <Text style={[styles.instructionSub, { color: colors.mutedForeground }]}>
                      {alarmStage === "stage1"
                        ? "AI confidence must be 75%+ to dismiss"
                        : "30 minutes have passed — confirm your morning routine"}
                    </Text>
                  </View>
                </View>

                {verificationResult && !verificationResult.passed && (
                  <View style={[styles.failBanner, { backgroundColor: colors.destructive + "33" }]}>
                    <Feather name="x-circle" size={18} color={colors.destructive} />
                    <Text style={[styles.failText, { color: colors.destructive }]}>
                      Verification failed ({Math.round(verificationResult.confidence * 100)}% confidence). Try again.
                    </Text>
                  </View>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.cameraBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      setShowCamera(true);
                    }}
                  >
                    <Feather name="camera" size={24} color={colors.primaryForeground} />
                    <Text style={[styles.cameraBtnText, { color: colors.primaryForeground }]}>
                      Open Camera
                    </Text>
                  </TouchableOpacity>

                  {!currentAlarm?.strictMode && (
                    <TouchableOpacity
                      style={[styles.snoozeBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        dismissAlarm();
                      }}
                    >
                      <Feather name="moon" size={18} color={colors.mutedForeground} />
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

function CompletedView({ onDismiss, colors }: { onDismiss: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.completedContainer}>
      <View style={[styles.successRing, { borderColor: colors.success }]}>
        <Feather name="check" size={56} color={colors.success} />
      </View>
      <Text style={[styles.doneTitle, { color: colors.foreground }]}>You're Awake!</Text>
      <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
        Both stages complete. Your sleep score has been recorded.
      </Text>
      <TouchableOpacity
        style={[styles.doneBtn, { backgroundColor: colors.success }]}
        onPress={onDismiss}
      >
        <Text style={[styles.doneBtnText, { color: "#ffffff" }]}>Start Your Day</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
  topSection: { alignItems: "center", marginBottom: 32, marginTop: 20 },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stageInfo: { alignItems: "center" },
  stageLabel: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  alarmName: { fontSize: 28, fontFamily: "Inter_700Bold", marginTop: 4 },
  time: { fontSize: 48, fontFamily: "Inter_700Bold", marginTop: 4 },
  instructionCard: {
    flexDirection: "row",
    gap: 14,
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  instructionText: { flex: 1 },
  instructionTitle: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  instructionTarget: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  instructionSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  failBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  failText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  actions: { gap: 12 },
  cameraBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
    borderRadius: 16,
  },
  cameraBtnText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  snoozeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  snoozeBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  completedContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  successRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  doneTitle: { fontSize: 36, fontFamily: "Inter_700Bold", marginBottom: 12 },
  doneSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
    marginBottom: 40,
  },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 18, borderRadius: 16 },
  doneBtnText: { fontSize: 18, fontFamily: "Inter_700Bold" },
});
