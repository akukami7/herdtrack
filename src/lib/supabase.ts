import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Если переменные окружения отсутствуют (например, при сборке на Vercel без настроенного ENV),
// используем временные заглушки, чтобы избежать сбоя сборки.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);