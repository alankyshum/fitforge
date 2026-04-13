import {
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme,
} from "react-native-paper";
import {
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";

const base = {
  primary: "#4CAF50",
  secondary: "#388E3C",
  tertiary: "#81C784",
};

const lightColors = {
  ...base,
  primaryContainer: "#C8E6C9",
  secondaryContainer: "#A5D6A7",
  tertiaryContainer: "#E8F5E9",
  onPrimaryContainer: "#1B5E20",
  onSecondaryContainer: "#1B5E20",
  onTertiaryContainer: "#1B5E20",
};

const darkColors = {
  ...base,
  primaryContainer: "#1B5E20",
  secondaryContainer: "#2E7D32",
  tertiaryContainer: "#1B3A1D",
  onPrimaryContainer: "#C8E6C9",
  onSecondaryContainer: "#A5D6A7",
  onTertiaryContainer: "#C8E6C9",
};

// Competition plate colors (light/dark aware, WCAG contrast)
export const plateColors = {
  light: {
    25: { bg: "#D32F2F", text: "#FFFFFF" },    // red
    20: { bg: "#1565C0", text: "#FFFFFF" },    // blue
    15: { bg: "#F9A825", text: "#000000" },    // yellow
    10: { bg: "#2E7D32", text: "#FFFFFF" },    // green
    5:  { bg: "#757575", text: "#FFFFFF" },    // white/grey
    2.5: { bg: "#37474F", text: "#FFFFFF" },   // dark
    1.25: { bg: "#9E9E9E", text: "#000000" },  // silver
    55: { bg: "#D32F2F", text: "#FFFFFF" },    // red (lb)
    45: { bg: "#1565C0", text: "#FFFFFF" },    // blue (lb)
    35: { bg: "#F9A825", text: "#000000" },    // yellow (lb)
  } as Record<number, { bg: string; text: string }>,
  dark: {
    25: { bg: "#EF5350", text: "#000000" },
    20: { bg: "#42A5F5", text: "#000000" },
    15: { bg: "#FFD54F", text: "#000000" },
    10: { bg: "#66BB6A", text: "#000000" },
    5:  { bg: "#BDBDBD", text: "#000000" },
    2.5: { bg: "#78909C", text: "#FFFFFF" },
    1.25: { bg: "#E0E0E0", text: "#000000" },
    55: { bg: "#EF5350", text: "#000000" },
    45: { bg: "#42A5F5", text: "#000000" },
    35: { bg: "#FFD54F", text: "#000000" },
  } as Record<number, { bg: string; text: string }>,
};

export function plateColor(weight: number, isDark: boolean): { bg: string; text: string } {
  const palette = isDark ? plateColors.dark : plateColors.light;
  return palette[weight] || (isDark
    ? { bg: "#616161", text: "#FFFFFF" }
    : { bg: "#424242", text: "#FFFFFF" });
}

// Custom semantic colors for domain-specific indicators
export const semantic = {
  protein: "#4caf50",
  carbs: "#ff9800",
  fat: "#f44336",
  beginner: "#4CAF50",
  intermediate: "#FF9800",
  advanced: "#F44336",
  onBeginner: "#ffffff",
  onIntermediate: "#000000",
  onAdvanced: "#ffffff",
};

export function difficultyText(level: string): string {
  if (level === "intermediate") return semantic.onIntermediate;
  if (level === "advanced") return semantic.onAdvanced;
  return semantic.onBeginner;
}

export const light = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
};

export const dark = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
    surface: "#121212",
    background: "#121212",
  },
};

const { LightTheme: navLight, DarkTheme: navDark } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
  materialLight: light,
  materialDark: dark,
});

export const navigationLight = navLight;
export const navigationDark = navDark;
