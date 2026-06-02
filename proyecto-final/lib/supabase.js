import { createBrowserClient } from '@supabase/ssr';

// Cliente Supabase para uso en componentes del lado del cliente (browser)
// Usa las variables de entorno públicas NEXT_PUBLIC_*
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
}

// Singleton para evitar crear múltiples instancias en el mismo render
let supabaseInstance = null;

export function getSupabase() {
    if (!supabaseInstance) {
        supabaseInstance = createClient();
    }
    return supabaseInstance;
}
