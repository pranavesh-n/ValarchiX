import { createClient } from "@supabase/supabase-js";
import { webcrypto } from "node:crypto";

const supabaseUrl = "https://aadevubgvpjvzwpdzory.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZGV2dWJndnBqdnp3cGR6b3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTM1NTcsImV4cCI6MjEwMjAyOTU1N30._Gptq2IxOa4DAAyCGS_8sTICG2VV4eIfxIuhlBPdNYc";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEncryptionAndSupabase() {
  console.log("Testing WebCrypto AES-GCM and Supabase Sync...");
  const userId = "demo_user_valarchix_2026";
  const enc = new TextEncoder();
  const salt = new Uint8Array(enc.encode("ValarchiX_Salt_India_Finance"));
  
  const keyMaterial = await webcrypto.subtle.importKey(
    "raw",
    enc.encode(userId + "_VALARCHIX_VAULT_KEY_2026"),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await webcrypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const payloadJson = JSON.stringify({ test: "ValarchiX Supabase Vault Live", timestamp: new Date().toISOString() });
  const encoded = enc.encode(payloadJson);
  
  const encrypted = await webcrypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  const base64Payload = Buffer.from(combined).toString("base64");

  console.log("Encrypted payload generated successfully. Length:", base64Payload.length);

  // Upsert to Supabase
  const { data, error } = await supabase
    .from("digital_twins")
    .upsert({
      user_id: userId,
      encrypted_payload: base64Payload,
      updated_at: new Date().toISOString(),
    })
    .select();

  console.log("Supabase DB upsert result:", { data, error });

  // Read back and decrypt
  const { data: fetched, error: fetchErr } = await supabase
    .from("digital_twins")
    .select("encrypted_payload")
    .eq("user_id", userId)
    .single();

  const fetchedBytes = Buffer.from(fetched.encrypted_payload, "base64");
  const fetchedIv = fetchedBytes.subarray(0, 12);
  const fetchedCipher = fetchedBytes.subarray(12);

  const decrypted = await webcrypto.subtle.decrypt(
    { name: "AES-GCM", iv: fetchedIv },
    key,
    fetchedCipher
  );

  const decryptedText = new TextDecoder().decode(decrypted);
  console.log("Decrypted payload from Supabase:", decryptedText);
}

testEncryptionAndSupabase();
