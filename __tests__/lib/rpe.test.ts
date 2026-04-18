// Mock the theme constants for isolated unit testing
jest.mock("../../constants/theme", () => ({
  semantic: {
    protein: "#4caf50",
    carbs: "#ff9800",
    fat: "#f44336",
    beginner: "#4CAF50",
    intermediate: "#FF9800",
    advanced: "#F44336",
    onBeginner: "#ffffff",
    onIntermediate: "#000000",
    onAdvanced: "#ffffff",
  },
}));

import { rpeColor, rpeText } from "../../lib/rpe";

describe("rpe", () => {
  describe("rpeColor", () => {
    it("returns beginner color for RPE <= 7", () => {
      expect(rpeColor(5)).toBe("#4CAF50");
      expect(rpeColor(7)).toBe("#4CAF50");
    });

    it("returns intermediate color for RPE 7-8", () => {
      expect(rpeColor(7.5)).toBe("#FF9800");
      expect(rpeColor(8)).toBe("#FF9800");
    });

    it("returns advanced color for RPE > 8", () => {
      expect(rpeColor(8.5)).toBe("#F44336");
      expect(rpeColor(9)).toBe("#F44336");
      expect(rpeColor(10)).toBe("#F44336");
    });
  });

  describe("rpeText", () => {
    it("returns onBeginner for RPE <= 7", () => {
      expect(rpeText(6)).toBe("#ffffff");
      expect(rpeText(7)).toBe("#ffffff");
    });

    it("returns onIntermediate for RPE 7-8", () => {
      expect(rpeText(7.5)).toBe("#000000");
      expect(rpeText(8)).toBe("#000000");
    });

    it("returns onAdvanced for RPE > 8", () => {
      expect(rpeText(9)).toBe("#ffffff");
      expect(rpeText(10)).toBe("#ffffff");
    });
  });
});
