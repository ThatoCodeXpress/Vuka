import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useColors } from '@/hooks/useColors';

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}>
        <View style={[styles.statsRow]}>
          {[
            { label: 'Avg Score', value: '—', icon: 'award' },
            { label: 'Pass Rate', value: '—', icon: 'check-circle' },
            { label: 'Total Days', value: '0', icon: 'calendar' },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Icon name={s.icon as 'award'} size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.empty}>
          <Icon name="bar-chart-2" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No history yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Complete your first alarm to see your sleep score here
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
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, alignItems: 'center', gap: 4,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
