import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { formatMonthYear } from "@/lib/db/calendar";

type Props = {
  year: number;
  month: number;
  isCurrentMonth: boolean;
  colors: {
    onSurface: string;
    disabled: string;
    primary: string;
  };
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
};

export default function CalendarMonthHeader({
  year,
  month,
  isCurrentMonth,
  colors,
  onPrevMonth,
  onNextMonth,
  onToday,
}: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.navRow}>
        <Pressable
          onPress={onPrevMonth}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          hitSlop={12}
          style={styles.navButton}
        >
          <Text style={[styles.navArrow, { color: colors.onSurface }]}>
            {"<"}
          </Text>
        </Pressable>

        <Text
          variant="subtitle"
          style={[styles.monthTitle, { color: colors.onSurface }]}
        >
          {formatMonthYear(year, month)}
        </Text>

        <Pressable
          onPress={onNextMonth}
          disabled={isCurrentMonth}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          hitSlop={12}
          style={styles.navButton}
        >
          <Text
            style={[
              styles.navArrow,
              {
                color: isCurrentMonth ? colors.disabled : colors.onSurface,
              },
            ]}
          >
            {">"}
          </Text>
        </Pressable>
      </View>

      {!isCurrentMonth && (
        <Pressable
          onPress={onToday}
          accessibilityRole="button"
          accessibilityLabel="Go to current month"
          style={[styles.todayButton, { borderColor: colors.primary }]}
        >
          <Text
            variant="caption"
            style={{ color: colors.primary, fontWeight: "600" }}
          >
            Today
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  navButton: {
    padding: 8,
  },
  navArrow: {
    fontSize: 20,
    fontWeight: "700",
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 12,
  },
  todayButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
