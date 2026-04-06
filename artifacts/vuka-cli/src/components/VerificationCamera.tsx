import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Feather';
import { useColors } from '@/hooks/useColors';
import { useAlarm } from '@/context/AlarmContext';

interface Props {
  stage: 'stage1' | 'stage2';
  targetLabel: string;
  onClose: () => void;
}

export function VerificationCamera({ stage, targetLabel, onClose }: Props) {
  const colors = useColors();
  const { verifyPhoto } = useAlarm();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState('');

  if (!hasPermission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Icon name="camera-off" size={48} color={colors.mutedForeground} />
        <Text style={[styles.permText, { color: colors.foreground }]}>Camera permission required</Text>
        <TouchableOpacity style={[styles.permBtn, { backgroundColor: colors.primary }]} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.permText, { color: colors.mutedForeground }]}>Loading camera…</Text>
      </View>
    );
  }

  const captureAndVerify = async () => {
    if (!camera.current || verifying) return;
    try {
      setVerifying(true);
      setStatus('Capturing photo…');
      const photo = await camera.current.takePhoto({ flash: 'off' });
      setStatus('Running AI verification…');
      await verifyPhoto(`file://${photo.path}`);
      setStatus('Done!');
      setTimeout(onClose, 600);
    } catch (e) {
      setStatus('Error capturing photo. Try again.');
      setVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="x" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.targetBadge}>
            <Text style={styles.targetBadgeText}>{stage === 'stage1' ? '📸 Photograph:' : '✅ Show activity:'} {targetLabel}</Text>
          </View>
        </View>

        <View style={styles.aimBox} />

        <View style={styles.bottomBar}>
          {status ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.statusText}>{status}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.captureBtn, verifying && styles.captureBtnDisabled]}
            onPress={captureAndVerify}
            disabled={verifying}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <Text style={styles.hint}>Tap the button to capture and verify</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  permText: { fontSize: 16, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },
  permBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: { padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center', gap: 12 },
  closeBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8 },
  targetBadge: { flex: 1, backgroundColor: 'rgba(99,102,241,0.85)', padding: 10, borderRadius: 10 },
  targetBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  aimBox: {
    width: 220, height: 220, alignSelf: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 16,
  },
  bottomBar: { padding: 24, alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.4)' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  captureBtnDisabled: { opacity: 0.5 },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#6366f1' },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center' },
});
