/* eslint-disable max-lines-per-function, complexity */
import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import TrainingModeSelector from "../../components/TrainingModeSelector";
import { useLayout } from "../../lib/layout";
import { useThemeColors } from "@/hooks/useThemeColors";
import { SetRow } from "./SetRow";
import type { SetWithMeta, ExerciseGroup } from "./types";
import type { TrainingMode } from "../../lib/types";
import type { Suggestion } from "../../lib/rm";

export type GroupCardProps = {
  group: ExerciseGroup;
  step: number;
  unit: "kg" | "lb";
  suggestions: Record<string, Suggestion | null>;
  modes: Record<string, TrainingMode>;
  exerciseNotesOpen: boolean;
  exerciseNotesDraft: string | undefined;
  halfStep: { setId: string; base: number } | null;
  linkIds: string[];
  groups: ExerciseGroup[];
  palette: string[];
  onUpdate: (setId: string, field: "weight" | "reps", val: string) => void;
  onCheck: (set: SetWithMeta) => void;
  onDelete: (setId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onModeChange: (exerciseId: string, mode: TrainingMode) => void;
  onRPE: (set: SetWithMeta, val: number) => void;
  onHalfStep: (setId: string, val: number) => void;
  onHalfStepClear: () => void;
  onHalfStepOpen: (setId: string, base: number) => void;
  onExerciseNotes: (exerciseId: string, text: string) => void;
  onExerciseNotesDraftChange: (exerciseId: string, text: string) => void;
  onToggleExerciseNotes: (exerciseId: string) => void;
  onCycleSetType: (setId: string) => void;
  onLongPressSetType: (setId: string) => void;
  onShowDetail: (exerciseId: string) => void;
  onSwap: (exerciseId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
};

export const ExerciseGroupCard = memo(function ExerciseGroupCard({
  group, step, unit, suggestions, modes,
  exerciseNotesOpen, exerciseNotesDraft, halfStep, linkIds, groups, palette,
  onUpdate, onCheck, onDelete, onAddSet, onModeChange,
  onRPE, onHalfStep, onHalfStepClear,
  onHalfStepOpen, onExerciseNotes, onExerciseNotesDraftChange, onToggleExerciseNotes, onCycleSetType, onLongPressSetType,
  onShowDetail, onSwap, onDeleteExercise,
}: GroupCardProps) {
  const colors = useThemeColors();
  const layout = useLayout();

  const linked = group.link_id ? groups.filter((g) => g.link_id === group.link_id) : [];
  const linkIdx = group.link_id ? linked.findIndex((g) => g.exercise_id === group.exercise_id) : -1;
  const isFirstInLink = linkIdx === 0;
  const totalRounds = group.link_id ? Math.max(...linked.map((g) => g.sets.length)) : 0;
  const completedRounds = group.link_id
    ? Math.min(...linked.map((g) => g.sets.filter((s) => s.completed).length))
    : 0;
  const groupColorIdx = group.link_id ? linkIds.indexOf(group.link_id) : -1;
  const groupColor = groupColorIdx >= 0 ? palette[groupColorIdx % palette.length] : undefined;

  const suggestion = suggestions[group.exercise_id];

  const firstSet = group.sets[0];
  const exerciseNotesValue = exerciseNotesDraft ?? firstSet?.notes ?? "";

  const suggestionChip = suggestion && (() => {
    const s = suggestion;
    const isIncrease = s.type === "increase" || s.type === "rep_increase";
    const label = s.type === "rep_increase"
      ? `${s.reps} reps ▲`
      : s.type === "increase"
        ? `${s.weight} ▲`
        : `${s.weight} =`;
    const hint = s.type === "rep_increase"
      ? `Suggested reps: ${s.reps}, ${s.reason}`
      : s.type === "increase"
        ? `Suggested weight: ${s.weight}, increase by ${step}`
        : `Suggested weight: ${s.weight}, maintain`;
    return (
      <Pressable
        onPress={() => {
          if (s.type === "rep_increase") {
            for (const set of group.sets) {
              if (!set.completed && (set.reps == null || set.reps === 0)) {
                onUpdate(set.id, "reps", String(s.reps));
              }
            }
          } else {
            for (const set of group.sets) {
              if (!set.completed && (set.weight == null || set.weight === 0)) {
                onUpdate(set.id, "weight", String(s.weight));
              }
            }
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={[
          styles.suggestionChip,
          { backgroundColor: isIncrease ? colors.primaryContainer : colors.surfaceVariant },
        ]}
        accessibilityRole="button"
        accessibilityLabel={hint}
        accessibilityHint={s.type === "rep_increase" ? "Double tap to fill suggested reps" : "Double tap to fill suggested weight"}
      >
        <Text
          variant="caption"
          style={{
            color: isIncrease ? colors.onPrimaryContainer : colors.onSurfaceVariant,
            fontWeight: "600",
          }}
        >
          Suggested: {label}
        </Text>
      </Pressable>
    );
  })();

  const exerciseInfo = (
    <>
      {layout.compact ? (
        <View style={styles.groupHeaderCompactWrap}>
          <View style={styles.groupHeaderCompactRow}>
            <Pressable
              onLongPress={() => onDeleteExercise(group.exercise_id)}
              delayLongPress={500}
              style={{ flex: 1 }}
              accessibilityLabel={`Remove ${group.name}`}
              accessibilityRole="button"
              accessibilityHint="Long press to remove exercise"
            >
              <Text
                variant="title"
                numberOfLines={2}
                ellipsizeMode="tail"
                style={[styles.groupTitle, { color: colors.primary }]}
              >
                {group.name}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSwap(group.exercise_id)}
              accessibilityLabel={`Swap ${group.name} for alternative`}
              hitSlop={8}
              style={[styles.swapBtn, { padding: 8 }]}
            >
              <MaterialCommunityIcons name="swap-horizontal" size={24} color={colors.onSurfaceVariant} />
            </Pressable>
            <Pressable
              onPress={() => onToggleExerciseNotes(group.exercise_id)}
              accessibilityLabel={`${group.name} notes`}
              hitSlop={8}
              style={[styles.notesBtn, { padding: 8 }]}
            >
              <MaterialCommunityIcons name={firstSet?.notes ? "note-text" : "note-text-outline"} size={24} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
          <View style={styles.groupHeaderCompactRow}>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onShowDetail(group.exercise_id)}
              accessibilityLabel={`View ${group.name} details`}
              style={styles.detailsBtn}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Details</Text>
              </View>
            </Button>
            {group.is_voltra && group.training_modes.length > 1 && (
              <TrainingModeSelector
                modes={group.training_modes}
                selected={modes[group.exercise_id] ?? group.training_modes[0]}
                exercise={group.name}
                onSelect={(m) => onModeChange(group.exercise_id, m)}
                compact
              />
            )}
          </View>
        </View>
      ) : (
        <View style={styles.groupHeader}>
          <Pressable
            onLongPress={() => onDeleteExercise(group.exercise_id)}
            delayLongPress={500}
            style={{ flex: 1 }}
            accessibilityLabel={`Remove ${group.name}`}
            accessibilityRole="button"
            accessibilityHint="Long press to remove exercise"
          >
            <Text
              variant="title"
              numberOfLines={2}
              ellipsizeMode="tail"
              style={[styles.groupTitle, { color: colors.primary }]}
            >
              {group.name}
            </Text>
          </Pressable>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => onShowDetail(group.exercise_id)}
            accessibilityLabel={`View ${group.name} details`}
            style={styles.detailsBtn}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Details</Text>
            </View>
          </Button>
          <Pressable
            onPress={() => onSwap(group.exercise_id)}
            accessibilityLabel={`Swap ${group.name} for alternative`}
            hitSlop={8}
            style={[styles.swapBtn, { padding: 8 }]}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={24} color={colors.onSurfaceVariant} />
          </Pressable>
          <Pressable
            onPress={() => onToggleExerciseNotes(group.exercise_id)}
            accessibilityLabel={`${group.name} notes`}
            hitSlop={8}
            style={[styles.notesBtn, { padding: 8 }]}
          >
            <MaterialCommunityIcons name={firstSet?.notes ? "note-text" : "note-text-outline"} size={24} color={colors.onSurfaceVariant} />
          </Pressable>
          {group.is_voltra && group.training_modes.length > 1 && (
            <TrainingModeSelector
              modes={group.training_modes}
              selected={modes[group.exercise_id] ?? group.training_modes[0]}
              exercise={group.name}
              onSelect={(m) => onModeChange(group.exercise_id, m)}
              compact
            />
          )}
        </View>
      )}
      {exerciseNotesOpen && (
        <View style={styles.notesContainer}>
          <Input
            placeholder="Add exercise notes..."
            value={exerciseNotesValue}
            onChangeText={(v) => onExerciseNotesDraftChange(group.exercise_id, v)}
            onBlur={() => onExerciseNotes(group.exercise_id, exerciseNotesValue)}
            maxLength={200}
            multiline
            style={styles.notesInput}
            accessibilityLabel="Exercise notes"
          />
          <Text variant="caption" style={{ color: colors.onSurfaceVariant, textAlign: "right", fontSize: 12 }}>
            {exerciseNotesValue.length}/200
          </Text>
        </View>
      )}
    </>
  );

  const setTable = (
    <>
      <View style={styles.headerRow}>
        <Text variant="caption" style={[styles.colSet, { color: colors.onSurfaceVariant }]}>SET</Text>
        <Text variant="caption" style={[styles.colPrev, { color: colors.onSurfaceVariant }]}>PREV</Text>
        <Text variant="caption" style={[styles.colLabel, { color: colors.onSurfaceVariant }]}>{unit === "lb" ? "LB" : "KG"}</Text>
        <Text variant="caption" style={[styles.colLabel, { color: colors.onSurfaceVariant }]}>REPS</Text>
        <View style={styles.colTrailing} />
      </View>
      {group.sets.map((set) => (
        <SetRow
          key={set.id}
          set={set}
          step={step}
          unit={unit}
          halfStep={halfStep}
          onUpdate={onUpdate}
          onCheck={onCheck}
          onDelete={onDelete}
          onRPE={onRPE}
          onHalfStep={onHalfStep}
          onHalfStepClear={onHalfStepClear}
          onHalfStepOpen={onHalfStepOpen}
          onCycleSetType={onCycleSetType}
          onLongPressSetType={onLongPressSetType}
        />
      ))}
      <Button
        variant="ghost"
        size="sm"
        onPress={() => onAddSet(group.exercise_id)}
        style={styles.addSetBtn}
        accessibilityLabel={`Add set to ${group.name}`}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "600" }}>Add Set</Text>
        </View>
      </Button>
    </>
  );

  return (
    <View style={styles.group}>
      {isFirstInLink && group.link_id && (
        <View
          style={[styles.linkGroupHeader, { borderLeftColor: groupColor, borderLeftWidth: 4 }]}
          accessibilityRole="header"
          accessibilityLabel={`Round ${completedRounds + 1} of ${totalRounds}`}
        >
          <Text variant="caption" style={{ color: groupColor, fontWeight: "700" }}>
            {linked.length >= 3 ? "Circuit" : "Superset"} — Round {completedRounds + 1}/{totalRounds}
          </Text>
          <Text variant="caption" style={{ color: colors.onSurfaceVariant, marginLeft: 8 }}>
            Rest after round
          </Text>
        </View>
      )}

      <View style={group.link_id ? { borderLeftWidth: 4, borderLeftColor: groupColor, paddingLeft: 8 } : undefined}>
        {exerciseInfo}
        {layout.atLeastMedium ? (
          <View style={styles.groupWideRow}>
            {suggestionChip && (
              <View style={styles.groupInfoCol}>
                {suggestionChip}
              </View>
            )}
            <View style={suggestionChip ? styles.groupSetsCol : { flex: 1 }}>
              {setTable}
            </View>
          </View>
        ) : (
          <>
            {suggestionChip}
            {setTable}
          </>
        )}
      </View>
      <Separator style={styles.divider} />
    </View>
  );
});

const styles = StyleSheet.create({
  group: {
    marginBottom: 8,
  },
  groupWideRow: {
    flexDirection: "row",
    gap: 16,
  },
  groupInfoCol: {
    flex: 2,
    minWidth: 160,
  },
  groupSetsCol: {
    flex: 3,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  groupTitle: {
    fontWeight: "700",
    flex: 1,
    minWidth: 80,
  },
  groupHeaderCompactWrap: {
    gap: 4,
    marginBottom: 8,
  },
  groupHeaderCompactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    minHeight: 28,
  },
  colSet: {
    width: 36,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  colPrev: {
    width: 64,
    textAlign: "center",
  },
  colLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    marginHorizontal: 12,
  },
  colTrailing: {
    width: 72,
  },
  addSetBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  swapBtn: {
    width: 56,
    height: 56,
    margin: 0,
  },
  notesBtn: {
    width: 56,
    height: 56,
    margin: 0,
  },
  detailsBtn: {
    marginLeft: -12,
    marginRight: -8,
  },
  divider: {
    marginTop: 8,
    marginBottom: 12,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginLeft: 4,
    marginBottom: 6,
    minHeight: 48,
    justifyContent: "center",
  },
  notesContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 4,
  },
  notesInput: {
    fontSize: 14,
    minHeight: 48,
  },
  linkGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 4,
    borderRadius: 4,
  },
});
