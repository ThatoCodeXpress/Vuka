import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAlarm } from "@/context/AlarmContext";

interface Props {
  stage: "stage1" | "stage2";
  targetLabel: string;
  onClose: () => void;
}

export function VerificationCamera({ stage, targetLabel, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { verifyPhoto, isVerifying, verificationResult, attempts } = useAlarm();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<"front" | "back">("back");

  const handleCapture = async () => {
    if (Platform.OS === "web") {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: false,
      });
      if (!result.canceled && result.assets[0]) {
        setCapturedUri(result.assets[0].uri);
      }
      return;
    }
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo) setCapturedUri(photo.uri);
  };

  const handleVerify = async () => {
    if (!capturedUri) return;
    await verifyPhoto(capturedUri);
    if (!verificationResult?.passed) {
      setCapturedUri(null);
    }
  };

  const handleRetry = () => {
    setCapturedUri(null);
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
        <Feather name="camera-off" size={48} color={colors.mutedForeground} />
        <Text style={[styles.permText, { color: colors.foreground }]}>Camera Access Required</Text>
        <Text style={[styles.permSubText, { color: colors.mutedForeground }]}>
          We need camera access to verify you're awake
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Feather name="x" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.stageBadge}>
          <Text style={[styles.stageText, { color: colors.primary }]}>
            {stage === "stage1" ? "Stage 1 — Object" : "Stage 2 — Activity"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.targetBanner, { backgroundColor: colors.primary + "22" }]}>
        <Feather name="target" size={18} color={colors.primary} />
        <Text style={[styles.targetText, { color: colors.primary }]}>
          Find and photograph: <Text style={{ fontFamily: "Inter_700Bold" }}>{targetLabel}</Text>
        </Text>
      </View>

      {attempts > 0 && (
        <View style={[styles.attemptsBanner, { backgroundColor: colors.warning + "22" }]}>
          <Text style={[styles.attemptsText, { color: colors.warning }]}>
            Attempts: {attempts} — {verificationResult && !verificationResult.passed
              ? `Confidence: ${Math.round(verificationResult.confidence * 100)}% (need 75%+)`
              : "Try again with the correct object"}
          </Text>
        </View>
      )}

      <View style={styles.cameraContainer}>
        {capturedUri ? (
          <Image source={{ uri: capturedUri }} style={styles.preview} resizeMode="cover" />
        ) : Platform.OS === "web" ? (
          <View style={[styles.webPlaceholder, { backgroundColor: colors.card }]}>
            <Feather name="camera" size={64} color={colors.mutedForeground} />
            <Text style={[styles.webText, { color: colors.mutedForeground }]}>
              Tap to open camera
            </Text>
          </View>
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          />
        )}
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        {capturedUri ? (
          <View style={styles.captureActions}>
            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: colors.border }]}
              onPress={handleRetry}
            >
              <Feather name="refresh-cw" size={22} color={colors.foreground} />
              <Text style={[styles.retryText, { color: colors.foreground }]}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.verifyBtn, { backgroundColor: colors.primary }]}
              onPress={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <>
                  <Feather name="check-circle" size={22} color={colors.primaryForeground} />
                  <Text style={[styles.verifyText, { color: colors.primaryForeground }]}>
                    Verify Photo
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.captureRow}>
            {Platform.OS !== "web" && (
              <TouchableOpacity
                style={[styles.flipBtn, { backgroundColor: colors.card }]}
                onPress={() => setFacing(facing === "back" ? "front" : "back")}
              >
                <Feather name="refresh-cw" size={20} color={colors.foreground} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.shutterBtn, { borderColor: colors.primary }]}
              onPress={handleCapture}
            >
              <View style={[styles.shutterInner, { backgroundColor: colors.primary }]} />
            </TouchableOpacity>
            {Platform.OS !== "web" && <View style={{ width: 48 }} />}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  closeBtn: { padding: 8 },
  stageBadge: { alignItems: "center" },
  stageText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  targetBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  targetText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  attemptsBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  attemptsText: { fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },
  cameraContainer: { flex: 1, marginHorizontal: 16, borderRadius: 20, overflow: "hidden" },
  camera: { flex: 1 },
  preview: { flex: 1 },
  webPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  webText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  controls: { paddingHorizontal: 20, paddingTop: 20 },
  captureActions: { flexDirection: "row", gap: 12 },
  retryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
  },
  retryText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  verifyBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  verifyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  captureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  flipBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30 },
  permText: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 16 },
  permSubText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32, marginTop: 8 },
  btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 24 },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
