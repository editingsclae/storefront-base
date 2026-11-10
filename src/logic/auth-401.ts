export function isUnauthorizedError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === "object" && err !== null) {
    if ("status" in err && (err as { status: unknown }).status === 401) {
      return true;
    }
  }
  return false;
}

