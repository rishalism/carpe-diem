export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function passwordIssue(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  return null;
}

export function parseTags(raw: string): string[] {
  const set = new Set(
    raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  );
  return [...set];
}
