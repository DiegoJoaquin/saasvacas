'use client';

import React from 'react';
import { calcularEdad, formatearFecha } from '../lib/calculations';

export default function AnimalDrawer({ animal, onClose }) {
    if (!animal) return null;

    const edad = calcularEdad(animal.fechaNacimiento);
    const fechaNac = formatearFecha(animal.fechaNacimiento);

    return (
        <div className="drawer-overlay active" onClick={onClose}>
            <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
                <div className="drawer-header">
                    <h3>Ficha Animal: DIIO {animal.diio}</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                {/* Perfil del Animal */}
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '1.2rem', borderRadius: 'var(--border-radius-md)', marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.85rem' }}>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Categoría:</span>
                            <strong style={{ display: 'block' }}>{animal.categoria}</strong>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Raza:</span>
                            <strong style={{ display: 'block' }}>{animal.raza}</strong>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Edad:</span>
                            <strong style={{ display: 'block' }}>{edad} años</strong>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>F. Nacimiento:</span>
                            <strong style={{ display: 'block' }}>{fechaNac}</strong>
                        </div>
                        <div style={{ gridColumn: 'span 2', borderTop: '1px solid hsl(210, 10%, 88%)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Partos Exitosos Totales:</span>
                            <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--color-state-prenada)' }}>
                                {animal.partosExitosos}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* Línea de Tiempo */}
                <h4>Historial Clínico Reproductivo</h4>
                <div className="timeline">
                    {!animal.historial || animal.historial.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>Sin historial registrado.</p>
                    ) : (
                        [...animal.historial].reverse().map((h, index) => {
                            const itemClass = h.tipo.toLowerCase().replace(/ /g, '_');
                            return (
                                <div key={index} className={`timeline-item ${itemClass}`}>
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-date">{formatearFecha(h.fecha)}</div>
                                    <div className="timeline-title">{h.tipo}</div>
                                    <div className="timeline-details">{h.detalle}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
