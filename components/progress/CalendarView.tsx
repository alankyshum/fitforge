import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useFocusEffect } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useFloatingTabBarHeight } from "@/components/FloatingTabBar";
import {
  getMonthlyWorkoutDates,
  getWorkoutDatesForStreak,
  calculateStreaks,
  dateToISO,
  type WorkoutDay,
} from "@/lib/db/calendar";
import CalendarGrid from "./CalendarGrid";
import CalendarDayDetail from "./CalendarDayDetail";
import CalendarStreaks from "./CalendarStreaks";
import CalendarMonthHeader from "./CalendarMonthHeader";

type Props = {
  weekStartDay: number;
};

type SectionItem =
  | { type: "grid" }
  | { type: "streaks" }
  | { type: "detail"; dateStr: string }
  | { type: "empty" };

export default function CalendarView({ weekStartDay }: Props) {
  const colors = useThemeColors();
  const tabBarHeight = useFloatingTabBarHeight();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const todayDate = new Date();
  const todayStr = dateToISO(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate()
  );

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  const workoutDateSet = useMemo(
    () => new Set(workoutDays.map((d) => d.workout_date)),
    [workoutDays]
  );

  const loadData = async (y: number, m: number) => {
    setLoading(true);
    setError(false);
    try {
      const [days, streakDates] = await Promise.all([
        getMonthlyWorkoutDates(y, m),
        getWorkoutDatesForStreak(),
      ]);
      setWorkoutDays(days);
      const { currentStreak: cs, longestStreak: ls } =
        calculateStreaks(streakDates);
      setCurrentStreak(cs);
      setLongestStreak(ls);
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  useFocusEffect(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    useCallback(() => {
      loadData(year, month);
    }, [year, month])
  );

  const goToPrevMonth = () => {
    setSelectedDate(null);
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    setSelectedDate(null);
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  const goToToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
    setSelectedDate(null);
  };

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleSelectDate = useCallback((dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }, []);

  const sections = useMemo<SectionItem[]>(() => {
    const items: SectionItem[] = [{ type: "grid" }, { type: "streaks" }];
    if (selectedDate) {
      items.push({ type: "detail", dateStr: selectedDate });
    }
    if (workoutDays.length === 0 && !selectedDate) {
      items.push({ type: "empty" });
    }
    return items;
  }, [selectedDate, workoutDays.length]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SectionItem>) => {
      switch (item.type) {
        case "grid":
          return (
            <CalendarGrid
              year={year}
              month={month}
              weekStartDay={weekStartDay}
              workoutDates={workoutDateSet}
              selectedDate={selectedDate}
              todayStr={todayStr}
              onSelectDate={handleSelectDate}
            />
          );
        case "streaks":
          return (
            <View style={styles.streaksWrap}>
              <CalendarStreaks
                currentStreak={currentStreak}
                longestStreak={longestStreak}
              />
            </View>
          );
        case "detail":
          return <CalendarDayDetail dateStr={item.dateStr} />;
        case "empty":
          return (
            <View
              style={[styles.emptyState, { backgroundColor: colors.surface }]}
            >
              <Text
                style={{ color: colors.onSurfaceVariant, textAlign: "center" }}
              >
                No workouts this month. Start your first workout to see your
                calendar fill up!
              </Text>
            </View>
          );
      }
    },
    [
      year, month, weekStartDay, workoutDateSet,
      selectedDate, todayStr, handleSelectDate,
      currentStreak, longestStreak, colors,
    ]
  );

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const keyExtractor = useCallback(
    (item: SectionItem) => item.type + ("dateStr" in item ? item.dateStr : ""),
    []
  );

  if (loading) {
    return (
      <View style={[styles.centered, { flex: 1 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { flex: 1 }]}>
        <Text style={{ color: colors.error, textAlign: "center", marginBottom: 12 }}>
          Could not load calendar data
        </Text>
        <Pressable
          onPress={() => loadData(year, month)}
          style={[styles.retryButton, { borderColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Retry loading calendar"
        >
          <Text style={{ color: colors.primary, fontWeight: "600" }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={sections}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: tabBarHeight + 16 },
      ]}
      ListHeaderComponent={
        <CalendarMonthHeader
          year={year}
          month={month}
          isCurrentMonth={isCurrentMonth}
          colors={colors}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  streaksWrap: {
    marginTop: 12,
  },
  emptyState: {
    borderRadius: 12,
    padding: 24,
    marginTop: 12,
  },
});
