import React, { useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useColors } from '@/hooks/useColors';
import { useAlarm } from '@/context/AlarmContext';

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { objectLibrary, activityLibrary, addLibraryItem, removeLibraryItem } = useAlarm();
  const [newObject, setNewObject] = useState('');
  const [newActivity, setNewActivity] = useState('');

  const add = (label: string, type: 'object' | 'activity', setter: (s: string) => void) => {
    if (!label.trim()) return;
    addLibraryItem({ label: label.trim(), type });
    setter('');
  };

  const confirmRemove = (id: string, label: string) => {
    Alert.alert('Remove Item', `Remove "${label}" from library?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeLibraryItem(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Library</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OBJECTS (Stage 1)</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {objectLibrary.map(item => (
            <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
              <Icon name="box" size={16} color={colors.primary} />
              <Text style={[styles.itemLabel, { color: colors.foreground }]}>{item.label}</Text>
              <TouchableOpacity onPress={() => confirmRemove(item.id, item.label)}>
                <Icon name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addRow}>
            <TextInput
              style={[styles.addInput, { color: colors.foreground, borderColor: colors.border }]}
              value={newObject}
              onChangeText={setNewObject}
              placeholder="Add object…"
              placeholderTextColor={colors.mutedForeground}
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => add(newObject, 'object', setNewObject)}
            >
              <Icon name="plus" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACTIVITIES (Stage 2)</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {activityLibrary.map(item => (
            <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
              <Icon name="activity" size={16} color={colors.primary} />
              <Text style={[styles.itemLabel, { color: colors.foreground }]}>{item.label}</Text>
              <TouchableOpacity onPress={() => confirmRemove(item.id, item.label)}>
                <Icon name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addRow}>
            <TextInput
              style={[styles.addInput, { color: colors.foreground, borderColor: colors.border }]}
              value={newActivity}
              onChangeText={setNewActivity}
              placeholder="Add activity…"
              placeholderTextColor={colors.mutedForeground}
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => add(newActivity, 'activity', setNewActivity)}
            >
              <Icon name="plus" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
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
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  section: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12, borderBottomWidth: 1,
  },
  itemLabel: { flex: 1, fontSize: 15 },
  addRow: { flexDirection: 'row', gap: 8, padding: 12 },
  addInput: {
    flex: 1, fontSize: 14, borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  addBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
