/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { useToast } from "@/components/ui/bna-toast";
import {
  updateSetType,
  getAppSetting,
  setAppSetting,
} from "../lib/db";
import { SET_TYPE_CYCLE } from "../lib/types";
import type { SetType } from "../lib/types";
import type { ExerciseGroup, SetWithMeta } from "../components/session/types";

type UseSetTypeActionsArgs = {
  groups: ExerciseGroup[];
  setGroups: React.Dispatch<React.SetStateAction<ExerciseGroup[]>>;
  maxes: Record<string, number>;
};

export function useSetTypeActions({ groups, setGroups, maxes }: UseSetTypeActionsArgs) {
  const { info: showToast } = useToast();
  const [setTypeSheetSetId, setSetTypeSheetSetId] = useState<string | null>(null);
  const prHapticFired = useRef<Set<string>>(new Set());

  const handleCycleSetType = useCallback(async (setId: string) => {
    let newType = "normal" as SetType;
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        sets: g.sets.map((s) => {
          if (s.id === setId) {
            const idx = SET_TYPE_CYCLE.indexOf(s.set_type);
            newType = SET_TYPE_CYCLE[(idx + 1) % SET_TYPE_CYCLE.length];
            return { ...s, set_type: newType, is_warmup: newType === "warmup" };
          }
          return s;
        }),
      }))
    );
    await updateSetType(setId, newType);
    Haptics.selectionAsync();

    if (newType === "dropset" || newType === "failure") {
      const shown = await getAppSetting("set_type_tooltip_shown");
      if (!shown) {
        showToast("Dropsets count toward volume. Failure sets help track intensity.");
        await setAppSetting("set_type_tooltip_shown", "1");
      }
    }
    if (newType === "warmup") {
      const shown = await getAppSetting("warmup_tooltip_shown");
      if (!shown) {
        showToast("Set marked as warm-up. Warm-up sets are excluded from volume and PR tracking.");
        await setAppSetting("warmup_tooltip_shown", "1");
      }
    }
  }, []);

  const handleLongPressSetType = useCallback((setId: string) => {
    Haptics.selectionAsync();
    setSetTypeSheetSetId(setId);
  }, []);

  const handleSelectSetType = useCallback(async (type: SetType) => {
    const setId = setTypeSheetSetId;
    if (!setId) return;
    setSetTypeSheetSetId(null);
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        sets: g.sets.map((s) => {
          if (s.id === setId) {
            return { ...s, set_type: type, is_warmup: type === "warmup" };
          }
          return s;
        }),
      }))
    );
    await updateSetType(setId, type);
    Haptics.selectionAsync();
  }, [setTypeSheetSetId]);

  // PR detection with haptic feedback
  const isPR = (set: SetWithMeta) => {
    if (!set.completed || !set.weight || set.weight <= 0) return false;
    const max = maxes[set.exercise_id];
    if (max === undefined) return false;
    return set.weight > max;
  };

  useEffect(() => {
    for (const g of groups) {
      for (const s of g.sets) {
        if (isPR(s) && !prHapticFired.current.has(s.id)) {
          prHapticFired.current.add(s.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        if (!isPR(s) && prHapticFired.current.has(s.id)) {
          prHapticFired.current.delete(s.id);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, maxes]);

  return {
    setTypeSheetSetId,
    setSetTypeSheetSetId,
    handleCycleSetType,
    handleLongPressSetType,
    handleSelectSetType,
  };
}
