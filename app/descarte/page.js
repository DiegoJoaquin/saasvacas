'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '../../context/FarmContext';
import { obtenerCandidatasDescarte } from '../../lib/calculations';

export default function DescartePage() {
    const { farmData, loading } = useFarm();
    const router = useRouter();

    const candidatas = useMemo(() => {
        if (!farmData || !farmData.animales) return [];
        return obtenerCandidatasDescarte(farmData.animales);
    }, [farmData]);

    const handleDescarteRapido = (diio) => {
        router.push(`/registrar-evento?diio=${diio}&type=Descarte`);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--color-primary)' }}>
                <span style={{ fontSize: '3rem', animation: 'spin 2s linear infinite' }}>🐄</span>
                <p style={{ marginTop: '1rem', fontFamily: 'var(--font-heading)', fontWeight: '600' }}>Cargando recomendaciones de descarte...</p>
            </div>
        );
    }

    return (
        <section id="descarte-view" className="view-section">
            <div className="section-header">
                <div>
                    <h2>Decisiones Clínicas y Descarte Proactivo</h2>
                    <p>Detección automática de animales improductivos mediante reglas y parámetros ganaderos</p>
                </div>
            </div>

            <div className="descarte-container">
                <div className="info-banner">
                    <strong>💡 ¿Cómo funciona la recomendación de descarte?</strong>
                    <p style={{ marginTop: '0.4rem', lineHeight: '1.5' }}>
                        El sistema evalúa el historial reproductivo individual del animal bajo 3 condiciones críticas:
                        <br />• <strong>Vacía Repetitiva:</strong> Diagnósticos de preñez negativos (Vacía) consecutivos en las últimas temporadas sin partos intermedios.
                        <br />• <strong>Edad Crítica:</strong> Animales con 9 o más años (pérdida de capacidad reproductiva y desgaste dentario en campo natural).
                        <br />• <strong>Pérdidas Recurrentes:</strong> Registro de abortos o partos con cría muerta en los últimos dos ciclos.
                    </p>
                </div>

                <div className="descarte-grid">
                    {candidatas.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)', backgroundColor: 'white', borderRadius: '12px' }}>
                            🌿 ¡Excelente eficiencia! No hay vacas recomendadas para descarte en esta revisión.
                        </div>
                    ) : (
                        candidatas.map(c => (
                            <div key={c.animal.diio} className="descarte-card">
                                <div>
                                    <div className="descarte-card-header">
                                        <h4 style={{ margin: 0 }}>DIIO: {c.animal.diio}</h4>
                                        <span className="state-badge vacia">{c.animal.estado}</span>
                                    </div>
                                    <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {c.motivos.map((motivo, idx) => (
                                            <span key={idx} className="reason-badge">
                                                {motivo}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="descarte-card-body">
                                        <p>{c.detalle}</p>
                                        <p style={{ fontWeight: 600, color: 'var(--color-state-descarte)', marginTop: '0.8rem' }}>
                                            ⚠️ Recomendación: Retirar del ciclo productivo.
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    className="btn-danger"
                                    onClick={() => handleDescarteRapido(c.animal.diio)}
                                    type="button"
                                >
                                    Registrar Venta/Descarte
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
