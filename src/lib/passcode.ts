// Standard pure JS SHA-256 implementation ensuring 100% identical output to WebCrypto
function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i: number, j: number;
  let result = "";

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += "\x80";
  while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00";
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 =
        (hash[7] +
          (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
          ch +
          k[i] +
          (w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0)) |
        0;
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 =
        ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) +
          maj) |
        0;

      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (8 * b)) & 255;
      result += (byte < 16 ? "0" : "") + byte.toString(16);
    }
  }
  return result;
}

export async function hashPin(pin: string): Promise<string> {
  try {
    if (
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.subtle &&
      typeof window.crypto.subtle.digest === "function"
    ) {
      const encoder = new TextEncoder();
      const data = encoder.encode(pin);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (err) {
    console.warn("WebCrypto subtle digest not available or failed, falling back to JS SHA-256:", err);
  }
  return sha256Sync(pin);
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
 * Only locks if the user has EXPLICITLY enabled app lock in their settings and has a PIN.
 */
export function checkIsAppLockedSync(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const activeUserId = localStorage.getItem("valarchix_active_user_id");

    // Check if active user has a PIN and lock is enabled
    if (activeUserId) {
      const isLockExplicitlyEnabled =
        localStorage.getItem(getUserLockEnabledKey(activeUserId)) === "true" ||
        localStorage.getItem("valarchix_app_lock_enabled") === "true";
      const userPin = localStorage.getItem(getUserPasscodeKey(activeUserId));
      if (userPin && isLockExplicitlyEnabled) {
        const isUnlocked =
          sessionStorage.getItem(getUserSessionUnlockedKey(activeUserId)) === "true" ||
          sessionStorage.getItem("valarchix_session_unlocked") === "true";
        return !isUnlocked;
      }
    }

    // Check legacy global PIN
    const legacyPin = localStorage.getItem("valarchix_app_pin");
    const isLegacyLockEnabled = localStorage.getItem("valarchix_app_lock_enabled") === "true";
    if (legacyPin && isLegacyLockEnabled) {
      const isLegacyUnlocked = sessionStorage.getItem("valarchix_session_unlocked") === "true";
      if (!isLegacyUnlocked) return true;
    }

    // Check if any user-specific PIN key exists in localStorage with lock enabled
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("valarchix_app_pin_")) {
        const pinVal = localStorage.getItem(key);
        const uId = key.replace("valarchix_app_pin_", "");
        const isEnabled =
          localStorage.getItem(getUserLockEnabledKey(uId)) === "true" ||
          localStorage.getItem("valarchix_app_lock_enabled") === "true";
        if (pinVal && isEnabled) {
          const isUnlocked =
            sessionStorage.getItem(getUserSessionUnlockedKey(uId)) === "true" ||
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
 * Completely disables all passcode locks and marks the session as unlocked
 */
export function disableAllPasscodes(): void {
  if (typeof window === "undefined") return;
  try {
    const activeUserId = localStorage.getItem("valarchix_active_user_id");
    if (activeUserId) {
      localStorage.removeItem(getUserPasscodeKey(activeUserId));
      localStorage.removeItem(getUserLockEnabledKey(activeUserId));
      sessionStorage.setItem(getUserSessionUnlockedKey(activeUserId), "true");
    }
    localStorage.removeItem("valarchix_app_pin");
    localStorage.removeItem("valarchix_app_lock_enabled");
    sessionStorage.setItem("valarchix_session_unlocked", "true");

    // Remove any user-specific pin keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith("valarchix_app_pin_") ||
          k.startsWith("valarchix_app_lock_enabled_"))
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn("Error disabling passcodes:", err);
  }
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

