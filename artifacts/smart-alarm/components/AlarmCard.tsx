import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Alarm } from "@/context/AlarmContext";

interface Props {
  alarm: Alarm;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTrigger: () => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AlarmCard({ alarm, onToggle, onEdit, onDelete, onTrigger }: Props) {
  const colors = useColors();

  const [hour, minute] = alarm.time.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.main} onPress={onEdit} activeOpacity={0.7}>
        <View>
          <View style={styles.timeRow}>
            <Text style={[styles.time, { color: alarm.enabled ? colors.foreground : colors.mutedForeground }]}>
              {displayHour}:{minute.toString().padStart(2, "0")}
            </Text>
            <Text style={[styles.ampm, { color: alarm.enabled ? colors.primary : colors.mutedForeground }]}>
              {ampm}
            </Text>
          </View>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{alarm.label || "Alarm"}</Text>
          {alarm.repeatDays.length > 0 && (
            <View style={styles.daysRow}>
              {DAY_LABELS.map((d, i) => (
                <Text
                  key={d}
                  style={[
                    styles.day,
                    {
                      color: alarm.repeatDays.includes(i) ? colors.primary : colors.mutedForeground,
                      fontWeight: alarm.repeatDays.includes(i) ? "600" : "400",
                    },
                  ]}
                >
                  {d}
                </Text>
              ))}
            </View>
          )}
          {alarm.strictMode && (
            <View style={[styles.badge, { backgroundColor: colors.destructive + "22" }]}>
              <Feather name="shield" size={10} color={colors.destructive} />
              <Text style={[styles.badgeText, { color: colors.destructive }]}>Strict Mode</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.actions}>
        <Switch
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.primaryForeground}
        />
        <TouchableOpacity
          style={[styles.testBtn, { backgroundColor: colors.success + "22" }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onTrigger(); }}
        >
          <Feather name="bell" size={16} color={colors.success} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: colors.destructive + "22" }]}
          onPress={onDelete}
        >
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  main: { flex: 1 },
  timeRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  time: { fontSize: 44, fontFamily: "Inter_700Bold", lineHeight: 48 },
  ampm: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  label: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  daysRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  day: { fontSize: 11, fontFamily: "Inter_500Medium" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  actions: { gap: 8, alignItems: "center" },
  testBtn: { padding: 8, borderRadius: 10 },
  deleteBtn: { padding: 8, borderRadius: 10 },
});
