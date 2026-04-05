import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getTMModelUrl, isValidTMUrl, setTMModelUrl } from "@/lib/tmModelStore";

interface SettingRowProps {
  icon: string;
  label: string;
  description?: string;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  colors: ReturnType<typeof useColors>;
  last?: boolean;
}

function SettingRow({ icon, label, description, value, onToggle, onPress, colors, last }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress && onToggle === undefined}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.primary + "22" }]}>
        <Feather name={icon as "settings"} size={18} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: colors.foreground }]}>{label}</Text>
        {description && <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>{description}</Text>}
      </View>
      {onToggle !== undefined && value !== undefined && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.primaryForeground}
        />
      )}
      {onPress && <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [globalStrict, setGlobalStrict] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [tmUrl, setTmUrl] = useState("");
  const [tmSaved, setTmSaved] = useState(false);
  const [tmUrlInput, setTmUrlInput] = useState("");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    getTMModelUrl().then((url) => {
      setTmUrl(url);
      setTmUrlInput(url);
    });
  }, []);

  async function handleSaveModelUrl() {
    const url = tmUrlInput.trim();
    if (url && !isValidTMUrl(url)) {
      Alert.alert(
        "Invalid URL",
        "The URL must be a Teachable Machine model URL, e.g.:\nhttps://teachablemachine.withgoogle.com/models/ABC123/"
      );
      return;
    }
    await setTMModelUrl(url);
    setTmUrl(url);
    setTmSaved(true);
    setTimeout(() => setTmSaved(false), 2000);
  }

  const modelConfigured = isValidTMUrl(tmUrl);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ALARM BEHAVIOUR</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="shield"
            label="Global Strict Mode"
            description="Disable snooze for all alarms — requires full dual verification"
            value={globalStrict}
            onToggle={setGlobalStrict}
            colors={colors}
          />
          <SettingRow
            icon="activity"
            label="Haptic Feedback"
            description="Vibrate on interactions and verifications"
            value={haptics}
            onToggle={setHaptics}
            colors={colors}
          />
          <SettingRow
            icon="bell"
            label="Notifications"
            description="5-min warning, alarm alerts, missed alarm escalation"
            value={notifications}
            onToggle={setNotifications}
            colors={colors}
            last
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AI MODEL — GOOGLE TEACHABLE MACHINE</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.tmInfoRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + "22" }]}>
              <Feather name="cpu" size={18} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Google Teachable Machine</Text>
              <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                Custom image classification model trained at teachablemachine.withgoogle.com
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: modelConfigured ? "#22c55e22" : "#f59e0b22" }]}>
                <View style={[styles.statusDot, { backgroundColor: modelConfigured ? "#22c55e" : "#f59e0b" }]} />
                <Text style={[styles.statusText, { color: modelConfigured ? "#22c55e" : "#f59e0b" }]}>
                  {modelConfigured ? "Model configured" : "No model — using simulation"}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.tmUrlSection, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={[styles.tmUrlLabel, { color: colors.mutedForeground }]}>TEACHABLE MACHINE MODEL URL</Text>
            <Text style={[styles.tmUrlHint, { color: colors.mutedForeground }]}>
              1. Go to teachablemachine.withgoogle.com{"\n"}
              2. Train your image model (add classes for objects/activities){"\n"}
              3. Export → Upload (Cloud) → Copy the model URL{"\n"}
              4. Paste it below
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
            <View style={styles.urlButtonRow}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: tmSaved ? "#22c55e" : colors.primary }]}
                onPress={handleSaveModelUrl}
              >
                <Feather name={tmSaved ? "check" : "save"} size={14} color="#fff" />
                <Text style={styles.saveBtnText}>{tmSaved ? "Saved!" : "Save URL"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.linkBtn, { borderColor: colors.border }]}
                onPress={() => Linking.openURL("https://teachablemachine.withgoogle.com/")}
              >
                <Feather name="external-link" size={14} color={colors.primary} />
                <Text style={[styles.linkBtnText, { color: colors.primary }]}>Open Teachable Machine</Text>
              </TouchableOpacity>
            </View>
          </View>

          <SettingRow
            icon="percent"
            label="Confidence Threshold"
            description="75% confidence required to pass verification"
            colors={colors}
          />
          <SettingRow
            icon="wifi-off"
            label="Offline Operation"
            description="Runs fully on-device — no data leaves your phone"
            colors={colors}
            last
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DATA & STORAGE</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="database"
            label="Storage Engine"
            description="SQLite — all alarm events and sleep scores stored locally on-device"
            colors={colors}
          />
          <SettingRow
            icon="clock"
            label="Secondary Alarm Interval"
            description="Default: 30 minutes after Stage 1 completion"
            colors={colors}
            last
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ABOUT</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aboutCard}>
            <Text style={[styles.aboutTitle, { color: colors.foreground }]}>
              Vuka — Smart Dual-Verification Alarm
            </Text>
            <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>
              Version 1.0.0
            </Text>
            <Text style={[styles.aboutDesc, { color: colors.mutedForeground }]}>
              Forces physical wakefulness through two AI-verified photo stages.
              Uses Google Teachable Machine for custom on-device image classification,
              with SQLite for offline-first data storage.
            </Text>
            <View style={styles.techTags}>
              {["React Native", "TensorFlow.js", "Teachable Machine", "SQLite", "Expo"].map((tag) => (
                <View key={tag} style={[styles.techTag, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.techTagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.aboutTeam, { color: colors.mutedForeground }]}>
              Group 1 — Mainstream{"\n"}
              NDLOVU PS · NDARANE N · XAUKA T{"\n"}
              MASHEGO TE · NETSHIFHEFHE Z · TOMPANE R
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 20,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  settingDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },
  tmInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tmUrlSection: { padding: 14 },
  tmUrlLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 8 },
  tmUrlHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 12 },
  inputRow: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  urlInput: { fontSize: 12, fontFamily: "Inter_400Regular" },
  urlButtonRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  aboutCard: { padding: 16 },
  aboutTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  aboutVersion: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  aboutDesc: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 10, lineHeight: 20 },
  techTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  techTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  techTagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  aboutTeam: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 14, lineHeight: 20, textAlign: "center" },
});
