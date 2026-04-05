import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActiveAlarmModal } from "@/components/ActiveAlarmModal";
import { AlarmCard } from "@/components/AlarmCard";
import { ScoreRing } from "@/components/ScoreRing";
import { useAlarm } from "@/context/AlarmContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { alarms, deleteAlarm, toggleAlarm, triggerAlarm, getWeeklyScores } = useAlarm();

  const weeklyScores = getWeeklyScores();
  const latestScore = weeklyScores[0]?.score ?? 0;
  const avgScore =
    weeklyScores.length > 0
      ? Math.round(weeklyScores.reduce((a, s) => a + s.score, 0) / weeklyScores.length)
      : 0;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActiveAlarmModal />
      <LinearGradient
        colors={["#1a1040", colors.background]}
        style={[styles.header, { paddingTop: topInset + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Vuka</Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/add-alarm");
            }}
          >
            <Feather name="plus" size={24} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {weeklyScores.length > 0 && (
          <View style={[styles.scoreCard, { backgroundColor: "rgba(99,102,241,0.12)" }]}>
            <ScoreRing score={latestScore} size={100} />
            <View style={styles.scoreDetails}>
              <Text style={[styles.scoreTodayLabel, { color: colors.mutedForeground }]}>
                Today's Sleep Score
              </Text>
              <Text style={[styles.scoreToday, { color: colors.foreground }]}>
                {getScoreLabel(latestScore)}
              </Text>
              <Text style={[styles.scoreAvg, { color: colors.mutedForeground }]}>
                7-day avg: {avgScore}
              </Text>
              <View style={styles.scoreBars}>
                {weeklyScores.slice(0, 7).reverse().map((s, i) => (
                  <View key={i} style={[styles.barContainer]}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(4, (s.score / 100) * 36),
                          backgroundColor:
                            s.score >= 80
                              ? colors.scoreGood
                              : s.score >= 50
                              ? colors.scoreMed
                              : colors.scoreBad,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={[styles.listSection, { flex: 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          ALARMS ({alarms.length})
        </Text>
        {alarms.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="bell-off" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No alarms set</Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground + "88" }]}>
              Tap + to create your first smart alarm
            </Text>
          </View>
        ) : (
          <FlatList
            data={alarms}
            keyExtractor={(a) => a.id}
            contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 90 }]}
            scrollEnabled={alarms.length > 0}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <AlarmCard
                alarm={item}
                onToggle={() => toggleAlarm(item.id)}
                onEdit={() => router.push(`/edit-alarm?id=${item.id}`)}
                onDelete={() => deleteAlarm(item.id)}
                onTrigger={() => triggerAlarm(item.id)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  if (score > 0) return "Poor";
  return "No data";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 20,
  },
  scoreDetails: { flex: 1 },
  scoreTodayLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  scoreToday: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 2 },
  scoreAvg: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  scoreBars: { flexDirection: "row", gap: 4, alignItems: "flex-end", marginTop: 10, height: 40 },
  barContainer: { flex: 1, justifyContent: "flex-end" },
  bar: { borderRadius: 3, minHeight: 4 },
  listSection: { paddingHorizontal: 20, paddingTop: 16 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 12 },
  list: { paddingTop: 4 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySubText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
