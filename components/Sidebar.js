'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFarm } from '../context/FarmContext';

export default function Sidebar() {
    const pathname = usePathname();
    const { farmData, loading } = useFarm();

    // Obtener información del predio
    const predioName = farmData ? farmData.predioName : "Fundo Río Bueno";
    const region = farmData ? farmData.region : "Región de Los Ríos";
    const avatar = predioName ? predioName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : "FR";

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
                <div className="predio-info">
                    <div className="predio-avatar">{loading ? '..' : avatar}</div>
                    <div className="predio-details">
                        <h4>{loading ? 'Cargando...' : predioName}</h4>
                        <p>{loading ? 'Ubicación...' : region}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
