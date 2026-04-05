import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
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
import { useAlarm } from "@/context/AlarmContext";
import { useColors } from "@/hooks/useColors";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function EditAlarmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { alarms, updateAlarm, deleteAlarm } = useAlarm();

  const alarm = alarms.find((a) => a.id === id);

  if (!alarm) {
    router.back();
    return null;
  }

  const [label, setLabel] = useState(alarm.label);
  const [hour, setHour] = useState(parseInt(alarm.time.split(":")[0]));
  const [minute, setMinute] = useState(parseInt(alarm.time.split(":")[1]));
  const [strictMode, setStrictMode] = useState(alarm.strictMode);
  const [repeatDays, setRepeatDays] = useState<number[]>(alarm.repeatDays);
  const [secondaryInterval, setSecondaryInterval] = useState(alarm.secondaryInterval);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const toggleDay = (d: number) => {
    setRepeatDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    updateAlarm(alarm.id, { time: timeStr, label, strictMode, repeatDays, secondaryInterval });
    router.back();
  };

  const handleDelete = () => {
    deleteAlarm(alarm.id);
    router.back();
  };

  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const MINUTES = Array.from({ length: 60 }, (_, i) => i);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Alarm</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.timePicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.timeDisplay, { color: colors.foreground }]}>
            {displayHour}:{minute.toString().padStart(2, "0")} {ampm}
          </Text>
          <View style={styles.pickers}>
            <View style={styles.pickerCol}>
              <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>Hour</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.pickerItem,
                      h === hour && [styles.pickerItemActive, { backgroundColor: colors.primary }],
                    ]}
                    onPress={() => { setHour(h); Haptics.selectionAsync(); }}
                  >
                    <Text style={[styles.pickerItemText, { color: h === hour ? colors.primaryForeground : colors.foreground }]}>
                      {h.toString().padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={[styles.colon, { color: colors.foreground }]}>:</Text>
            <View style={styles.pickerCol}>
              <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>Minute</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {MINUTES.filter((m) => m % 5 === 0).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.pickerItem,
                      m === minute && [styles.pickerItemActive, { backgroundColor: colors.primary }],
                    ]}
                    onPress={() => { setMinute(m); Haptics.selectionAsync(); }}
                  >
                    <Text style={[styles.pickerItemText, { color: m === minute ? colors.primaryForeground : colors.foreground }]}>
                      {m.toString().padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>LABEL</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="e.g. Morning alarm"
            placeholderTextColor={colors.mutedForeground}
            value={label}
            onChangeText={setLabel}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>REPEAT DAYS</Text>
          <View style={styles.daysRow}>
            {DAYS.map((d, i) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.dayBtn,
                  repeatDays.includes(i)
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 },
                ]}
                onPress={() => toggleDay(i)}
              >
                <Text style={[styles.dayBtnText, { color: repeatDays.includes(i) ? colors.primaryForeground : colors.foreground }]}>
                  {d[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Strict Mode</Text>
              <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                Disables dismiss until both stages complete
              </Text>
            </View>
            <Switch
              value={strictMode}
              onValueChange={(v) => { setStrictMode(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.primaryForeground}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Stage 2 Interval</Text>
              <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                {secondaryInterval} minutes after Stage 1
              </Text>
            </View>
            <View style={styles.intervalBtns}>
              {[15, 30, 45].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.intervalBtn,
                    secondaryInterval === v
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 },
                  ]}
                  onPress={() => { setSecondaryInterval(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.intervalBtnText, { color: secondaryInterval === v ? colors.primaryForeground : colors.foreground }]}>
                    {v}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: colors.destructive + "22", borderColor: colors.destructive }]}
          onPress={handleDelete}
        >
          <Feather name="trash-2" size={18} color={colors.destructive} />
          <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete Alarm</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 16,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20, gap: 14 },
  timePicker: { padding: 20, borderRadius: 20, borderWidth: 1, alignItems: "center" },
  timeDisplay: { fontSize: 52, fontFamily: "Inter_700Bold", marginBottom: 16 },
  pickers: { flexDirection: "row", alignItems: "center", gap: 16 },
  pickerCol: { alignItems: "center" },
  pickerLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8 },
  pickerScroll: { height: 120 },
  pickerItem: { padding: 10, borderRadius: 10, marginVertical: 2, minWidth: 60, alignItems: "center" },
  pickerItemActive: {},
  pickerItemText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  colon: { fontSize: 32, fontFamily: "Inter_700Bold", marginTop: 20 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: "Inter_400Regular" },
  daysRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  dayBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  dayBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  settingDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  intervalBtns: { flexDirection: "row", gap: 6 },
  intervalBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  intervalBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 16, borderWidth: 1 },
  deleteBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
