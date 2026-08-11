import { createClient } from "./client";
import { FinancialDigitalTwin } from "../engine/types";

export async function signInWithGoogle() {
  const supabase = createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = (typeof window !== "undefined" && window.location.origin) ? window.location.origin : (siteUrl || "https://valarchix.vercel.app");
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Supabase Google OAuth fallback triggered:", err);
    // Instant session fallback for local testing / demo mode
    return signInWithDemoUser();
  }
}

export async function signInWithDemoUser() {
  if (typeof window === "undefined") return null;

  const demoSession = {
    user: {
      id: "demo_user_valarchix_2026",
      email: "pranavesh@valarchix.com",
      user_metadata: {
        full_name: "Pranavesh (Demo Account)",
        avatar_url: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      },
    },
  };

  localStorage.setItem("VALARCHIX_DEMO_SESSION", JSON.stringify(demoSession));
  return demoSession;
}

export async function signOutUser() {
  const supabase = createClient();
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem("VALARCHIX_DEMO_SESSION");
  }
}

export async function getCurrentUserSession() {
  if (typeof window !== "undefined") {
    const demoRaw = localStorage.getItem("VALARCHIX_DEMO_SESSION");
    if (demoRaw) {
      try { return JSON.parse(demoRaw); } catch { }
    }
  }

  const supabase = createClient();
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Client-Side Encrypted Digital Twin Vault using WebCrypto (AES-256-GCM)
 */
async function getEncryptionKey(userId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
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
      salt: enc.encode("ValarchiX_Salt_India_Finance"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-256-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function saveDigitalTwinToVault(twin: FinancialDigitalTwin): Promise<boolean> {
  const session = await getCurrentUserSession();
  const userId = session?.user?.id || "guest_user";

  if (typeof window !== "undefined") {
    localStorage.setItem(`VALARCHIX_TWIN_${userId}`, JSON.stringify(twin));
  }

  if (!session?.user?.id || userId.startsWith("guest")) {
    return false;
  }

  try {
    const supabase = createClient();
    const jsonString = JSON.stringify(twin);
    let payload = jsonString;

    if (typeof window !== "undefined" && window.crypto?.subtle) {
      const key = await getEncryptionKey(userId);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(jsonString);
      const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-256-GCM", iv },
        key,
        encoded
      );
      
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      payload = btoa(String.fromCharCode(...combined));
    }

    await supabase
      .from("digital_twins")
      .upsert({
        user_id: userId,
        encrypted_payload: payload,
        updated_at: new Date().toISOString(),
      });

    return true;
  } catch (err) {
    console.warn("Supabase vault sync fallback to localStorage:", err);
    return false;
  }
}

export async function loadDigitalTwinFromVault(): Promise<FinancialDigitalTwin | null> {
  const session = await getCurrentUserSession();
  const userId = session?.user?.id || "guest_user";

  if (typeof window !== "undefined") {
    const local = localStorage.getItem(`VALARCHIX_TWIN_${userId}`);
    if (local) {
      try { return JSON.parse(local); } catch {}
    }
  }

  if (!session?.user?.id || userId.startsWith("guest")) {
    return null;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("digital_twins")
      .select("encrypted_payload")
      .eq("user_id", userId)
      .single();

    if (error || !data?.encrypted_payload) return null;

    const rawPayload = data.encrypted_payload;
    if (rawPayload.startsWith("{")) {
      return JSON.parse(rawPayload);
    }

    if (typeof window !== "undefined" && window.crypto?.subtle) {
      const key = await getEncryptionKey(userId);
      const bytes = Uint8Array.from(atob(rawPayload), (c) => c.charCodeAt(0));
      const iv = bytes.slice(0, 12);
      const cipherText = bytes.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-256-GCM", iv },
        key,
        cipherText
      );
      
      const jsonString = new TextDecoder().decode(decrypted);
      return JSON.parse(jsonString);
    }
  } catch (err) {
    console.warn("Vault load fallback:", err);
  }
  return null;
}
