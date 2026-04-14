import { solve, perSide, kgToLb, lbToKg, summarize, KG_PLATES, LB_PLATES, color } from "../../lib/plates"

describe("plates", () => {
  describe("solve", () => {
    it("100kg target, 20kg bar → 25+15 per side", () => {
      const result = solve(perSide(100, 20), KG_PLATES)
      expect(result.plates).toEqual([25, 15])
      expect(result.remainder).toBe(0)
    })

    it("135lb target, 45lb bar → 1×45 per side", () => {
      const result = solve(perSide(135, 45), LB_PLATES)
      expect(result.plates).toEqual([45])
      expect(result.remainder).toBe(0)
    })

    it("300kg target, 20kg bar → 525 + 1×15 per side (unlimited)", () => {
      const result = solve(perSide(300, 20), KG_PLATES)
      expect(result.plates).toEqual([25, 25, 25, 25, 25, 15])
      expect(result.remainder).toBe(0)
    })

    it("67.5kg target, 20kg bar → 20+2.5+1.25 per side", () => {
      const side = perSide(67.5, 20)
      expect(side).toBe(23.75)
      const result = solve(side, KG_PLATES)
      expect(result.plates).toEqual([20, 2.5, 1.25])
      expect(result.remainder).toBe(0)
    })

    it("handles target equal to bar (0 per side)", () => {
      const result = solve(perSide(20, 20), KG_PLATES)
      expect(result.plates).toEqual([])
      expect(result.remainder).toBe(0)
    })

    it("handles very large weight 500kg, 20kg bar", () => {
      const result = solve(perSide(500, 20), KG_PLATES)
      expect(result.plates).toEqual([25, 25, 25, 25, 25, 25, 25, 25, 25, 15])
      expect(result.remainder).toBe(0)
    })

    it("handles decimal 72.5kg target, 20kg bar", () => {
      const side = perSide(72.5, 20)
      expect(side).toBe(26.25)
      const result = solve(side, KG_PLATES)
      expect(result.plates).toEqual([25, 1.25])
      expect(result.remainder).toBe(0)
    })

    it("returns remainder when exact match impossible", () => {
      const result = solve(0.3, KG_PLATES)
      expect(result.plates).toEqual([])
      expect(result.remainder).toBeCloseTo(0.3, 5)
    })

    it("handles 225lb target, 45lb bar → 55+35 per side", () => {
      const result = solve(perSide(225, 45), LB_PLATES)
      expect(result.plates).toEqual([55, 35])
      expect(result.remainder).toBe(0)
    })

    it("handles 315lb target, 45lb bar", () => {
      const result = solve(perSide(315, 45), LB_PLATES)
      expect(result.plates).toEqual([55, 55, 25])
      expect(result.remainder).toBe(0)
    })

    it("handles zero target", () => {
      const result = solve(0, KG_PLATES)
      expect(result.plates).toEqual([])
      expect(result.remainder).toBe(0)
    })
  })

  describe("perSide", () => {
    it("calculates per-side weight", () => {
      expect(perSide(100, 20)).toBe(40)
      expect(perSide(135, 45)).toBe(45)
      expect(perSide(20, 20)).toBe(0)
    })
  })

  describe("unit conversion", () => {
    it("converts kg to lb", () => {
      expect(kgToLb(100)).toBeCloseTo(220.5, 0)
    })

    it("converts lb to kg", () => {
      expect(lbToKg(225)).toBeCloseTo(102.1, 0)
    })

    it("round-trips approximately", () => {
      const original = 80
      const converted = lbToKg(kgToLb(original))
      expect(converted).toBeCloseTo(original, 0)
    })
  })

  describe("summarize", () => {
    it("groups plates by weight with counts", () => {
      const result = summarize([25, 25, 25, 25, 25, 15])
      expect(result).toEqual([
        { weight: 25, count: 5 },
        { weight: 15, count: 1 },
      ])
    })

    it("handles empty plates", () => {
      expect(summarize([])).toEqual([])
    })

    it("handles single plate", () => {
      expect(summarize([20])).toEqual([{ weight: 20, count: 1 }])
    })
  })

  describe("color", () => {
    it("returns IWF colors for kg plates", () => {
      expect(color(25, "kg").bg).toBe("#E53935")
      expect(color(20, "kg").bg).toBe("#1E88E5")
      expect(color(5, "kg").border).toBe("outline")
    })

    it("returns IWF colors for lb plates", () => {
      expect(color(55, "lb").bg).toBe("#E53935")
      expect(color(45, "lb").bg).toBe("#1E88E5")
    })

    it("returns fallback for unknown weight", () => {
      expect(color(99, "kg").bg).toBe("#757575")
    })
  })
})
