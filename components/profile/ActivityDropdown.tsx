import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { ACTIVITY_LABELS, type ActivityLevel } from "../../lib/nutrition-calc";
import { useThemeColors } from "@/hooks/useThemeColors";

type Props = {
  value: ActivityLevel;
  onChange: (level: ActivityLevel) => void;
  visible: boolean;
  onToggle: () => void;
};

export function ActivityDropdown({ value, onChange, visible, onToggle }: Props) {
  const colors = useThemeColors();

  return (
    <>
      <Pressable
        onPress={onToggle}
        style={[styles.dropdown, { borderColor: colors.outline, backgroundColor: colors.surface }]}
        accessibilityLabel={`Activity level: ${ACTIVITY_LABELS[value]}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: visible }}
      >
        <Text variant="body" style={{ color: colors.onSurface, flex: 1 }}>
          {ACTIVITY_LABELS[value]}
        </Text>
        <Text style={{ color: colors.onSurfaceVariant }}>{visible ? "▲" : "▼"}</Text>
      </Pressable>
      {visible && (
        <View style={[styles.dropdownList, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => onChange(key)}
              style={[
                styles.dropdownItem,
                key === value ? { backgroundColor: colors.primaryContainer } : undefined,
              ]}
              accessibilityLabel={ACTIVITY_LABELS[key]}
              accessibilityRole="radio"
              accessibilityState={{ selected: key === value }}
            >
              <Text
                variant="body"
                style={{ color: key === value ? colors.onPrimaryContainer : colors.onSurface }}
              >
                {ACTIVITY_LABELS[key]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    minHeight: 48,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
});
