import { useCallback, useEffect, useRef, useState } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { play as playAudio } from "../lib/audio";
import { getRestSecondsForExercise } from "../lib/db";
import { duration as durationTokens } from "../constants/design-tokens";

type UseRestTimerOptions = {
  sessionId: string | undefined;
  colors: { primaryContainer: string; primary: string };
};

export function useRestTimer({ sessionId, colors }: UseRestTimerOptions) {
  const [rest, setRest] = useState(0);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restFlash = useSharedValue(0);
  const restFlashStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      restFlash.value,
      [0, 1],
      [colors.primaryContainer, colors.primary],
    ),
  }));
  const restHapticTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prevRest = useRef(0);

  const startRest = useCallback(async (exerciseId: string) => {
    if (restRef.current) clearInterval(restRef.current);
    const secs = await getRestSecondsForExercise(sessionId!, exerciseId);
    setRest(secs);
    restRef.current = setInterval(() => {
      setRest((prev) => {
        if (prev <= 1) {
          if (restRef.current) clearInterval(restRef.current);
          restRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [sessionId]);

  const startRestWithDuration = useCallback((secs: number) => {
    if (restRef.current) clearInterval(restRef.current);
    setRest(secs);
    restRef.current = setInterval(() => {
      setRest((prev) => {
        if (prev <= 1) {
          if (restRef.current) clearInterval(restRef.current);
          restRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const dismissRest = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current);
    restRef.current = null;
    setRest(0);
  }, []);

  // Haptic + audio feedback on rest timer completion and countdown
  useEffect(() => {
    if (prevRest.current > 0 && rest === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const t1 = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 300);
      const t2 = setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }, 600);
      restHapticTimers.current = [t1, t2];

      playAudio("complete");

      // eslint-disable-next-line react-hooks/immutability
      restFlash.value = 1;
      // eslint-disable-next-line react-hooks/immutability
      restFlash.value = withTiming(0, { duration: durationTokens.slow });
    }

    if (rest > 0 && rest <= 3) {
      playAudio("tick");
    }

    prevRest.current = rest;
  }, [rest, restFlash]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restRef.current) clearInterval(restRef.current);
      for (const t of restHapticTimers.current) clearTimeout(t);
    };
  }, []);

  return {
    rest,
    restFlashStyle,
    startRest,
    startRestWithDuration,
    dismissRest,
    restRef,
  };
}
