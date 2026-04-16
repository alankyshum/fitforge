// Mock getAppSetting directly
const mockGetAppSetting = jest.fn<Promise<string | null>, [string]>();
jest.mock("../../lib/db", () => ({
  getAppSetting: (...args: [string]) => mockGetAppSetting(...args),
}));

import { renderHook, waitFor } from "@testing-library/react-native";
import { useProfileGender } from "../../lib/useProfileGender";

beforeEach(() => {
  mockGetAppSetting.mockReset();
});

describe("useProfileGender", () => {
  it("defaults to male when no profile is saved", async () => {
    mockGetAppSetting.mockResolvedValue(null);
    const { result } = renderHook(() => useProfileGender());
    expect(result.current).toBe("male");
    await waitFor(() => {
      expect(mockGetAppSetting).toHaveBeenCalledWith("nutrition_profile");
    });
    expect(result.current).toBe("male");
  });

  it("returns male when profile sex is male", async () => {
    mockGetAppSetting.mockResolvedValue(JSON.stringify({ sex: "male", age: 30 }));
    const { result } = renderHook(() => useProfileGender());
    await waitFor(() => {
      expect(result.current).toBe("male");
    });
  });

  it("returns female when profile sex is female", async () => {
    mockGetAppSetting.mockResolvedValue(JSON.stringify({ sex: "female", age: 25 }));
    const { result } = renderHook(() => useProfileGender());
    await waitFor(() => {
      expect(result.current).toBe("female");
    });
  });

  it("defaults to male when profile has invalid JSON", async () => {
    mockGetAppSetting.mockResolvedValue("not-json");
    const { result } = renderHook(() => useProfileGender());
    await waitFor(() => {
      expect(mockGetAppSetting).toHaveBeenCalled();
    });
    expect(result.current).toBe("male");
  });

  it("defaults to male when profile sex field is missing", async () => {
    mockGetAppSetting.mockResolvedValue(JSON.stringify({ age: 30 }));
    const { result } = renderHook(() => useProfileGender());
    await waitFor(() => {
      expect(mockGetAppSetting).toHaveBeenCalled();
    });
    expect(result.current).toBe("male");
  });

  it("defaults to male when DB throws an error", async () => {
    mockGetAppSetting.mockRejectedValue(new Error("DB error"));
    const { result } = renderHook(() => useProfileGender());
    await waitFor(() => {
      expect(mockGetAppSetting).toHaveBeenCalled();
    });
    expect(result.current).toBe("male");
  });
});
