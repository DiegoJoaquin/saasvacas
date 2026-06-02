'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { FarmProvider } from '../context/FarmContext';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    // La página de login no necesita protección
    const isLoginPage = pathname === '/login';

    // Mientras carga la sesión, mostrar spinner
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 50%, #40916c 100%)',
                color: 'white'
            }}>
                <span style={{ fontSize: '3.5rem', animation: 'spin 2s linear infinite' }}>🐄</span>
                <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: '500' }}>
                    Cargando SaaS LO...
                </p>
                <style jsx global>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // Si no está autenticado y NO está en /login, redirigir
    if (!user && !isLoginPage) {
        // Usar redirect del lado del cliente
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        return null;
    }

    // Si está autenticado y está en /login, redirigir al dashboard
    if (user && isLoginPage) {
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
        return null;
    }

    // Página de login: sin sidebar ni FarmProvider
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Páginas protegidas: con sidebar y FarmProvider
    return (
        <FarmProvider>
            <div className="app-container">
                <Sidebar />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </FarmProvider>
    );
}
