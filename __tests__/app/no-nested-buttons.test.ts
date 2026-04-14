import * as fs from "fs";
import * as path from "path";

/**
 * Project-wide structural test: no nested <button> elements on web.
 *
 * react-native-paper's TouchableRipple renders as <button> on web.
 * Paper's Chip also renders as <button> even without onPress.
 * Nesting these causes HTML validation errors and React hydration failures.
 *
 * This test scans ALL screen and component files to catch violations
 * before they reach production. It supersedes the home-only BLD-69 test.
 */

const APP_DIR = path.resolve(__dirname, "../../app");
const COMPONENTS_DIR = path.resolve(__dirname, "../../components");

function collectTsxFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsxFiles(full));
    } else if (entry.name.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

const allFiles = [...collectTsxFiles(APP_DIR), ...collectTsxFiles(COMPONENTS_DIR)];

describe("No nested <button> elements on web (project-wide)", () => {
  const filesWithTouchableRipple: { file: string; src: string }[] = [];

  for (const file of allFiles) {
    const src = fs.readFileSync(file, "utf-8");
    if (src.includes("TouchableRipple")) {
      filesWithTouchableRipple.push({ file, src });
    }
  }

  if (filesWithTouchableRipple.length > 0) {
    describe.each(filesWithTouchableRipple)(
      "TouchableRipple usage in $file",
      ({ file, src }) => {
        const relPath = path.relative(path.resolve(__dirname, "../.."), file);

        it(`${relPath}: TouchableRipple must not contain Chip, Button, IconButton, or FAB children`, () => {
          const lines = src.split("\n");
          let depth = 0;
          let start = -1;
          let block = "";

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/<TouchableRipple\b/)) {
              start = i;
              block = "";
              depth = 1;
            }
            if (start >= 0 && depth > 0) {
              block += line + "\n";
              depth += (line.match(/<TouchableRipple\b/g) || []).length;
              depth -= (line.match(/<\/TouchableRipple>/g) || []).length;
              if (i === start) depth -= (line.match(/<TouchableRipple\b/g) || []).length - 1;

              if (depth <= 0) {
                const innerContent = block
                  .replace(/<TouchableRipple\b[^>]*>/, "")
                  .replace(/<\/TouchableRipple>/, "");

                const nestedButtons = innerContent.match(
                  /<(Chip|Button|IconButton|FAB|TouchableRipple)\b/g
                );
                expect(nestedButtons).toBeNull();
                start = -1;
                block = "";
              }
            }
          }
        });
      }
    );
  }

  describe("Pressable wrappers with interactive children", () => {
    for (const file of allFiles) {
      const src = fs.readFileSync(file, "utf-8");
      const relPath = path.relative(path.resolve(__dirname, "../.."), file);

      if (!src.includes("<Pressable")) continue;

      it(`${relPath}: Pressable elements have accessibilityRole`, () => {
        const lines = src.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].match(/<Pressable\b/) && lines[i].includes("onPress")) {
            let tag = "";
            for (let j = i; j < Math.min(i + 20, lines.length); j++) {
              tag += lines[j] + "\n";
              if (lines[j].includes(">")) break;
            }
            expect(tag).toContain("accessibilityRole");
          }
        }
      });
    }
  });

  it("no screen file imports TouchableRipple with Chip in the same file", () => {
    const violations: string[] = [];

    for (const file of allFiles) {
      const src = fs.readFileSync(file, "utf-8");
      const relPath = path.relative(path.resolve(__dirname, "../.."), file);

      const importsTR = /TouchableRipple/.test(src);
      const importsChip = /<Chip[\s\n>]/.test(src);

      if (importsTR && importsChip) {
        const lines = src.split("\n");
        let inTR = false;
        let trDepth = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.match(/<TouchableRipple\b/)) {
            inTR = true;
            trDepth = 1;
          }
          if (inTR) {
            trDepth += (line.match(/<TouchableRipple\b/g) || []).length;
            trDepth -= (line.match(/<\/TouchableRipple>/g) || []).length;
            if (i === lines.indexOf(line) && line.match(/<TouchableRipple\b/)) {
              trDepth -= (line.match(/<TouchableRipple\b/g) || []).length - 1;
            }

            if (line.match(/<Chip\b/)) {
              violations.push(`${relPath}:${i + 1} — Chip nested inside TouchableRipple`);
            }

            if (trDepth <= 0) {
              inTR = false;
            }
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
