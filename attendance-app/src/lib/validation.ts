export const REGISTER_NUMBER_REGEX = /^[A-Za-z0-9_-]{2,20}$/;

export function validateRegisterNumber(v: unknown): string | null {
  if (typeof v !== "string" || v.trim() === "") return "Register number is required.";
  const t = v.trim();
  if (t.length < 2) return "Register number must be at least 2 characters.";
  if (t.length > 20) return "Register number must be at most 20 characters.";
  if (!REGISTER_NUMBER_REGEX.test(t))
    return "Register number can only contain letters, numbers, hyphens and underscores.";
  return null;
}

export function validateName(v: unknown): string | null {
  if (typeof v !== "string" || v.trim() === "") return "Name is required.";
  const t = v.trim();
  if (t.length < 2) return "Name must be at least 2 characters.";
  if (t.length > 80) return "Name must be at most 80 characters.";
  return null;
}

export function validateLabel(v: unknown, label: string): string | null {
  if (typeof v !== "string" || v.trim() === "") return `${label} name is required.`;
  const t = v.trim();
  if (t.length < 1 || t.length > 40) return `${label} name must be 1–40 characters.`;
  return null;
}

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

export function validateGender(v: unknown): string | null {
  if (typeof v !== "string" || v.trim() === "") return "Gender is required.";
  if (!GENDERS.includes(v as Gender)) return "Please select a valid gender.";
  return null;
}