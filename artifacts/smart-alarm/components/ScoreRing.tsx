import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 120 }: Props) {
  const colors = useColors();
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const scoreColor = score >= 80 ? colors.scoreGood : score >= 50 ? colors.scoreMed : colors.scoreBad;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.ring, { width: size, height: size }]}>
        <View
          style={[
            styles.track,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
              borderColor: colors.border,
            },
          ]}
        />
        <View
          style={[
            styles.progress,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
              borderColor: scoreColor,
              transform: [{ rotate: `${(score / 100) * 360 - 90}deg` }],
            },
          ]}
        />
      </View>
      <View style={styles.center}>
        <Text style={[styles.score, { color: scoreColor, fontSize: size * 0.25 }]}>
          {score}
        </Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>SCORE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", alignItems: "center", justifyContent: "center" },
  track: {
    position: "absolute",
    borderWidth: 8,
  },
  progress: {
    position: "absolute",
    borderWidth: 8,
    borderTopColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  center: { alignItems: "center" },
  score: { fontFamily: "Inter_700Bold", lineHeight: 32 },
  label: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
});
