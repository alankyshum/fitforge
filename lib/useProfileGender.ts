import { useState, useEffect } from "react";
import { getAppSetting } from "./db";
import type { Sex } from "./nutrition-calc";

/**
 * Returns the user's sex/gender from their nutrition profile.
 * Defaults to "male" if no profile is saved or the field is missing.
 */
export function useProfileGender(): Sex {
  const [gender, setGender] = useState<Sex>("male");

  useEffect(() => {
    getAppSetting("nutrition_profile")
      .then((saved) => {
        if (saved) {
          try {
            const profile = JSON.parse(saved);
            if (profile.sex === "male" || profile.sex === "female") {
              setGender(profile.sex);
            }
          } catch {
            // Invalid JSON — keep default
          }
        }
      })
      .catch(() => {
        // DB error — keep default
      });
  }, []);

  return gender;
}
