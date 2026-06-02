'use client';

import React from 'react';
import { calcularEdad, formatearFecha, obtenerDatosServicio, diferenciaDias } from '../lib/calculations';

export default function AnimalDrawer({ animal, onClose }) {
    if (!animal) return null;

    const edad = calcularEdad(animal.fechaNacimiento);
    const fechaNac = formatearFecha(animal.fechaNacimiento);

    // Obtener y preparar servicios de encaste
    const servicios = React.useMemo(() => {
        if (!animal.historial) return [];
        
        // Filtrar y ordenar eventos de encaste cronológicamente
        const encastes = animal.historial
            .filter(h => h.tipo === 'Encaste')
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            
        // Mapear cada evento calculando el lapso inter celo
        return encastes.map((h, index) => {
            const { toro, inseminador } = obtenerDatosServicio(h);
            let lapso = '-';
            if (index > 0) {
                const dias = diferenciaDias(encastes[index - 1].fecha, h.fecha);
                lapso = `${dias} días`;
            }
            return {
                fecha: formatearFecha(h.fecha),
                toro,
                inseminador,
                lapso
            };
        });
    }, [animal.historial]);

    // Crear un arreglo de exactamente 5 elementos (rellenando con vacíos si hay menos de 5)
    const filasServicio = React.useMemo(() => {
        const filas = [...servicios];
        while (filas.length < 5) {
            filas.push({ fecha: '', toro: '', inseminador: '', lapso: '' });
        }
        // Si hay más de 5, mostrar los últimos 5 servicios
        if (filas.length > 5) {
            return filas.slice(-5);
        }
        return filas;
    }, [servicios]);

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

                {/* Registro por Servicio */}
                <h4 style={{ marginBottom: '0.8rem' }}>Registro por Servicio</h4>
                <div style={{ marginBottom: '2rem', overflowX: 'auto' }}>
                    <table className="service-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-bg-main)', borderBottom: '2px solid hsl(210, 10%, 88%)' }}>
                                <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '700' }}>Fecha</th>
                                <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '700' }}>Toro</th>
                                <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '700' }}>Inseminador</th>
                                <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '700' }}>Lapso Inter Celo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filasServicio.map((fila, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid hsl(210, 10%, 92%)', height: '35px' }}>
                                    <td style={{ padding: '0.6rem' }}>{fila.fecha || <span style={{ color: 'transparent' }}>-</span>}</td>
                                    <td style={{ padding: '0.6rem' }}>{fila.toro}</td>
                                    <td style={{ padding: '0.6rem' }}>{fila.inseminador}</td>
                                    <td style={{ padding: '0.6rem', color: 'var(--color-accent)', fontWeight: fila.lapso !== '-' ? '600' : 'normal' }}>{fila.lapso}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
