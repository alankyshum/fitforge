import * as fs from "fs";
import * as path from "path";

/**
 * Structural tests for BLD-69: no nested <button> elements on web.
 *
 * After BNA UI migration, react-native-paper is fully removed.
 * Chip is now a BNA component that doesn't render as <button> on web.
 *
 * Verifies: Chip replaced with View+Text badges, Cards with interactive
 * children use Pressable instead of Card onPress.
 */

const src = fs.readFileSync(
  path.resolve(__dirname, "../../app/(tabs)/index.tsx"),
  "utf-8"
);

describe("Home screen — no nested buttons (BLD-69)", () => {
  it("does not import anything from react-native-paper", () => {
    const imports = src.match(/import\s*\{[^}]+\}\s*from\s*["']react-native-paper["']/s);
    expect(imports).toBeNull();
  });

  it("imports Pressable from react-native", () => {
    const imports = src.match(/import\s*\{[^}]+\}\s*from\s*["']react-native["']/s);
    expect(imports).toBeTruthy();
    expect(imports![0]).toContain("Pressable");
  });

  it("does not use Chip component anywhere", () => {
    const body = src.replace(/import\s*\{[^}]+\}\s*from\s*["'][^"']+["']/gs, "");
    expect(body).not.toMatch(/<Chip[\s>]/);
  });

  it("Cards with IconButton children do not have onPress", () => {
    const lines = src.split("\n");
    let depth = 0;
    let start = -1;
    let props = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/<Card\b/) && !line.match(/<Card\./)) {
        start = i;
        props = "";
        depth = 1;
      }
      if (start >= 0 && depth > 0) {
        props += line + "\n";
        const opens = (line.match(/<Card\b/g) || []).length;
        const closes = (line.match(/<\/Card>/g) || []).length;
        depth += opens - closes;
        if (i === start) depth -= opens - 1;

        if (depth <= 0) {
          if (props.includes("IconButton") || props.includes("Menu")) {
            const tag = props.match(/<Card\b[^>]*>/s);
            if (tag) {
              expect(tag[0]).not.toMatch(/onPress/);
            }
          }
          start = -1;
          props = "";
        }
      }
    }
  });

  it("uses badges prop instead of starterChip styles", () => {
    expect(src).toContain("badges");
    expect(src).not.toContain("styles.starterChip");
    expect(src).not.toContain("styles.starterChipText");
  });

  it("Pressable wrappers have accessibilityLabel", () => {
    const lines = src.split("\n");
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/<Pressable\b/)) {
        count++;
        let block = "";
        for (let j = i; j < Math.min(i + 15, lines.length); j++) {
          block += lines[j] + "\n";
          if (lines[j].trim() === ">" || lines[j].match(/\w>\s*$/)) break;
        }
        expect(block).toContain("accessibilityLabel");
      }
    }
    expect(count).toBeGreaterThan(0);
  });
});
