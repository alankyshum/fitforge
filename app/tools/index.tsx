import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack } from "expo-router";
import { useLayout } from "../../lib/layout";
import { PlateCalculatorContent } from "./plates";
import { RMCalculatorContent } from "./rm";
import { TimerContent } from "./timer";

type ToolKey = "plates" | "rm" | "timer";

const TOOLS: { key: ToolKey; title: string; subtitle: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }[] = [
  {
    key: "plates",
    title: "Plate Calculator",
    subtitle: "Calculate plates for any barbell weight",
    icon: "weight",
  },
  {
    key: "rm",
    title: "1RM Calculator",
    subtitle: "Estimate your one-rep max from submaximal sets",
    icon: "arm-flex",
  },
  {
    key: "timer",
    title: "Interval Timer",
    subtitle: "Tabata · EMOM · AMRAP",
    icon: "timer-outline",
  },
];

const CONTENT: Record<ToolKey, React.FC> = {
  plates: () => <PlateCalculatorContent initialWeight="" initialUnit="" />,
  rm: RMCalculatorContent,
  timer: TimerContent,
};

export default function ToolsHub() {
  const theme = useTheme();
  const layout = useLayout();
  const [expanded, setExpanded] = useState<ToolKey | null>(null);

  function toggle(key: ToolKey) {
    setExpanded(prev => (prev === key ? null : key));
  }

  return (
    <>
      <Stack.Screen options={{ title: "Workout Tools" }} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{ padding: layout.horizontalPadding, paddingVertical: 24, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {TOOLS.map((tool) => {
          const isOpen = expanded === tool.key;
          const Content = CONTENT[tool.key];
          return (
            <Card
              key={tool.key}
              style={{ backgroundColor: theme.colors.surface }}
            >
              <Pressable
                onPress={() => toggle(tool.key)}
                accessibilityLabel={`${isOpen ? "Collapse" : "Expand"} ${tool.title}`}
                accessibilityRole="button"
              >
                <Card.Content style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name={tool.icon}
                    size={28}
                    color={theme.colors.primary}
                    style={styles.icon}
                  />
                  <View style={styles.textCol}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                      {tool.title}
                    </Text>
                    {!isOpen && (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {tool.subtitle}
                      </Text>
                    )}
                  </View>
                  <MaterialCommunityIcons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </Card.Content>
              </Pressable>
              {isOpen && (
                <Card.Content style={styles.cardBody}>
                  <Content />
                </Card.Content>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 16,
  },
  textCol: {
    flex: 1,
  },
  cardBody: {
    paddingTop: 8,
  },
});
