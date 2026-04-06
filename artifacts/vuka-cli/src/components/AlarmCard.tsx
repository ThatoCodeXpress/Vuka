import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useColors } from '@/hooks/useColors';
import { Alarm } from '@/context/AlarmContext';

interface Props {
  alarm: Alarm;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTrigger: () => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AlarmCard({ alarm, onToggle, onEdit, onDelete, onTrigger }: Props) {
  const colors = useColors();
  const [hour, minute] = alarm.time.split(':').map(Number);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.main} onPress={onEdit} activeOpacity={0.7}>
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: alarm.enabled ? colors.foreground : colors.mutedForeground }]}>
            {displayHour}:{minute.toString().padStart(2, '0')}
          </Text>
          <Text style={[styles.ampm, { color: alarm.enabled ? colors.primary : colors.mutedForeground }]}>
            {ampm}
          </Text>
        </View>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{alarm.label || 'Alarm'}</Text>
        {alarm.repeatDays.length > 0 && (
          <View style={styles.daysRow}>
            {DAY_LABELS.map((d, i) => (
              <Text
                key={d}
                style={[
                  styles.day,
                  {
                    color: alarm.repeatDays.includes(i) ? colors.primary : colors.mutedForeground,
                    fontWeight: alarm.repeatDays.includes(i) ? '700' : '400',
                  },
                ]}
              >
                {d}
              </Text>
            ))}
          </View>
        )}
        {alarm.strictMode && (
          <View style={[styles.badge, { backgroundColor: colors.destructive + '22' }]}>
            <Icon name="shield" size={10} color={colors.destructive} />
            <Text style={[styles.badgeText, { color: colors.destructive }]}>Strict Mode</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.actions}>
        <Switch
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.success + '22' }]}
          onPress={() => { ReactNativeHapticFeedback.trigger('impactMedium'); onTrigger(); }}
        >
          <Icon name="bell" size={16} color={colors.success} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.destructive + '22' }]}
          onPress={onDelete}
        >
          <Icon name="trash-2" size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1,
  },
  main: { flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  time: { fontSize: 44, fontWeight: '700', lineHeight: 48 },
  ampm: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  label: { fontSize: 13, marginTop: 2 },
  daysRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  day: { fontSize: 11 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    marginTop: 6, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  actions: { gap: 8, alignItems: 'center' },
  iconBtn: { padding: 8, borderRadius: 10 },
});
