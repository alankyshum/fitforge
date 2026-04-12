export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "forearms"
  | "traps"
  | "lats"
  | "full_body";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "kettlebell"
  | "band"
  | "other";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Category =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "core"
  | "cardio"
  | "full_body";

export type Exercise = {
  id: string;
  name: string;
  category: Category;
  primary_muscles: MuscleGroup[];
  secondary_muscles: MuscleGroup[];
  equipment: Equipment;
  instructions: string;
  difficulty: Difficulty;
  is_custom: boolean;
};

export const CATEGORIES: Category[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "legs",
  "core",
  "cardio",
  "full_body",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  legs: "Legs",
  core: "Core",
  cardio: "Cardio",
  full_body: "Full Body",
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  exercises?: TemplateExercise[];
};

export type TemplateExercise = {
  id: string;
  template_id: string;
  exercise_id: string;
  position: number;
  target_sets: number;
  target_reps: string;
  rest_seconds: number;
  exercise?: Exercise;
};

export type WorkoutSession = {
  id: string;
  template_id: string | null;
  name: string;
  started_at: number;
  completed_at: number | null;
  duration_seconds: number | null;
  notes: string;
};

export type WorkoutSet = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  completed_at: number | null;
};
