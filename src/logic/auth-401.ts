export function isUnauthorizedError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === "object" && err !== null) {
    if ("status" in err && (err as { status: unknown }).status === 401) {
      return true;
    }
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("401") || msg.includes("unauthorized")) {
      return true;
    }
  }
  return false;
}

