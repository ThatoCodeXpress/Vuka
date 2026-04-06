import React from 'react';
import {
  Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Feather';
import { useColors } from '@/hooks/useColors';
import { useAlarm } from '@/context/AlarmContext';
import { AlarmCard } from '@/components/AlarmCard';
import { RootStackParamList } from '@/navigation';

type Nav = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { alarms, updateAlarm, deleteAlarm, triggerAlarm } = useAlarm();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Vuka</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddAlarm')}
        >
          <Icon name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          ALARMS ({alarms.length})
        </Text>
        {alarms.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="bell-off" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No alarms set</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tap + to create your first smart alarm
            </Text>
          </View>
        ) : (
          alarms.map(alarm => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              onToggle={() => updateAlarm(alarm.id, { enabled: !alarm.enabled })}
              onEdit={() => navigation.navigate('EditAlarm', { alarm })}
              onDelete={() => Alert.alert('Delete Alarm', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteAlarm(alarm.id) },
              ])}
              onTrigger={() => triggerAlarm(alarm)}
            />
          ))
        )}
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
  greeting: { fontSize: 13, fontWeight: '400' },
  title: { fontSize: 28, fontWeight: '700' },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub: { fontSize: 14 },
});
