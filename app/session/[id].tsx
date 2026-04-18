/* eslint-disable max-lines, max-lines-per-function, react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import Reanimated from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/bna-toast";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync } from "expo-keep-awake";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { setEnabled as setAudioEnabled } from "../../lib/audio";
import {
  addSet,
  cancelSession,
  deleteSet,
  completeSession,
  completeSet,
  getRestSecondsForLink,
  uncompleteSet,
  updateSet,
  updateSetRPE,
  updateSetNotes,
  updateSetTrainingMode,
  getSessionSets,
  getAppSetting,
} from "../../lib/db";
import {
  getSessionProgramDayId,
  getProgramDayById,
  advanceProgram,
} from "../../lib/programs";
import type { TrainingMode } from "../../lib/types";
import { formatTime } from "../../lib/format";
import { useLayout } from "../../lib/layout";
import { confirmAction } from "../../lib/confirm";
import ExercisePickerSheet from "../../components/ExercisePickerSheet";
import SubstitutionSheet from "../../components/SubstitutionSheet";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useRestTimer } from "../../hooks/useRestTimer";
import { useSessionData } from "../../hooks/useSessionData";
import { useExerciseManagement } from "../../hooks/useExerciseManagement";
import { useSetTypeActions } from "../../hooks/useSetTypeActions";
import { ExerciseGroupCard } from "../../components/session/ExerciseGroupCard";
import { ExerciseDetailDrawerContent } from "../../components/session/ExerciseDetailDrawer";
import { SetTypeSheet } from "../../components/session/SetTypeSheet";
import type { SetWithMeta } from "../../components/session/types";

export default function ActiveSession() {
  useEffect(() => {
    activateKeepAwakeAsync().catch(() => {});
  }, []);
  const colors = useThemeColors();
  const router = useRouter();
  const layout = useLayout();
  const { id, templateId, sourceSessionId } = useLocalSearchParams<{
    id: string;
    templateId?: string;
    sourceSessionId?: string;
  }>();
  const { info: showToast, error: showError } = useToast();

  // Load timer sound setting
  useEffect(() => {
    getAppSetting("timer_sound_enabled").then((val) => {
      setAudioEnabled(val !== "false");
    }).catch(() => {
      setAudioEnabled(true);
      showError("Could not load sound setting");
    });
  }, []);

  const {
    session, groups, setGroups, step, unit,
    suggestions, modes, setModes, maxes,
    allExercises, linkIds, palette,
    updateGroupSet, load,
  } = useSessionData({ id, templateId, sourceSessionId });

  const {
    rest, restFlashStyle, startRest, startRestWithDuration, dismissRest, restRef,
  } = useRestTimer({ sessionId: id, colors });

  const {
    detailExercise, setDetailExercise, detailSheetRef,
    handleShowDetail,
    swapSource, setSwapSource, swapSheetRef,
    handleSwapOpen, handleSwapSelect,
    pickerOpen, setPickerOpen,
    handleAddExercise, handlePickExercise,
    handleDeleteExercise,
    cleanupRefs,
  } = useExerciseManagement({
    id, groups, setGroups, load, startRest, dismissRest,
  });

  const {
    setTypeSheetSetId, setSetTypeSheetSetId,
    handleCycleSetType, handleLongPressSetType, handleSelectSetType,
  } = useSetTypeActions({ groups, setGroups, maxes });

  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [exerciseNotesOpen, setExerciseNotesOpen] = useState<Record<string, boolean>>({});
  const [exerciseNotesDraft, setExerciseNotesDraft] = useState<Record<string, string>>({});
  const [halfStep, setHalfStep] = useState<{ setId: string; base: number } | null>(null);
  const [nextHint, setNextHint] = useState<string | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detailSnapPoints = useMemo(() => ["40%", "90%"], []);

  // Timer
  useEffect(() => {
    if (!session) return;
    const update = () => {
      setElapsed(Math.floor((Date.now() - session.started_at) / 1000));
    };
    update();
    timer.current = setInterval(update, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [session]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (restRef.current) clearInterval(restRef.current);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      if (cleanupRefs.swapUndoTimer.current) clearTimeout(cleanupRefs.swapUndoTimer.current);
      if (cleanupRefs.deleteExerciseTimer.current) clearTimeout(cleanupRefs.deleteExerciseTimer.current);
      if (cleanupRefs.deleteCountdownInterval.current) clearInterval(cleanupRefs.deleteCountdownInterval.current);
    };
  }, []);

  const handleUpdate = useCallback(async (
    setId: string,
    field: "weight" | "reps",
    val: string
  ) => {
    let resolvedSet: SetWithMeta | undefined;
    setGroups((prev) => {
      for (const g of prev) {
        const s = g.sets.find((s) => s.id === setId);
        if (s) { resolvedSet = s; break; }
      }
      return prev;
    });
    if (!resolvedSet) return;

    const num = val === "" ? null : parseFloat(val);
    if (field === "weight") {
      updateGroupSet(setId, { weight: num });
      await updateSet(setId, num, resolvedSet.reps);
    } else {
      const rounded = num !== null ? Math.round(num) : null;
      updateGroupSet(setId, { reps: rounded });
      await updateSet(setId, resolvedSet.weight, rounded);
    }
  }, [updateGroupSet]);

  const handleCheck = useCallback(async (set: SetWithMeta) => {
    if (set.completed) {
      updateGroupSet(set.id, { completed: false, completed_at: null });
      await uncompleteSet(set.id);
    } else {
      const now = Date.now();
      updateGroupSet(set.id, { completed: true, completed_at: now });
      await completeSet(set.id);

      if (set.link_id) {
        const linked = groups.filter((g) => g.link_id === set.link_id);
        const idx = linked.findIndex((g) => g.exercise_id === set.exercise_id);
        const next = idx >= 0 && idx < linked.length - 1 ? linked[idx + 1] : null;

        if (next) {
          setNextHint(`Next: ${next.name}`);
          AccessibilityInfo.announceForAccessibility(`Next: ${next.name}`);
          if (hintTimer.current) clearTimeout(hintTimer.current);
          hintTimer.current = setTimeout(() => setNextHint(null), 1500);
        } else {
          setNextHint(null);
          const secs = await getRestSecondsForLink(id!, set.link_id);
          startRestWithDuration(secs);
        }
      } else {
        startRest(set.exercise_id);
      }
    }
  }, [updateGroupSet, groups, id, startRest, startRestWithDuration]);

  const handleAddSet = useCallback(async (exerciseId: string) => {
    const group = groups.find((g) => g.exercise_id === exerciseId);
    const num = (group?.sets.length ?? 0) + 1;
    const fallback = group?.is_voltra && group.training_modes.length > 1 ? group.training_modes[0] : null;
    const mode = modes[exerciseId] ?? fallback;
    const newSet = await addSet(id!, exerciseId, num, null, null, mode, null);
    setGroups((prev) =>
      prev.map((g) =>
        g.exercise_id === exerciseId
          ? { ...g, sets: [...g.sets, { ...newSet, previous: "-" }] }
          : g
      )
    );
  }, [id, groups, modes]);

  const handleModeChange = useCallback(async (exerciseId: string, mode: TrainingMode) => {
    setModes((prev) => ({ ...prev, [exerciseId]: mode }));
    const group = groups.find((g) => g.exercise_id === exerciseId);
    if (!group) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.exercise_id === exerciseId
          ? { ...g, sets: g.sets.map((s) => (s.completed ? s : { ...s, training_mode: mode })) }
          : g
      )
    );
    for (const set of group.sets) {
      if (!set.completed) {
        await updateSetTrainingMode(set.id, mode);
      }
    }
  }, [groups]);

  const handleRPE = useCallback(async (set: SetWithMeta, val: number) => {
    const next = set.rpe === val ? null : val;
    updateGroupSet(set.id, { rpe: next });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSetRPE(set.id, next);
  }, [updateGroupSet]);

  const handleHalfStep = useCallback(async (setId: string, val: number) => {
    updateGroupSet(setId, { rpe: val });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHalfStep(null);
    await updateSetRPE(setId, val);
  }, [updateGroupSet]);

  const handleDelete = useCallback(async (setId: string) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        sets: g.sets.filter((s) => s.id !== setId)
          .map((s, i) => ({ ...s, set_number: i + 1 })),
      })).filter((g) => g.sets.length > 0)
    );
    await deleteSet(setId);
  }, []);

  const handleHalfStepClear = useCallback(() => setHalfStep(null), []);
  const handleHalfStepOpen = useCallback((setId: string, base: number) => {
    setHalfStep({ setId, base });
  }, []);

  const handleExerciseNotes = useCallback(async (exerciseId: string, text: string) => {
    const group = groups.find((g) => g.exercise_id === exerciseId);
    if (!group || group.sets.length === 0) return;
    const firstSetId = group.sets[0].id;
    updateGroupSet(firstSetId, { notes: text });
    setExerciseNotesDraft((prev) => { const next = { ...prev }; delete next[exerciseId]; return next; });
    await updateSetNotes(firstSetId, text);
  }, [updateGroupSet, groups]);

  const handleExerciseNotesDraftChange = useCallback((exerciseId: string, text: string) => {
    setExerciseNotesDraft((prev) => ({ ...prev, [exerciseId]: text }));
  }, []);

  const toggleExerciseNotes = useCallback((exerciseId: string) => {
    setExerciseNotesOpen((prev) => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  }, []);

  const finish = () => {
    confirmAction(
      "Complete Workout?",
      `Duration: ${formatTime(elapsed)}`,
      async () => {
        await completeSession(id!);

        // Strava sync (non-blocking — never prevents workout completion)
        try {
          const { syncSessionToStrava } = await import("../../lib/strava");
          const synced = await syncSessionToStrava(id!);
          if (synced) {
            showToast("Synced to Strava ✓");
          }
        } catch {
          showError("Strava sync failed");
        }

        // Health Connect sync (non-blocking, silent — no toast on success or failure)
        if (Platform.OS === "android") {
          try {
            const { syncToHealthConnect } = await import("../../lib/health-connect");
            await syncToHealthConnect(id!);
          } catch {
            // HC sync is silent
          }
        }

        try {
          const dayId = await getSessionProgramDayId(id!);
          if (dayId) {
            const day = await getProgramDayById(dayId);
            if (day) {
              const result = await advanceProgram(day.program_id, dayId, id!);
              if (result.wrapped) {
                showToast(`Cycle ${result.cycle} complete!`);
                AccessibilityInfo.announceForAccessibility(
                  `Cycle ${result.cycle} complete! Program wrapping to day 1.`
                );
                await new Promise((r) => setTimeout(r, 1500));
              } else {
                AccessibilityInfo.announceForAccessibility(
                  "Workout complete. Program advanced to next day."
                );
              }
            }
          }
        } catch {
          // Program advance failed — session already saved
        }

        const allSets = await getSessionSets(id!);
        const done = allSets.filter((s) => s.completed);
        if (done.length === 0) {
          router.replace("/(tabs)");
        } else {
          router.replace(`/session/summary/${id}`);
        }
      },
      false
    );
  };

  const cancel = () => {
    confirmAction(
      "Discard Workout?",
      "All logged sets will be lost.",
      async () => {
        await cancelSession(id!);
        router.back();
      },
      true
    );
  };

  if (!session) {
    return (
      <>
        <Stack.Screen options={{ title: "Workout" }} />
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={{ color: colors.onSurfaceVariant }}>Loading...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: session.name,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text variant="body" style={{ color: colors.primary, marginRight: 8 }}>
                {formatTime(elapsed)}
              </Text>
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={100}>
      <FlashList
        data={groups}
        renderItem={({ item: group }) => (
          <ExerciseGroupCard
            group={group}
            step={step}
            unit={unit}
            suggestions={suggestions}
            modes={modes}
            exerciseNotesOpen={!!exerciseNotesOpen[group.exercise_id]}
            exerciseNotesDraft={exerciseNotesDraft[group.exercise_id]}
            halfStep={halfStep}
            linkIds={linkIds}
            groups={groups}
            palette={palette}
            onUpdate={handleUpdate}
            onCheck={handleCheck}
            onDelete={handleDelete}
            onAddSet={handleAddSet}
            onModeChange={handleModeChange}
            onRPE={handleRPE}
            onHalfStep={handleHalfStep}
            onHalfStepClear={handleHalfStepClear}
            onHalfStepOpen={handleHalfStepOpen}
            onExerciseNotes={handleExerciseNotes}
            onExerciseNotesDraftChange={handleExerciseNotesDraftChange}
            onToggleExerciseNotes={toggleExerciseNotes}
            onCycleSetType={handleCycleSetType}
            onLongPressSetType={handleLongPressSetType}
            onShowDetail={handleShowDetail}
            onSwap={handleSwapOpen}
            onDeleteExercise={handleDeleteExercise}
          />
        )}
        keyExtractor={(item) => item.exercise_id}
        contentContainerStyle={{ paddingHorizontal: layout.horizontalPadding, paddingVertical: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {rest > 0 && (
              <Reanimated.View
                style={[styles.restBanner, restFlashStyle]}
                accessibilityLiveRegion="polite"
              >
                <Text variant="heading" style={{ color: colors.onPrimaryContainer, fontWeight: "700" }} accessibilityLabel={`Rest timer: ${Math.floor(rest / 60)} minutes ${rest % 60} seconds`}>
                  {String(Math.floor(rest / 60)).padStart(2, "0")}:{String(rest % 60).padStart(2, "0")}
                </Text>
                <Text variant="caption" style={{ color: colors.onPrimaryContainer, marginTop: 4 }}>
                  Rest Timer
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={dismissRest}
                  textStyle={{ color: colors.onPrimaryContainer }}
                  style={{ marginTop: 4 }}
                  accessibilityLabel="Skip rest timer"
                  label="Skip"
                />
              </Reanimated.View>
            )}
            {nextHint && (
              <View style={[styles.nextBanner, { backgroundColor: colors.secondaryContainer }]} accessibilityLiveRegion="polite">
                <Text variant="subtitle" style={{ color: colors.onSecondaryContainer, fontWeight: "700" }}>
                  {nextHint}
                </Text>
              </View>
            )}
          </>
        }
        ListFooterComponent={
          <>
            <Button
              variant="outline"
              onPress={handleAddExercise}
              style={styles.addExercise}
              accessibilityLabel="Add exercise to workout"
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Add Exercise</Text>
              </View>
            </Button>
            <Button
              variant="default"
              onPress={finish}
              style={styles.finishBtn}
              accessibilityLabel="Finish workout"
              label="Finish Workout"
            />
            <Button
              variant="ghost"
              onPress={cancel}
              textStyle={{ color: colors.error }}
              style={styles.cancelBtn}
              accessibilityLabel="Cancel workout"
              label="Cancel Workout"
            />
          </>
        }
      />
      </KeyboardAvoidingView>
      {!!setTypeSheetSetId && (
        <SetTypeSheet
          setId={setTypeSheetSetId}
          groups={groups}
          onSelect={handleSelectSetType}
          onDismiss={() => setSetTypeSheetSetId(null)}
        />
      )}

      <ExercisePickerSheet
        visible={pickerOpen}
        onDismiss={() => setPickerOpen(false)}
        onPick={handlePickExercise}
      />
      <BottomSheet
        ref={detailSheetRef}
        index={-1}
        snapPoints={detailSnapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        onClose={() => setDetailExercise(null)}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
        )}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.onSurfaceVariant }}
      >
        {detailExercise && (
          <>
            <View style={styles.detailHeader}>
              <Text variant="title" style={{ color: colors.onSurface, flex: 1 }}>
                {detailExercise.name}
              </Text>
              <Pressable
                onPress={() => detailSheetRef.current?.close()}
                accessibilityLabel="Close exercise details"
                hitSlop={8}
                style={{ padding: 8 }}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
            <ExerciseDetailDrawerContent exercise={detailExercise} />
          </>
        )}
      </BottomSheet>
      <SubstitutionSheet
        sheetRef={swapSheetRef}
        sourceExercise={swapSource}
        allExercises={allExercises}
        onSelect={handleSwapSelect}
        onDismiss={() => setSwapSource(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  restBanner: {
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  nextBanner: {
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  addExercise: {
    marginTop: 8,
  },
  finishBtn: {
    marginTop: 24,
  },
  cancelBtn: {
    marginTop: 8,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
