import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aadevubgvpjvzwpdzory.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZGV2dWJndnBqdnp3cGR6b3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTM1NTcsImV4cCI6MjEwMjAyOTU1N30._Gptq2IxOa4DAAyCGS_8sTICG2VV4eIfxIuhlBPdNYc";

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
}
