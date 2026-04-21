interface ColorPair {
  bg: string;
  text: string;
}

interface PaletteEntry {
  light: ColorPair;
  dark: ColorPair;
}

const palette: PaletteEntry[] = [
  { light: { bg: "#dbeafe", text: "#1e40af" }, dark: { bg: "#1e3a5f", text: "#93c5fd" } }, // blue
  { light: { bg: "#fce7f3", text: "#9d174d" }, dark: { bg: "#4a1942", text: "#f9a8d4" } }, // pink
  { light: { bg: "#d1fae5", text: "#065f46" }, dark: { bg: "#064e3b", text: "#6ee7b7" } }, // green
  { light: { bg: "#fef3c7", text: "#92400e" }, dark: { bg: "#78350f", text: "#fcd34d" } }, // amber
  { light: { bg: "#ede9fe", text: "#5b21b6" }, dark: { bg: "#3b0764", text: "#c4b5fd" } }, // violet
  { light: { bg: "#ffedd5", text: "#9a3412" }, dark: { bg: "#7c2d12", text: "#fdba74" } }, // orange
  { light: { bg: "#e0e7ff", text: "#3730a3" }, dark: { bg: "#312e81", text: "#a5b4fc" } }, // indigo
  { light: { bg: "#f0fdfa", text: "#115e59" }, dark: { bg: "#134e4a", text: "#5eead4" } }, // teal
];

export function getDepartmentColor(departmentId: number, explicitColor?: string | null): string {
  if (explicitColor) return explicitColor;
  return palette[departmentId % palette.length]!.light.bg;
}

export function getResolvedColors(
  departmentId: number,
  explicitColor?: string | null,
  isDark = false,
): ColorPair {
  if (explicitColor) {
    // For explicit colors, use white text on dark backgrounds, dark text on light
    return { bg: explicitColor, text: isDark ? "#ffffff" : "#1f2937" };
  }
  const entry = palette[departmentId % palette.length]!;
  return isDark ? entry.dark : entry.light;
}

export { palette };
export type { ColorPair, PaletteEntry };
