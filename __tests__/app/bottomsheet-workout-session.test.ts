import * as fs from "fs";
import * as path from "path";

/**
 * Structural tests for BLD-202: Replace Modal with BottomSheet in workout session.
 */

const src = [
  fs.readFileSync(path.resolve(__dirname, "../../app/session/[id].tsx"), "utf-8"),
  fs.readFileSync(path.resolve(__dirname, "../../components/session/ExerciseDetailDrawer.tsx"), "utf-8"),
  fs.readFileSync(path.resolve(__dirname, "../../hooks/useExerciseManagement.ts"), "utf-8"),
].join("\n");

describe("workout session exercise detail BottomSheet (BLD-202)", () => {
  it("imports BottomSheet from @gorhom/bottom-sheet", () => {
    expect(src).toMatch(
      /import\s+BottomSheet.*from\s+["']@gorhom\/bottom-sheet["']/
    );
  });

  it("imports BottomSheetFlatList from @gorhom/bottom-sheet", () => {
    expect(src).toContain("BottomSheetFlatList");
  });

  it("imports BottomSheetBackdrop from @gorhom/bottom-sheet", () => {
    expect(src).toContain("BottomSheetBackdrop");
  });

  it("does NOT import Modal from react-native", () => {
    expect(src).not.toMatch(/import\s*\{[^}]*Modal[^}]*\}\s*from\s*["']react-native["']/);
  });

  it("does NOT use <Modal component", () => {
    expect(src).not.toMatch(/<Modal[\s>]/);
  });

  it("creates a BottomSheet ref", () => {
    expect(src).toContain("useRef<BottomSheet>(null)");
  });

  it("defines snap points with 40% and 90%", () => {
    expect(src).toMatch(/["']40%["']/);
    expect(src).toMatch(/["']90%["']/);
  });

  it("uses enablePanDownToClose", () => {
    expect(src).toContain("enablePanDownToClose");
  });

  it("renders BottomSheetBackdrop with pressBehavior close", () => {
    expect(src).toContain('pressBehavior="close"');
  });

  it("uses BottomSheetFlatList for scrollable content", () => {
    expect(src).toMatch(/<BottomSheetFlatList/);
  });

  it("opens sheet via snapToIndex on detail show", () => {
    expect(src).toContain("snapToIndex(0)");
  });

  it("removes old detailOverlay style", () => {
    expect(src).not.toMatch(/detailOverlay\s*:/);
  });

  it("removes old detailDismiss style", () => {
    expect(src).not.toMatch(/detailDismiss\s*:/);
  });

  it("removes old detailSheet style with maxHeight 60%", () => {
    expect(src).not.toMatch(/detailSheet\s*:\s*\{[^}]*maxHeight/);
  });
});
