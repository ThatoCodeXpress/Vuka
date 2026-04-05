import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface SettingRowProps {
  icon: string;
  label: string;
  description?: string;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  colors: ReturnType<typeof useColors>;
}

function SettingRow({ icon, label, description, value, onToggle, onPress, colors }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
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

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

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
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AI VERIFICATION</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="cpu"
            label="AI Model"
            description="MobileNet via TensorFlow.js — runs fully on-device"
            colors={colors}
          />
          <SettingRow
            icon="percent"
            label="Confidence Threshold"
            description="75% confidence required to pass verification"
            colors={colors}
          />
          <SettingRow
            icon="wifi-off"
            label="Offline Operation"
            description="All core features work without internet"
            colors={colors}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DATA & STORAGE</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="database"
            label="Storage Engine"
            description="SQLite — all alarm events and sleep scores stored locally"
            colors={colors}
          />
          <SettingRow
            icon="clock"
            label="Secondary Alarm Interval"
            description="Default: 30 minutes after Stage 1 completion"
            colors={colors}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ABOUT</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aboutCard}>
            <Text style={[styles.aboutTitle, { color: colors.foreground }]}>
              Smart Dual-Verification Alarm
            </Text>
            <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>
              Version 1.0.0
            </Text>
            <Text style={[styles.aboutDesc, { color: colors.mutedForeground }]}>
              Built with React Native, TensorFlow.js (MobileNet), and SQLite.
              Forces physical wakefulness through two AI-verified photo stages.
            </Text>
            <View style={styles.techTags}>
              {["React Native", "TensorFlow.js", "MobileNet", "SQLite", "Expo"].map((tag) => (
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
    borderBottomWidth: 1,
  },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  settingDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  aboutCard: { padding: 16 },
  aboutTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  aboutVersion: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  aboutDesc: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 10, lineHeight: 20 },
  techTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  techTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  techTagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  aboutTeam: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 14, lineHeight: 20, textAlign: "center" },
});
