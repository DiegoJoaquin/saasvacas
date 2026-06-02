'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFarm } from '../context/FarmContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const pathname = usePathname();
    const { farmData, loading } = useFarm();
    const { user, signOut } = useAuth();

    // Obtener información del predio
    const predioName = farmData ? farmData.predioName : "Cargando predio...";
    const region = farmData ? farmData.region : "";

    // Info del usuario autenticado
    const userName = user?.user_metadata?.full_name || user?.email || 'Usuario';
    const userAvatar = user?.user_metadata?.avatar_url || null;
    const userInitials = userName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
        }
    };

    const menuItems = [
        {
            href: '/',
            label: 'Panel General',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
            )
        },
        {
            href: '/inventario',
            label: 'Inventario Bovino',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            )
        },
        {
            href: '/registrar-evento',
            label: 'Registrar Evento',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                </svg>
            )
        },
        {
            href: '/descarte',
            label: 'Decisiones Descarte',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
                </svg>
            )
        },
        {
            href: '/respaldo',
            label: 'Importar / Exportar Excel',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
            )
        }
    ];

    return (
        <aside className="sidebar">
            <div>
                <div className="brand-section">
                    <span className="brand-icon" role="img" aria-label="cow">🐄</span>
                    <div className="brand-title">
                        <h1>SaaS LO</h1>
                        <span>Control Reproductivo</span>
                    </div>
                </div>
                
                <nav>
                    <ul className="nav-menu">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                                    <Link href={item.href} style={{ textDecoration: 'none' }}>
                                        <button type="button">
                                            {item.icon}
                                            {item.label}
                                        </button>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
            
            <div className="sidebar-footer">
                {/* Info del usuario autenticado */}
                <div className="predio-info">
                    <div className="predio-avatar" style={{
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {userAvatar ? (
                            <img 
                                src={userAvatar} 
                                alt={userName}
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    borderRadius: 'inherit'
                                }} 
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            userInitials
                        )}
                    </div>
                    <div className="predio-details">
                        <h4>{loading ? 'Cargando...' : userName}</h4>
                        <p>{loading ? '' : predioName}</p>
                    </div>
                </div>

                {/* Botón cerrar sesión */}
                <button 
                    onClick={handleSignOut}
                    type="button"
                    style={{
                        width: '100%',
                        marginTop: '0.8rem',
                        padding: '0.5rem 0.8rem',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: '#cbd5e1',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                        e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                        e.target.style.color = '#fca5a5';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.target.style.color = '#cbd5e1';
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}
