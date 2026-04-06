import React, { useState } from 'react';
import {
  ScrollView, StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useColors } from '@/hooks/useColors';
import { useAlarm } from '@/context/AlarmContext';
import { RootStackParamList } from '@/navigation';

type RouteParams = RouteProp<RootStackParamList, 'EditAlarm'>;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const INTERVALS = [15, 30, 45, 60];

export default function EditAlarmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { alarm } = route.params;
  const { updateAlarm, deleteAlarm } = useAlarm();
  const [time, setTime] = useState(alarm.time);
  const [label, setLabel] = useState(alarm.label);
  const [repeatDays, setRepeatDays] = useState<number[]>(alarm.repeatDays);
  const [strictMode, setStrictMode] = useState(alarm.strictMode);
  const [secondaryInterval, setSecondaryInterval] = useState(alarm.secondaryInterval);

  const toggleDay = (i: number) => {
    setRepeatDays(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i]);
  };

  const save = () => {
    updateAlarm(alarm.id, { time, label, repeatDays, strictMode, secondaryInterval });
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="x" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Edit Alarm</Text>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={save}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TIME (HH:MM)</Text>
          <TextInput
            style={[styles.timeInput, { color: colors.foreground, borderColor: colors.primary }]}
            value={time}
            onChangeText={setTime}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>LABEL</Text>
          <TextInput
            style={[styles.textInput, { color: colors.foreground, borderColor: colors.border }]}
            value={label}
            onChangeText={setLabel}
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>REPEAT</Text>
          <View style={styles.daysRow}>
            {DAYS.map((d, i) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.dayBtn, { borderColor: colors.border },
                  repeatDays.includes(i) && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => toggleDay(i)}
              >
                <Text style={[styles.dayText, { color: repeatDays.includes(i) ? '#fff' : colors.mutedForeground }]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>STAGE 2 INTERVAL</Text>
          <View style={styles.intervalRow}>
            {INTERVALS.map(v => (
              <TouchableOpacity
                key={v}
                style={[
                  styles.intervalBtn, { borderColor: colors.border },
                  secondaryInterval === v && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setSecondaryInterval(v)}
              >
                <Text style={[styles.intervalText, { color: secondaryInterval === v ? '#fff' : colors.mutedForeground }]}>
                  {v}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Strict Mode</Text>
              <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>Must complete both stages</Text>
            </View>
            <Switch value={strictMode} onValueChange={setStrictMode}
              trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: colors.destructive + '22', borderColor: colors.destructive }]}
          onPress={() => { deleteAlarm(alarm.id); navigation.goBack(); }}
        >
          <Icon name="trash-2" size={18} color={colors.destructive} />
          <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete Alarm</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  scroll: { paddingHorizontal: 20, gap: 16 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  timeInput: { fontSize: 40, fontWeight: '700', textAlign: 'center', borderBottomWidth: 2, paddingBottom: 4 },
  textInput: { fontSize: 16, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  dayText: { fontSize: 12, fontWeight: '600' },
  intervalRow: { flexDirection: 'row', gap: 8 },
  intervalBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  intervalText: { fontSize: 14, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 15, fontWeight: '600' },
  switchDesc: { fontSize: 12, marginTop: 2 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 8,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
});
