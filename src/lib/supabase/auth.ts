import { createClient } from "./client";
import { FinancialDigitalTwin } from "../engine/types";

export function getGoogleAuthUrl(nextPath = "/profile"): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aadevubgvpjvzwpdzory.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZGV2dWJndnBqdnp3cGR6b3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTM1NTcsImV4cCI6MjEwMjAyOTU1N30._Gptq2IxOa4DAAyCGS_8sTICG2VV4eIfxIuhlBPdNYc";
  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || "https://valarchix.vercel.app");
  
  const redirectTo = `${origin}${nextPath}`;
  return `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}&apikey=${supabaseAnonKey}&prompt=select_account`;
}

export function signInWithGoogle(nextPath = "/profile") {
  if (typeof window !== "undefined") {
    const url = getGoogleAuthUrl(nextPath);
    window.location.assign(url);
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
  if (!session?.user?.id) return false;

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
    await supabase.from("user_vaults").upsert({
      user_id: session.user.id,
      encrypted_payload: JSON.stringify(payload),
      updated_at: new Date().toISOString()
    });

    return true;
  } catch (err) {
    console.warn("Vault encryption error:", err);
    return false;
  }
}

export async function loadDigitalTwinFromVault(): Promise<FinancialDigitalTwin | null> {
  const session = await getCurrentUserSession();
  if (!session?.user?.id) return null;

  try {
    let payloadRaw = typeof window !== "undefined" ? localStorage.getItem(`VALARCHIX_VAULT_${session.user.id}`) : null;

    if (!payloadRaw) {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_vaults")
        .select("encrypted_payload")
        .eq("user_id", session.user.id)
        .single();
      
      if (data?.encrypted_payload) {
        payloadRaw = data.encrypted_payload;
      }
    }

    if (!payloadRaw) return null;

    const payload = JSON.parse(payloadRaw);
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
  } catch (err) {
    console.warn("Vault decryption error:", err);
    return null;
  }
}
