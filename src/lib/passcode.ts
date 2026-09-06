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

/**
 * Extracts ONLY the primary first name of the user, stripping any surname or secondary names
 * Example: "Pranavesh Nandakumar" -> "Pranavesh"
 * Example: "pranavesh.nandakumar@gmail.com" -> "Pranavesh"
 */
export function getPrimaryFirstName(nameOrEmail?: string | null): string {
  if (!nameOrEmail || typeof nameOrEmail !== "string") return "Investor";

  const trimmed = nameOrEmail.trim();
  if (!trimmed) return "Investor";

  // If it's an email address, extract first token before '@'
  if (trimmed.includes("@")) {
    const handle = trimmed.split("@")[0].trim();
    // Split on dot, underscore, dash or numbers
    const tokens = handle.split(/[._\-\d]+/i).filter(Boolean);
    if (tokens.length > 0) {
      const first = tokens[0];
      return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
    }
  }

  // Split on whitespace or punctuation
  const nameParts = trimmed.split(/\s+/).filter(Boolean);
  if (nameParts.length > 0) {
    const first = nameParts[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  }

  return "Investor";
}

/**
 * Synchronously checks if the app is currently locked by inspecting browser storage immediately (0.001ms latency)
 * This prevents any flash or delay of the home page before the PIN screen mounts.
 */
export function checkIsAppLockedSync(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const activeUserId = localStorage.getItem("valarchix_active_user_id");

    // Check if active user has a PIN
    if (activeUserId) {
      const userPin = localStorage.getItem(getUserPasscodeKey(activeUserId));
      if (userPin) {
        const isUnlocked = sessionStorage.getItem(getUserSessionUnlockedKey(activeUserId)) === "true" ||
                           sessionStorage.getItem("valarchix_session_unlocked") === "true";
        return !isUnlocked;
      }
    }

    // Check legacy global PIN
    const legacyPin = localStorage.getItem("valarchix_app_pin");
    if (legacyPin) {
      const isLegacyUnlocked = sessionStorage.getItem("valarchix_session_unlocked") === "true";
      if (!isLegacyUnlocked) return true;
    }

    // Check if any user-specific PIN key exists in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("valarchix_app_pin_")) {
        const pinVal = localStorage.getItem(key);
        if (pinVal) {
          const uId = key.replace("valarchix_app_pin_", "");
          const isUnlocked = sessionStorage.getItem(getUserSessionUnlockedKey(uId)) === "true" ||
                             sessionStorage.getItem("valarchix_session_unlocked") === "true";
          if (!isUnlocked) return true;
        }
      }
    }
  } catch (err) {
    console.warn("Sync lock check error:", err);
  }

  return false;
}

/**
 * Returns cached first name of active user for instant frame-0 rendering
 */
export function getCachedUserFirstName(): string {
  if (typeof window === "undefined") return "Investor";
  try {
    const cached = localStorage.getItem("valarchix_cached_first_name");
    if (cached) return cached;
  } catch {
    // ignore
  }
  return "Investor";
}

/**
 * Caches active user info for instantaneous retrieval on app start
 */
export function setCachedUserInfo(user: any): void {
  if (typeof window === "undefined" || !user) return;
  try {
    if (user.id) {
      localStorage.setItem("valarchix_active_user_id", user.id);
    }
    const rawName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Investor";
    const firstName = getPrimaryFirstName(rawName);
    localStorage.setItem("valarchix_cached_first_name", firstName);
  } catch {
    // ignore
  }
}

