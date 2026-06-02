'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const supabase = getSupabase();

    useEffect(() => {
        if (!supabase) {
            setUser({ id: 'local-user-id', email: 'offline@predio.com', user_metadata: { full_name: 'Usuario Local' } });
            setSession({ user: { id: 'local-user-id' } });
            setLoading(false);
            return;
        }

        // Obtener la sesión actual al cargar
        const getSession = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);
        };

        getSession();

        // Escuchar cambios de autenticación (login, logout, refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);

    // Login con Google OAuth
    const signInWithGoogle = async () => {
        if (!supabase) {
            console.log("Mock Google Sign-In");
            return;
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`
            }
        });
        if (error) {
            console.error('Error al iniciar sesión con Google:', error.message);
            throw error;
        }
    };

    // Cerrar sesión
    const signOut = async () => {
        if (!supabase) {
            setUser(null);
            setSession(null);
            return;
        }
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error al cerrar sesión:', error.message);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}
