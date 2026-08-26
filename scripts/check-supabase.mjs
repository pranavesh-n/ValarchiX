import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aadevubgvpjvzwpdzory.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZGV2dWJndnBqdnp3cGR6b3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTM1NTcsImV4cCI6MjEwMjAyOTU1N30._Gptq2IxOa4DAAyCGS_8sTICG2VV4eIfxIuhlBPdNYc";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Checking Supabase connection...");
  const { data: user } = await supabase.auth.getUser();
  console.log("Auth check completed.");

  // Check digital_twins table
  const { data, error } = await supabase.from("digital_twins").select("*").limit(1);
  console.log("digital_twins table query result:", { data, error });
}

check();
