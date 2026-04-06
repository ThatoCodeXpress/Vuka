import React, { useEffect, useState } from 'react';
import {
  Alert, Linking, ScrollView, StyleSheet, Switch, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useColors } from '@/hooks/useColors';
import { getTMModelUrl, isValidTMUrl, setTMModelUrl } from '@/lib/tmModelStore';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [globalStrict, setGlobalStrict] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [tmUrl, setTmUrl] = useState('');
  const [tmUrlInput, setTmUrlInput] = useState('');
  const [tmSaved, setTmSaved] = useState(false);

  useEffect(() => {
    getTMModelUrl().then(url => { setTmUrl(url); setTmUrlInput(url); });
  }, []);

  const saveModelUrl = async () => {
    const url = tmUrlInput.trim();
    if (url && !isValidTMUrl(url)) {
      Alert.alert('Invalid URL', 'Must be a Teachable Machine URL ending with /');
      return;
    }
    await setTMModelUrl(url);
    setTmUrl(url);
    setTmSaved(true);
    setTimeout(() => setTmSaved(false), 2000);
  };

  const modelConfigured = isValidTMUrl(tmUrl);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ALARM BEHAVIOUR</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Global Strict Mode</Text>
              <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>Require both stages for all alarms</Text>
            </View>
            <Switch value={globalStrict} onValueChange={setGlobalStrict}
              trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
          </View>
          <View style={[styles.switchRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Haptic Feedback</Text>
              <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>Vibrate on interactions</Text>
            </View>
            <Switch value={haptics} onValueChange={setHaptics}
              trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AI — GOOGLE TEACHABLE MACHINE</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statusRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Icon name="cpu" size={18} color={colors.primary} />
            <View style={styles.statusInfo}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Google Teachable Machine</Text>
              <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>
                Custom image classification model
              </Text>
              <View style={[styles.badge, { backgroundColor: modelConfigured ? '#22c55e22' : '#f59e0b22' }]}>
                <View style={[styles.dot, { backgroundColor: modelConfigured ? '#22c55e' : '#f59e0b' }]} />
                <Text style={[styles.badgeText, { color: modelConfigured ? '#22c55e' : '#f59e0b' }]}>
                  {modelConfigured ? 'Model configured' : 'No model — using fallback'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.tmSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 0 }]}>
              TEACHABLE MACHINE MODEL URL
            </Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              1. Go to teachablemachine.withgoogle.com{'\n'}
              2. Train an image model{'\n'}
              3. Export → Upload (Cloud) → Copy URL{'\n'}
              4. Paste below and save
            </Text>
            <View style={[styles.inputRow, { borderColor: modelConfigured ? colors.primary : colors.border }]}>
              <TextInput
                style={[styles.urlInput, { color: colors.foreground }]}
                value={tmUrlInput}
                onChangeText={setTmUrlInput}
                placeholder="https://teachablemachine.withgoogle.com/models/..."
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: tmSaved ? '#22c55e' : colors.primary }]}
                onPress={saveModelUrl}
              >
                <Icon name={tmSaved ? 'check' : 'save'} size={14} color="#fff" />
                <Text style={styles.saveBtnText}>{tmSaved ? 'Saved!' : 'Save URL'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.linkBtn, { borderColor: colors.border }]}
                onPress={() => Linking.openURL('https://teachablemachine.withgoogle.com/')}
              >
                <Icon name="external-link" size={14} color={colors.primary} />
                <Text style={[styles.linkBtnText, { color: colors.primary }]}>Open TM</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Icon name="percent" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              75% confidence required to pass
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ABOUT</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.aboutTitle, { color: colors.foreground }]}>
            Vuka — Smart Dual-Verification Alarm
          </Text>
          <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
          <Text style={[styles.aboutDesc, { color: colors.mutedForeground }]}>
            Forces physical wakefulness through two AI-verified photo stages.
            Built with React Native CLI and TypeScript (TSX).
          </Text>
          <View style={styles.tags}>
            {['React Native CLI', 'TypeScript', 'TensorFlow.js', 'Teachable Machine', 'SQLite'].map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.team, { color: colors.mutedForeground }]}>
            Group 1 — Mainstream{'\n'}
            NDLOVU PS · NDARANE N · XAUKA T{'\n'}
            MASHEGO TE · NETSHIFHEFHE Z · TOMPANE R
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  scroll: { paddingHorizontal: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  section: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  switchRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  switchInfo: { flex: 1 },
  switchLabel: { fontSize: 15, fontWeight: '600' },
  switchDesc: { fontSize: 12, marginTop: 2 },
  statusRow: { flexDirection: 'row', padding: 14, gap: 12, alignItems: 'flex-start' },
  statusInfo: { flex: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  tmSection: { padding: 14 },
  hint: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  inputRow: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  urlInput: { fontSize: 12 },
  btnRow: { flexDirection: 'row', gap: 8 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  linkBtnText: { fontSize: 13, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  infoText: { fontSize: 13 },
  aboutTitle: { fontSize: 17, fontWeight: '700', padding: 16, paddingBottom: 4 },
  aboutVersion: { fontSize: 12, paddingHorizontal: 16 },
  aboutDesc: { fontSize: 13, paddingHorizontal: 16, paddingVertical: 10, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '600' },
  team: { fontSize: 12, padding: 16, lineHeight: 20, textAlign: 'center' },
});
