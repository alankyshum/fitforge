import * as fs from "fs";
import * as path from "path";

const root = path.resolve(__dirname, "../../..");
const importStrongPath = path.join(root, "app/settings/import-strong.tsx");
const importStrongSource = fs.readFileSync(importStrongPath, "utf-8");

// Import step components for structural assertions
const importComponentsDir = path.join(root, "components/import");
const allImportSource = fs.readdirSync(importComponentsDir)
  .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
  .map((f) => fs.readFileSync(path.join(importComponentsDir, f), "utf-8"))
  .join("\n") + "\n" + importStrongSource;

describe("Import Strong wizard screen structure", () => {
  it("should exist as a file", () => {
    expect(fs.existsSync(importStrongPath)).toBe(true);
  });

  it("should export a default component", () => {
    expect(importStrongSource).toMatch(/export default function/);
  });

  it("should implement a multi-step wizard", () => {
    expect(importStrongSource).toContain("step === 1");
    expect(importStrongSource).toContain("step === 2");
    expect(importStrongSource).toContain("step === 3");
    expect(importStrongSource).toContain("step === 4");
  });

  it("should use FlatList instead of ScrollView+map for list rendering in JSX", () => {
    const jsxMapPattern = /\.map\(\([^)]*\)\s*=>\s*\(\s*</g;
    const matches = allImportSource.match(jsxMapPattern) || [];
    expect(matches.length).toBe(0);
  });

  it("should have accessibility labels on all buttons", () => {
    const buttonCount = (allImportSource.match(/<Button\b/g) || []).length;
    const labelCount = (allImportSource.match(/accessibilityLabel=/g) || []).length;
    expect(labelCount).toBeGreaterThanOrEqual(buttonCount);
  });

  it("should have accessibility roles on interactive elements", () => {
    const buttonCount = (allImportSource.match(/<Button\b/g) || []).length;
    const roleCount = (allImportSource.match(/accessibilityRole="button"/g) || []).length;
    expect(roleCount).toBeGreaterThanOrEqual(buttonCount);
  });

  it("should handle file selection via document picker", () => {
    expect(allImportSource).toContain("getDocumentAsync");
  });

  it("should support unit conversion (kg/lb)", () => {
    expect(allImportSource).toContain("sourceUnit");
    expect(allImportSource).toContain("targetUnit");
    expect(allImportSource).toContain("convertWeight");
  });

  it("should check for duplicate sessions", () => {
    expect(allImportSource).toContain("duplicates");
    expect(allImportSource).toContain("Potential Duplicates");
  });

  it("should show import progress", () => {
    expect(allImportSource).toContain("Progress");
    expect(allImportSource).toContain("progress");
  });

  it("should wrap import in a database transaction", () => {
    expect(allImportSource).toContain("withTransactionAsync");
  });

  it("should use useEffect (not useState) for side effects", () => {
    expect(allImportSource).toContain("useEffect");
    expect(allImportSource).not.toMatch(/useState\s*\(\s*\(\s*\)\s*=>/);
  });
});
