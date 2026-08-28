export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getUserPasscodeKey(userId: string): string {
  return `valarchix_app_pin_${userId}`;
}

export function getUserLockEnabledKey(userId: string): string {
  return `valarchix_app_lock_enabled_${userId}`;
}

export function getUserSessionUnlockedKey(userId: string): string {
  return `valarchix_session_unlocked_${userId}`;
}
