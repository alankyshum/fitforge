import { searchFoods, getBuiltinFoods, getCategories } from "../../lib/foods";

describe("foods", () => {
  describe("getBuiltinFoods", () => {
    it("returns an array of foods", () => {
      const foods = getBuiltinFoods();
      expect(Array.isArray(foods)).toBe(true);
      expect(foods.length).toBeGreaterThan(0);
    });

    it("each food has required fields", () => {
      const foods = getBuiltinFoods();
      for (const food of foods.slice(0, 5)) {
        expect(food.id).toBeDefined();
        expect(food.name).toBeDefined();
        expect(food.category).toBeDefined();
        expect(typeof food.calories).toBe("number");
        expect(typeof food.protein).toBe("number");
        expect(typeof food.carbs).toBe("number");
        expect(typeof food.fat).toBe("number");
        expect(food.serving).toBeDefined();
      }
    });

    it("all food IDs are unique", () => {
      const foods = getBuiltinFoods();
      const ids = foods.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("searchFoods", () => {
    it("returns all foods with empty query and no category", () => {
      const all = getBuiltinFoods();
      const result = searchFoods("");
      expect(result.length).toBe(all.length);
    });

    it("filters by query string (case insensitive)", () => {
      const result = searchFoods("chicken");
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((f) => f.name.toLowerCase().includes("chicken"))).toBe(true);
    });

    it("filters by category", () => {
      const result = searchFoods("", "protein");
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((f) => f.category === "protein")).toBe(true);
    });

    it("filters by both query and category", () => {
      const result = searchFoods("chicken", "protein");
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((f) => f.category === "protein" && f.name.toLowerCase().includes("chicken"))).toBe(true);
    });

    it("returns empty for no matches", () => {
      const result = searchFoods("zzzznonexistent");
      expect(result).toHaveLength(0);
    });

    it("handles whitespace in query", () => {
      const result = searchFoods("  chicken  ");
      expect(result.length).toBeGreaterThan(0);
    });

    it("null category is treated as no filter", () => {
      const all = searchFoods("chicken");
      const same = searchFoods("chicken", null);
      expect(all.length).toBe(same.length);
    });
  });

  describe("getCategories", () => {
    it("returns array of categories", () => {
      const cats = getCategories();
      expect(Array.isArray(cats)).toBe(true);
      expect(cats.length).toBeGreaterThan(0);
    });

    it("each category has id and label", () => {
      const cats = getCategories();
      for (const cat of cats) {
        expect(cat.id).toBeDefined();
        expect(cat.label).toBeDefined();
      }
    });

    it("includes expected categories", () => {
      const cats = getCategories();
      const ids = cats.map((c) => c.id);
      expect(ids).toContain("protein");
      expect(ids).toContain("grains");
      expect(ids).toContain("dairy");
    });
  });
});
