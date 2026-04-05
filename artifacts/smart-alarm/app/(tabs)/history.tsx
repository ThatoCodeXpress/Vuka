import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlarm } from "@/context/AlarmContext";
import { useColors } from "@/hooks/useColors";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history, sleepScores, loadHistory } = useAlarm();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    loadHistory();
  }, []);

  const avgScore =
    sleepScores.length > 0
      ? Math.round(sleepScores.reduce((a, s) => a + s.score, 0) / sleepScores.length)
      : 0;

  const passRate =
    history.length > 0
      ? Math.round((history.filter((h) => h.result === "pass").length / history.length) * 100)
      : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>History & Analytics</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="Avg Score"
          value={`${avgScore}`}
          icon="trending-up"
          color={colors.scoreGood}
          colors={colors}
        />
        <StatCard
          label="Pass Rate"
          value={`${passRate}%`}
          icon="check-circle"
          color={colors.primary}
          colors={colors}
        />
        <StatCard
          label="Total Events"
          value={`${history.length}`}
          icon="activity"
          color={colors.warning}
          colors={colors}
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        SLEEP SCORES
      </Text>
      {sleepScores.length === 0 ? (
        <EmptyState message="No sleep scores yet. Complete an alarm to see your score." colors={colors} />
      ) : (
        <FlatList
          data={sleepScores.slice(0, 20)}
          keyExtractor={(s) => s.id}
          scrollEnabled={sleepScores.length > 0}
          contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 80 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.scoreRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.scoreCircle, {
                backgroundColor:
                  item.score >= 80 ? colors.scoreGood + "22" : item.score >= 50 ? colors.scoreMed + "22" : colors.scoreBad + "22"
              }]}>
                <Text style={[styles.scoreNum, {
                  color: item.score >= 80 ? colors.scoreGood : item.score >= 50 ? colors.scoreMed : colors.scoreBad
                }]}>
                  {item.score}
                </Text>
              </View>
              <View style={styles.scoreInfo}>
                <Text style={[styles.scoreDate, { color: colors.foreground }]}>{formatDate(item.date)}</Text>
                <Text style={[styles.scoreMeta, { color: colors.mutedForeground }]}>
                  Woke at {item.wakeTime} · Set for {item.setTime} · {item.attempts} attempt{item.attempts !== 1 ? "s" : ""}
                </Text>
              </View>
              <Text style={[styles.scoreDiff, { color: colors.mutedForeground }]}>
                +{item.timeDiff}min
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function StatCard({ label, value, icon, color, colors }: {
  label: string; value: string; icon: string; color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon as "trending-up"} size={18} color={color} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function EmptyState({ message, colors }: { message: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.empty}>
      <Feather name="inbox" size={40} color={colors.mutedForeground} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{message}</Text>
    </View>
  );
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-ZA", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  list: { paddingHorizontal: 20 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  scoreInfo: { flex: 1 },
  scoreDate: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  scoreMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  scoreDiff: { fontSize: 12, fontFamily: "Inter_500Medium" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
});
