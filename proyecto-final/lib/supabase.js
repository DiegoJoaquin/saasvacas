import { createBrowserClient } from '@supabase/ssr';

// Cliente Supabase para uso en componentes del lado del cliente (browser)
// Usa las variables de entorno públicas NEXT_PUBLIC_*
export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.warn("Supabase URL or Anon Key is missing. Running in local mock mode.");
        return null;
    }

    try {
        return createBrowserClient(url, key);
    } catch (e) {
        console.error("Failed to create Supabase client:", e);
        return null;
    }
}

// Singleton para evitar crear múltiples instancias en el mismo render
let supabaseInstance = null;

export function getSupabase() {
    if (!supabaseInstance) {
        supabaseInstance = createClient();
    }
    return supabaseInstance;
}
