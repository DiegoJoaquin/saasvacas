'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFarm } from '../context/FarmContext';
import { calcularKPIs, calcularAlertas } from '../lib/calculations';

export default function DashboardPage() {
    const { farmData, loading } = useFarm();
    const router = useRouter();

    // Calcular KPIs y Alertas usando useMemo para optimizar
    const { kpis, alertas, funnelData } = useMemo(() => {
        if (!farmData || !farmData.animales) {
            return {
                kpis: {
                    totalVientres: 0,
                    preñadas: 0,
                    vacias: 0,
                    enEncaste: 0,
                    paridas: 0,
                    descartadas: 0,
                    tasaPrenes: 0,
                    tasaParicion: 0,
                    tasaDestete: 0
                },
                alertas: [],
                funnelData: {
                    totalEncaste: 0,
                    totalPrenadas: 0,
                    totalParidas: 0,
                    totalDestetes: 0,
                    percentEncaste: 0,
                    percentPrenes: 0,
                    percentParto: 0,
                    percentDestete: 0
                }
            };
        }

        const calculatedKPIs = calcularKPIs(farmData.animales);
        const calculatedAlertas = calcularAlertas(farmData.animales);

        // Cálculos del Embudo
        const totalEncaste = calculatedKPIs.preñadas + calculatedKPIs.vacias + calculatedKPIs.enEncaste + calculatedKPIs.paridas;
        const totalPrenadas = calculatedKPIs.preñadas + calculatedKPIs.paridas;
        const totalParidas = calculatedKPIs.paridas;
        const totalDestetes = farmData.animales.reduce((acc, curr) => 
            acc + (curr.historial ? curr.historial.filter(h => h.tipo === 'Destete').length : 0)
        , 0);

        const percentEncaste = totalEncaste > 0 ? 100 : 0;
        const percentPrenes = totalEncaste > 0 ? Math.min(100, Math.round((totalPrenadas / totalEncaste) * 100)) : 0;
        const percentParto = totalPrenadas > 0 ? Math.min(100, Math.round((totalParidas / totalPrenadas) * 100)) : 0;
        const percentDestete = totalParidas > 0 ? Math.min(100, Math.round((totalDestetes / totalParidas) * 100)) : 0;

        return {
            kpis: calculatedKPIs,
            alertas: calculatedAlertas,
            funnelData: {
                totalEncaste,
                totalPrenadas,
                totalParidas,
                totalDestetes,
                percentEncaste,
                percentPrenes,
                percentParto,
                percentDestete
            }
        };
    }, [farmData]);

    const handleAlertAction = (diio, actionView, actionType) => {
        router.push(`/registrar-evento?diio=${diio}&type=${actionType}`);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--color-primary)' }}>
                <span style={{ fontSize: '3rem', animation: 'spin 2s linear infinite' }}>🐄</span>
                <p style={{ marginTop: '1rem', fontFamily: 'var(--font-heading)', fontWeight: '600' }}>Cargando datos del predio...</p>
                <style jsx global>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <section id="dashboard-view" className="view-section">
            <div className="section-header">
                <div>
                    <h2>Panel General del Predio</h2>
                    <p>Estado reproductivo y alertas clave del rebaño en tiempo real</p>
                </div>
            </div>

            {/* KPIs Reproductivos */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-title">Vientres Activos</div>
                    <div className="kpi-value">{kpis.totalVientres}</div>
                    <div className="kpi-trend neutral">Vacas y Vaquillas en predio</div>
                </div>
                <div className="kpi-card prenada">
                    <div className="kpi-title">Hembras Preñadas</div>
                    <div className="kpi-value">{kpis.preñadas}</div>
                    <div className="kpi-trend positive">Confirmadas gestantes</div>
                </div>
                <div className="kpi-card vacia">
                    <div className="kpi-title">Hembras Vacías</div>
                    <div className="kpi-value">{kpis.vacias}</div>
                    <div className="kpi-trend neutral">Aptas para encaste / celo</div>
                </div>
                <div className="kpi-card prenada">
                    <div className="kpi-title">Tasa de Preñez</div>
                    <div className="kpi-value">{kpis.tasaPrenes}%</div>
                    <div className="kpi-trend positive">Objetivo predial: &gt;85%</div>
                </div>
                <div className="kpi-card parida">
                    <div className="kpi-title">Tasa de Parición</div>
                    <div className="kpi-value">{kpis.tasaParicion}%</div>
                    <div className="kpi-trend positive">Partos / Preñez activa</div>
                </div>
                <div className="kpi-card parida">
                    <div className="kpi-title">Tasa de Destete</div>
                    <div className="kpi-value">{kpis.tasaDestete}%</div>
                    <div className="kpi-trend positive">Eficiencia de crianza</div>
                </div>
            </div>

            {/* Panel de Alertas Ganaderas */}
            <div className="alerts-panel">
                <div className="alerts-header">
                    <span role="img" aria-label="warning">⚠️</span>
                    <h3>Tareas y Controles Clínicos Pendientes</h3>
                </div>
                <div className="alerts-list">
                    {alertas.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1rem', fontSize: '0.9rem' }}>
                            🟢 No hay tareas ni alertas pendientes en el predio.
                        </div>
                    ) : (
                        alertas.slice(0, 5).map((alert, index) => {
                            let borderLeftColor = 'var(--color-state-encaste)';
                            if (alert.tipo === 'Parto Próximo') borderLeftColor = 'var(--color-state-prenada)';
                            if (alert.tipo === 'Destete Pendiente') borderLeftColor = 'var(--color-state-parida)';

                            return (
                                <div key={index} className="alert-item" style={{ borderLeftColor }}>
                                    <div className="alert-info">
                                        <p>{alert.mensaje}</p>
                                        <span>{alert.tipo}</span>
                                    </div>
                                    <button 
                                        className="alert-action-btn"
                                        onClick={() => handleAlertAction(alert.animal.diio, alert.actionView, alert.actionType)}
                                    >
                                        {alert.actionLabel}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Gráficos y Distribución */}
            <div className="dashboard-details-grid">
                
                {/* Embudo Reproductivo */}
                <div className="chart-card">
                    <h3>Embudo de Eficiencia Reproductiva (Temporada Activa)</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Representa la evolución de los vientres aptos a lo largo de las fases de producción.
                    </p>
                    <div className="funnel-container">
                        <div className="funnel-stage">
                            <span className="funnel-label">1. Encaste / Monta</span>
                            <div className="funnel-bar-wrapper">
                                <div className="funnel-bar" style={{ width: `${funnelData.percentEncaste}%` }}>
                                    {funnelData.totalEncaste}
                                </div>
                                <span className="funnel-percent">{funnelData.percentEncaste}%</span>
                            </div>
                        </div>
                        <div className="funnel-stage">
                            <span className="funnel-label">2. Preñez Diagnosticada</span>
                            <div className="funnel-bar-wrapper">
                                <div className="funnel-bar" style={{ width: `${funnelData.percentPrenes}%` }}>
                                    {funnelData.totalPrenadas}
                                </div>
                                <span className="funnel-percent">{funnelData.percentPrenes}%</span>
                            </div>
                        </div>
                        <div className="funnel-stage">
                            <span className="funnel-label">3. Partos Registrados</span>
                            <div className="funnel-bar-wrapper">
                                <div className="funnel-bar" style={{ width: `${funnelData.percentParto}%` }}>
                                    {funnelData.totalParidas}
                                </div>
                                <span className="funnel-percent">{funnelData.percentParto}%</span>
                            </div>
                        </div>
                        <div className="funnel-stage">
                            <span className="funnel-label">4. Destetes Exitosos</span>
                            <div className="funnel-bar-wrapper">
                                <div className="funnel-bar" style={{ width: `${funnelData.percentDestete}%` }}>
                                    {funnelData.totalDestetes}
                                </div>
                                <span className="funnel-percent">{funnelData.percentDestete}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Distribución del Rebaño */}
                <div className="chart-card">
                    <h3>Estado Actual del Rebaño</h3>
                    <div className="distribution-list" style={{ marginTop: '1.5rem' }}>
                        <div className="distribution-item">
                            <span className="dist-name"><span className="dist-dot vacia"></span>Vacías / Reposo</span>
                            <span className="dist-value">{kpis.vacias}</span>
                        </div>
                        <div className="distribution-item">
                            <span className="dist-name"><span className="dist-dot encaste"></span>En Encaste / Con Toro</span>
                            <span className="dist-value">{kpis.enEncaste}</span>
                        </div>
                        <div className="distribution-item">
                            <span className="dist-name"><span className="dist-dot prenada"></span>Confirmadas Preñadas</span>
                            <span className="dist-value">{kpis.preñadas}</span>
                        </div>
                        <div className="distribution-item">
                            <span className="dist-name"><span className="dist-dot parida"></span>Paridas (Con ternero)</span>
                            <span className="dist-value">{kpis.paridas}</span>
                        </div>
                        <div className="distribution-item" style={{ borderBottom: 'none' }}>
                            <span className="dist-name"><span className="dist-dot descarte"></span>Descartadas</span>
                            <span className="dist-value">{kpis.descartadas}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
