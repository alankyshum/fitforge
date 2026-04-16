import * as fs from "fs";
import * as path from "path";

const sessionSrc = fs.readFileSync(
  path.resolve(__dirname, "../../app/session/[id].tsx"),
  "utf-8"
);

describe("Workout session exercise header overflow fix (BLD-203)", () => {
  it("groupHeader uses flexWrap: wrap", () => {
    expect(sessionSrc).toContain('flexWrap: "wrap"');
    const headerMatch = sessionSrc.match(/groupHeader:\s*\{[^}]+\}/s);
    expect(headerMatch).not.toBeNull();
    expect(headerMatch![0]).toContain('flexWrap: "wrap"');
  });

  it("groupTitle has minWidth to prevent overflow", () => {
    const titleMatch = sessionSrc.match(/groupTitle:\s*\{[^}]+\}/s);
    expect(titleMatch).not.toBeNull();
    expect(titleMatch![0]).toContain("minWidth");
  });

  it("groupTitleCompact style forces full-width on mobile", () => {
    expect(sessionSrc).toContain("groupTitleCompact");
    const compactMatch = sessionSrc.match(/groupTitleCompact:\s*\{[^}]+\}/s);
    expect(compactMatch).not.toBeNull();
    expect(compactMatch![0]).toContain("flexBasis");
    expect(compactMatch![0]).toContain("flexGrow: 0");
  });

  it("applies groupTitleCompact conditionally on compact layout", () => {
    expect(sessionSrc).toContain("layout.compact && styles.groupTitleCompact");
  });

  it("exercise name has numberOfLines for ellipsis truncation", () => {
    expect(sessionSrc).toContain("numberOfLines={2}");
  });

  it("groupHeader contains exercise name and Details button", () => {
    expect(sessionSrc).toContain("styles.groupHeader");
    expect(sessionSrc).toContain("styles.groupTitle");
    expect(sessionSrc).toContain("Details");
  });
});
