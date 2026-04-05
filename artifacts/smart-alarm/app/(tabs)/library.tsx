import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlarm, type LibraryItem } from "@/context/AlarmContext";
import { useColors } from "@/hooks/useColors";

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { objectLibrary, activityLibrary, addToLibrary, removeFromLibrary } = useAlarm();
  const [tab, setTab] = useState<"objects" | "activities">("objects");
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const items = tab === "objects" ? objectLibrary : activityLibrary;

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addToLibrary({ label: newLabel.trim(), type: tab === "objects" ? "object" : "activity" });
    setNewLabel("");
    setShowAdd(false);
  };

  const handleDelete = (item: LibraryItem) => {
    Alert.alert("Remove Item", `Remove "${item.label}" from the library?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => { removeFromLibrary(item.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Verification Library</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Objects and activities for AI verification
        </Text>
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, tab === "objects" && [styles.tabActive, { backgroundColor: colors.primary }]]}
          onPress={() => setTab("objects")}
        >
          <Feather name="box" size={16} color={tab === "objects" ? colors.primaryForeground : colors.mutedForeground} />
          <Text style={[styles.tabText, { color: tab === "objects" ? colors.primaryForeground : colors.mutedForeground }]}>
            Objects ({objectLibrary.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === "activities" && [styles.tabActive, { backgroundColor: colors.primary }]]}
          onPress={() => setTab("activities")}
        >
          <Feather name="activity" size={16} color={tab === "activities" ? colors.primaryForeground : colors.mutedForeground} />
          <Text style={[styles.tabText, { color: tab === "activities" ? colors.primaryForeground : colors.mutedForeground }]}>
            Activities ({activityLibrary.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.primary + "15" }]}>
        <Feather name="info" size={14} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.primary }]}>
          {tab === "objects"
            ? "The system randomly selects one object each morning for Stage 1 verification."
            : "The system randomly selects one activity for Stage 2 verification (30 min after alarm)."}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        scrollEnabled={items.length > 0}
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="archive" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No {tab} added yet
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.libItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.itemIcon, { backgroundColor: colors.primary + "22" }]}>
              <Feather
                name={tab === "objects" ? "box" : "activity"}
                size={18}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.itemLabel, { color: colors.foreground }]}>{item.label}</Text>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.itemDelete}>
              <Feather name="trash-2" size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomInset + 90 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAdd(true); }}
      >
        <Feather name="plus" size={24} color={colors.primaryForeground} />
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide" presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Add {tab === "objects" ? "Object" : "Activity"}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder={`e.g. ${tab === "objects" ? "Laptop" : "Morning jog"}`}
              placeholderTextColor={colors.mutedForeground}
              value={newLabel}
              onChangeText={setNewLabel}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => { setShowAdd(false); setNewLabel(""); }}
              >
                <Text style={[styles.modalCancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalAddBtn, { backgroundColor: colors.primary, opacity: newLabel.trim() ? 1 : 0.5 }]}
                onPress={handleAdd}
                disabled={!newLabel.trim()}
              >
                <Text style={[styles.modalAddText, { color: colors.primaryForeground }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {},
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  list: { paddingHorizontal: 20 },
  libItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  itemIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  itemLabel: { flex: 1, fontSize: 16, fontFamily: "Inter_500Medium" },
  itemDelete: { padding: 6 },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 16 },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  modalAddBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  modalAddText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
