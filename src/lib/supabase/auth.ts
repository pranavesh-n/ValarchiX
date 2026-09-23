import { createClient } from "./client";
import { FinancialDigitalTwin } from "../engine/types";

export async function signInWithGoogle(nextPath = "/profile") {
  if (typeof window === "undefined") return;
  const supabase = createClient();
  const origin = window.location.origin || process.env.NEXT_PUBLIC_SITE_URL || "https://valarchix.vercel.app";
  const redirectTo = `${origin}${nextPath}`;

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      console.error("Google Sign-In Error:", error);
    }
  } catch (err) {
    console.error("Unexpected Sign-In Error:", err);
  }
}

export async function signOutUser() {
  // 1. Synchronous storage cleanup first
  if (typeof window !== "undefined") {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-") || key.includes("supabase") || key.includes("VALARCHIX_VAULT_")) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem("VALARCHIX_DEMO_SESSION");
    localStorage.removeItem("VALARCHIX_DIGITAL_TWIN");
    localStorage.removeItem("sb-access-token");
    localStorage.removeItem("sb-refresh-token");
    sessionStorage.clear();
  }

  // 2. Supabase SDK sign out
  const supabase = createClient();
  try {
    await supabase.auth.signOut({ scope: "local" });
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("Sign out error:", err);
  }
}

export async function getCurrentUserSession() {
  const supabase = createClient();
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error && session?.user) {
      return session;
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!userError && user) {
      return { user } as any;
    }
  } catch (err) {
    console.warn("Supabase session check:", err);
  }
  return null;
}

/**
 * Client-Side Encrypted Digital Twin Vault using WebCrypto (AES-GCM)
 */
async function getEncryptionKey(userId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const salt = new Uint8Array(enc.encode("ValarchiX_Salt_India_Finance"));
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(userId + "_VALARCHIX_VAULT_KEY_2026"),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function saveDigitalTwinToVault(twin: FinancialDigitalTwin): Promise<boolean> {
  const session = await getCurrentUserSession();

  // Always save locally first for instantaneous, reliable offline/guest access
  if (typeof window !== "undefined") {
    localStorage.setItem("VALARCHIX_DIGITAL_TWIN", JSON.stringify(twin));
  }

  if (!session?.user?.id) return true; // Guest saved locally

  try {
    const key = await getEncryptionKey(session.user.id);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(twin));

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encodedData
    );

    const payload = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encryptedContent)),
      updatedAt: new Date().toISOString()
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(`VALARCHIX_VAULT_${session.user.id}`, JSON.stringify(payload));
    }

    const supabase = createClient();
    const { error } = await supabase.from("digital_twins").upsert({
      user_id: session.user.id,
      encrypted_payload: JSON.stringify(payload),
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });

    if (error) {
      console.warn("Supabase vault upsert error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("Vault encryption error:", err);
    return false;
  }
}

export async function loadDigitalTwinFromVault(): Promise<FinancialDigitalTwin | null> {
  const session = await getCurrentUserSession();

  // 1. Try authenticated vault first
  if (session?.user?.id) {
    try {
      let payloadRaw = typeof window !== "undefined" ? localStorage.getItem(`VALARCHIX_VAULT_${session.user.id}`) : null;

      if (!payloadRaw) {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("digital_twins")
          .select("encrypted_payload")
          .eq("user_id", session.user.id)
          .single();
        
        if (data?.encrypted_payload) {
          payloadRaw = data.encrypted_payload;
        }
      }

      if (payloadRaw) {
        // Support JSON stringified payload
        if (payloadRaw.trim().startsWith("{")) {
          const payload = JSON.parse(payloadRaw);
          if (payload.iv && payload.data) {
            const key = await getEncryptionKey(session.user.id);
            const iv = new Uint8Array(payload.iv);
            const data = new Uint8Array(payload.data);

            const decrypted = await window.crypto.subtle.decrypt(
              { name: "AES-GCM", iv },
              key,
              data
            );

            const decoded = new TextDecoder().decode(decrypted);
            return JSON.parse(decoded) as FinancialDigitalTwin;
          }
        }
      }
    } catch (err) {
      console.warn("Vault decryption error:", err);
    }
  }

  // 2. Fallback to local twin
  if (typeof window !== "undefined") {
    const localRaw = localStorage.getItem("VALARCHIX_DIGITAL_TWIN");
    if (localRaw) {
      try {
        return JSON.parse(localRaw) as FinancialDigitalTwin;
      } catch (e) {
        console.warn("Error parsing local twin:", e);
      }
    }
  }

  return null;
}

/**
 * Save an individual Financial DNA session as a table row in Supabase and update user twin
 */
export async function saveFinancialDnaSession(sessionRecord: {
  id: string;
  userId?: string;
  createdAt: string;
  title?: string;
  dnaScore: any;
  assessmentData: any;
}): Promise<boolean> {
  const session = await getCurrentUserSession();
  const userId = session?.user?.id || "guest_user";
  const recordWithUser = { ...sessionRecord, userId };

  // 1. Save locally
  if (typeof window !== "undefined") {
    try {
      const existingRaw = localStorage.getItem("VALARCHIX_DNA_SESSIONS");
      const list: any[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updatedList = [recordWithUser, ...list.filter((s: any) => s.id !== recordWithUser.id)];
      localStorage.setItem("VALARCHIX_DNA_SESSIONS", JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Error saving DNA session locally:", e);
    }
  }

  // 2. Update master twin record
  const currentTwin: FinancialDigitalTwin = (await loadDigitalTwinFromVault()) || {
    updatedAt: new Date().toISOString(),
    income: { monthlySalary: sessionRecord.assessmentData?.income?.primaryMonthlyTakeHome || 0, secondaryMonthlyIncome: 0, expectedAnnualGrowthPct: 10, stabilityRating: "high" as const },
    expenses: { essentialMonthly: 0, discretionaryMonthly: 0, recurringAnnual: 0, irregularAnnual: 0 },
    savings: { liquidBankBalance: 0, cashReserves: 0 },
    investments: [],
    debts: [],
    protection: { healthInsuranceCover: 0, lifeInsuranceCover: 0, dependantsCount: 0, annualHealthPremium: 0, annualLifePremium: 0 },
    goals: [],
    dnaHistory: [],
    dnaSessions: [],
    decisions: [],
    universes: []
  };

  const existingSessions = currentTwin.dnaSessions || [];
  const updatedSessions = [recordWithUser, ...existingSessions.filter((s: any) => s.id !== recordWithUser.id)];

  const updatedTwin: FinancialDigitalTwin = {
    ...currentTwin,
    dnaScore: sessionRecord.dnaScore,
    assessmentData: sessionRecord.assessmentData,
    dnaSessions: updatedSessions,
    updatedAt: new Date().toISOString(),
  };

  await saveDigitalTwinToVault(updatedTwin);

  // 3. Save as explicit row in Supabase digital_twins table if signed in
  if (session?.user?.id) {
    try {
      const supabase = createClient();
      const rowKey = `${session.user.id}:dna:${sessionRecord.id}`;
      await supabase.from("digital_twins").upsert({
        user_id: rowKey,
        encrypted_payload: JSON.stringify(recordWithUser),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    } catch (err) {
      console.warn("Supabase session row save error:", err);
    }
  }

  return true;
}

/**
 * Load all historical Financial DNA sessions for the current user
 */
export async function loadFinancialDnaSessions(): Promise<any[]> {
  const session = await getCurrentUserSession();
  const sessionsMap = new Map<string, any>();

  // 1. Check local storage
  if (typeof window !== "undefined") {
    try {
      const localRaw = localStorage.getItem("VALARCHIX_DNA_SESSIONS");
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((s) => {
            if (s.id) sessionsMap.set(s.id, s);
          });
        }
      }
    } catch (e) {
      console.warn("Error reading local sessions:", e);
    }
  }

  // 2. Check master twin
  const twin = await loadDigitalTwinFromVault();
  if (twin?.dnaSessions && Array.isArray(twin.dnaSessions)) {
    twin.dnaSessions.forEach((s) => {
      if (s.id) sessionsMap.set(s.id, s);
    });
  }

  // 3. If signed in, query individual session rows from Supabase
  if (session?.user?.id) {
    try {
      const supabase = createClient();
      const prefix = `${session.user.id}:dna:`;
      const { data, error } = await supabase
        .from("digital_twins")
        .select("encrypted_payload")
        .like("user_id", `${prefix}%`);

      if (!error && data) {
        data.forEach((row: any) => {
          if (row.encrypted_payload) {
            try {
              const parsed = JSON.parse(row.encrypted_payload);
              if (parsed.id) {
                sessionsMap.set(parsed.id, parsed);
              }
            } catch (e) {
              // ignore non-json
            }
          }
        });
      }
    } catch (err) {
      console.warn("Error querying Supabase session rows:", err);
    }
  }

  const result = Array.from(sessionsMap.values());
  // Sort descending by date
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}

/**
 * Load a specific Financial DNA session by ID
 */
export async function loadFinancialDnaSessionById(sessionId: string): Promise<any | null> {
  const allSessions = await loadFinancialDnaSessions();
  const found = allSessions.find((s) => s.id === sessionId);
  if (found) return found;

  // Direct fetch from Supabase if not in list
  const session = await getCurrentUserSession();
  if (session?.user?.id) {
    try {
      const supabase = createClient();
      const rowKey = `${session.user.id}:dna:${sessionId}`;
      const { data } = await supabase
        .from("digital_twins")
        .select("encrypted_payload")
        .eq("user_id", rowKey)
        .single();

      if (data?.encrypted_payload) {
        return JSON.parse(data.encrypted_payload);
      }
    } catch (e) {
      console.warn("Error fetching single session row:", e);
    }
  }

  return null;
}

/**
 * Save user goals to vault & database storage
 * Ensures user goals are permanently preserved in the cloud database unless explicitly deleted by user
 */
export async function saveUserGoals(goals: any[]): Promise<boolean> {
  const session = await getCurrentUserSession();

  // Local storage for instantaneous UI response
  if (typeof window !== "undefined") {
    localStorage.setItem("VALARCHIX_USER_GOALS", JSON.stringify(goals));
  }

  // Persist directly as dedicated cloud row in database if signed in
  if (session?.user?.id) {
    try {
      const supabase = createClient();
      await supabase.from("digital_twins").upsert({
        user_id: `${session.user.id}:goals`,
        encrypted_payload: JSON.stringify(goals),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    } catch (err) {
      console.warn("Goals database save error:", err);
    }
  }

  // Also sync to master digital twin
  const twin = await loadDigitalTwinFromVault();
  if (twin) {
    const updated = { ...twin, goals, updatedAt: new Date().toISOString() };
    await saveDigitalTwinToVault(updated);
  }
  return true;
}

/**
 * Load user goals from database & vault
 * Returns exact user goals without any starter dummy mocks
 */
export async function loadUserGoals(): Promise<any[]> {
  const session = await getCurrentUserSession();

  // 1. If signed in, query user's dedicated goals record in cloud database
  if (session?.user?.id) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("digital_twins")
        .select("encrypted_payload")
        .eq("user_id", `${session.user.id}:goals`)
        .single();

      if (!error && data?.encrypted_payload) {
        const parsed = JSON.parse(data.encrypted_payload);
        if (Array.isArray(parsed)) {
          if (typeof window !== "undefined") {
            localStorage.setItem("VALARCHIX_USER_GOALS", JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Error loading user goals from database:", err);
    }
  }

  // 2. Check master digital twin in vault
  const twin = await loadDigitalTwinFromVault();
  if (twin?.goals && Array.isArray(twin.goals) && twin.goals.length > 0) {
    return twin.goals;
  }

  // 3. Fallback to localStorage
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("VALARCHIX_USER_GOALS");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore
      }
    }
  }

  return [];
}

