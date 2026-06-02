'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
    const { signInWithGoogle } = useAuth();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await signInWithGoogle();
        } catch (err) {
            setError('No se pudo iniciar sesión con Google. Intente de nuevo.');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 50%, #40916c 100%)',
            fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
        }}>
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.97)',
                borderRadius: '20px',
                padding: '3rem 2.5rem',
                maxWidth: '420px',
                width: '90%',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decoración superior */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '5px',
                    background: 'linear-gradient(90deg, #2d6a4f, #52b788, #2d6a4f)'
                }} />

                {/* Logo / Icono */}
                <div style={{
                    fontSize: '4rem',
                    marginBottom: '0.5rem',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}>
                    🐄
                </div>

                <h1 style={{
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    color: '#1a472a',
                    margin: '0 0 0.3rem 0',
                    letterSpacing: '-0.02em'
                }}>
                    SaaS LO
                </h1>

                <p style={{
                    fontSize: '0.95rem',
                    color: '#6c757d',
                    margin: '0 0 2rem 0',
                    lineHeight: '1.5'
                }}>
                    Control Reproductivo Bovino
                    <br />
                    <span style={{ fontSize: '0.85rem', color: '#95a5a6' }}>
                        Gestión inteligente de tu rebaño
                    </span>
                </p>

                {/* Botón Google Login */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.8rem',
                        padding: '0.9rem 1.5rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#3c4043',
                        backgroundColor: '#ffffff',
                        border: '2px solid #dadce0',
                        borderRadius: '12px',
                        cursor: isLoading ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        opacity: isLoading ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!isLoading) {
                            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            e.target.style.borderColor = '#4285f4';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                        e.target.style.borderColor = '#dadce0';
                    }}
                >
                    {/* Google Icon SVG */}
                    <svg width="20" height="20" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    {isLoading ? 'Conectando...' : 'Iniciar Sesión con Google'}
                </button>

                {/* Error message */}
                {error && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.8rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#dc2626',
                        fontSize: '0.85rem'
                    }}>
                        {error}
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    marginTop: '2rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #e9ecef',
                    fontSize: '0.78rem',
                    color: '#adb5bd',
                    lineHeight: '1.6'
                }}>
                    Al iniciar sesión, tus datos quedan vinculados
                    <br />
                    a tu cuenta de Google de forma segura.
                </div>
            </div>
        </div>
    );
}
