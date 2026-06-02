'use client';

import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { calcularEdad, formatearFecha, obtenerDatosServicio, diferenciaDias } from '../lib/calculations';

export default function AnimalDrawer({ animal: animalProp, onClose }) {
    const { farmData, saveFarmData, actualizarEstadoAnimal } = useFarm();
    const [activeTab, setActiveTab] = useState('servicio'); // Por defecto 'servicio'

    const handleStateChange = async (newState) => {
        const res = await actualizarEstadoAnimal(animal.diio, newState);
        if (res && !res.success) {
            alert(res.message);
        }
    };

    // Obtener la versión más fresca del animal desde el estado global del predio para actualizar la UI al instante
    const animal = React.useMemo(() => {
        if (!animalProp || !farmData || !farmData.animales) return animalProp;
        return farmData.animales.find(a => a.diio === animalProp.diio) || animalProp;
    }, [animalProp, farmData]);

    // Estados para edición en línea (Inline Editing)
    const [editingIndex, setEditingIndex] = useState(null); // Índice en filasServicio (0 a 4)
    const [editFecha, setEditFecha] = useState('');
    const [editToro, setEditToro] = useState('');
    const [editInseminador, setEditInseminador] = useState('');
    const [editLapso, setEditLapso] = useState('');

    // Obtener y preparar servicios de encaste
    const servicios = useMemo(() => {
        if (!animal || !animal.historial) return [];
        
        // Filtrar y guardar índice original del historial
        const encastes = animal.historial
            .map((h, originalIndex) => ({ ...h, originalIndex }))
            .filter(h => h.tipo === 'Encaste')
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            
        return encastes.map((h, index) => {
            const { toro, inseminador } = obtenerDatosServicio(h);
            let lapso = h.lapso; // Usar lapso manual si existe
            if (!lapso) {
                if (index > 0) {
                    const dias = diferenciaDias(encastes[index - 1].fecha, h.fecha);
                    lapso = `${dias} días`;
                } else {
                    lapso = '-';
                }
            }
            return {
                originalIndex: h.originalIndex,
                fecha: h.fecha, // Fecha ISO (YYYY-MM-DD) para el input date
                toro,
                inseminador,
                lapso
            };
        });
    }, [animal?.historial]);

    // Crear un arreglo de exactamente 5 elementos
    const filasServicio = useMemo(() => {
        const filas = [...servicios];
        while (filas.length < 5) {
            filas.push({ originalIndex: -1, fecha: '', toro: '', inseminador: '', lapso: '' });
        }
        if (filas.length > 5) {
            return filas.slice(-5);
        }
        return filas;
    }, [servicios]);

    // Encontrar el índice de la primera fila vacía para renderizar el botón "+"
    const firstEmptyIndex = useMemo(() => {
        return filasServicio.findIndex(f => !f.fecha);
    }, [filasServicio]);

    if (!animal) return null;

    const edad = calcularEdad(animal.fechaNacimiento);
    const fechaNac = formatearFecha(animal.fechaNacimiento);

    const handleStartEditing = (index, fila) => {
        setEditingIndex(index);
        setEditFecha(fila.fecha || new Date().toISOString().split('T')[0]);
        setEditToro(fila.toro || '');
        setEditInseminador(fila.inseminador || '');
        setEditLapso(fila.lapso || '');
    };

    const handleCancelEditing = () => {
        setEditingIndex(null);
    };

    const handleSaveService = (index) => {
        if (!editFecha) {
            alert('Debe ingresar una fecha.');
            return;
        }

        const fila = filasServicio[index];
        const clonedFarmData = JSON.parse(JSON.stringify(farmData));
        const activeAnimal = clonedFarmData.animales.find(a => a.diio === animal.diio);

        if (!activeAnimal) return;

        if (fila.originalIndex !== undefined && fila.originalIndex !== null && fila.originalIndex !== -1) {
            // Edición de fila existente
            const eventIndex = fila.originalIndex;
            activeAnimal.historial[eventIndex].fecha = editFecha;
            activeAnimal.historial[eventIndex].toro = editToro;
            activeAnimal.historial[eventIndex].inseminador = editInseminador || 'N/R';
            activeAnimal.historial[eventIndex].lapso = editLapso;
            activeAnimal.historial[eventIndex].detalle = `Encaste iniciado con ${editToro}. Inseminador: ${editInseminador || 'N/R'}.`;
        } else {
            // Adición de nueva fila (Encaste)
            const nuevoEncaste = {
                fecha: editFecha,
                tipo: 'Encaste',
                detalle: `Encaste iniciado con ${editToro}. Inseminador: ${editInseminador || 'N/R'}.`,
                toro: editToro,
                inseminador: editInseminador || 'N/R',
                lapso: editLapso
            };
            activeAnimal.estado = 'En Encaste';
            activeAnimal.historial.push(nuevoEncaste);
        }

        // Ordenar historial por fecha
        activeAnimal.historial.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        // Guardar cambios en el contexto global / LocalStorage
        saveFarmData(clonedFarmData);
        setEditingIndex(null);
        alert('Registro guardado correctamente.');
    };

    return (
        <div className="drawer-overlay active" onClick={onClose}>
            <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
                <div className="drawer-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Ficha Animal: DIIO {animal.diio}</h3>
                    <span className={`state-badge ${animal.estado.toLowerCase().replace(/ /g, '_')}`}>
                        {animal.estado}
                    </span>
                    <button className="btn-close" style={{ marginLeft: 'auto' }} onClick={onClose}>&times;</button>
                </div>

                {/* Perfil del Animal */}
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '1.2rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.85rem', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>Categoría:</span>
                            <strong style={{ fontSize: '0.9rem' }}>{animal.categoria}</strong>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>Raza:</span>
                            <strong style={{ fontSize: '0.9rem' }}>{animal.raza}</strong>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>Estado:</span>
                            <select 
                                value={animal.estado} 
                                onChange={(e) => handleStateChange(e.target.value)}
                                style={{
                                    padding: '0.3rem 0.5rem',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    border: '1px solid hsl(210, 10%, 80%)',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    width: '100%',
                                    outline: 'none'
                                }}
                            >
                                <option value="Vacía">Vacía</option>
                                <option value="En Encaste">En Encaste</option>
                                <option value="Preñada">Preñada</option>
                                <option value="Parida">Parida</option>
                                <option value="Descartada">Descartada</option>
                            </select>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>Edad:</span>
                            <strong style={{ fontSize: '0.9rem' }}>{edad} años</strong>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>F. Nacimiento:</span>
                            <strong style={{ fontSize: '0.9rem' }}>{fechaNac}</strong>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>Partos Exitosos Totales:</span>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--color-state-prenada)' }}>{animal.partosExitosos}</strong>
                        </div>
                    </div>
                </div>

                {/* Menú de pestañas (Tabs) */}
                <div style={{ display: 'flex', borderBottom: '1px solid hsl(210, 10%, 88%)', marginBottom: '1.5rem', gap: '0.5rem' }}>
                    <button 
                        type="button"
                        onClick={() => { setActiveTab('servicio'); setEditingIndex(null); }} 
                        style={{
                            flex: 1,
                            padding: '0.8rem',
                            border: 'none',
                            borderBottom: activeTab === 'servicio' ? '3px solid var(--color-accent)' : '3px solid transparent',
                            backgroundColor: 'transparent',
                            fontWeight: '700',
                            color: activeTab === 'servicio' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-heading)',
                            fontSize: '0.9rem',
                            transition: 'var(--transition-smooth)'
                        }}
                    >
                        📋 Registro por Servicio
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setActiveTab('historial'); setEditingIndex(null); }} 
                        style={{
                            flex: 1,
                            padding: '0.8rem',
                            border: 'none',
                            borderBottom: activeTab === 'historial' ? '3px solid var(--color-accent)' : '3px solid transparent',
                            backgroundColor: 'transparent',
                            fontWeight: '700',
                            color: activeTab === 'historial' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-heading)',
                            fontSize: '0.9rem',
                            transition: 'var(--transition-smooth)'
                        }}
                    >
                        🩺 Historial Clínico
                    </button>
                </div>

                {/* Contenido dinámico */}
                {activeTab === 'servicio' && (
                    <div>
                        <h4 style={{ marginBottom: '0.8rem' }}>Registro por Servicio (Últimos 5 encastes)</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="service-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--color-bg-main)', borderBottom: '2px solid hsl(210, 10%, 88%)' }}>
                                        <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '700' }}>Fecha</th>
                                        <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '700' }}>Toro</th>
                                        <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '700' }}>Inseminador</th>
                                        <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '700' }}>Lapso Inter Celo</th>
                                        {editingIndex !== null && <th style={{ padding: '0.6rem', textAlign: 'center', fontWeight: '700' }}>Acción</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filasServicio.map((fila, index) => {
                                        const isEditing = editingIndex === index;
                                        const isFirstEmpty = index === firstEmptyIndex;
                                        const isAfterEmpty = index > firstEmptyIndex && firstEmptyIndex !== -1;

                                        if (isEditing) {
                                            return (
                                                <tr key={index} style={{ borderBottom: '1px solid hsl(210, 10%, 92%)' }}>
                                                    <td style={{ padding: '0.4rem' }}>
                                                        <input 
                                                            type="date" 
                                                            value={editFecha} 
                                                            onChange={(e) => setEditFecha(e.target.value)} 
                                                            style={{ padding: '0.4rem', fontSize: '0.8rem', width: '110px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.4rem' }}>
                                                        <input 
                                                            type="text" 
                                                            value={editToro} 
                                                            onChange={(e) => setEditToro(e.target.value)} 
                                                            placeholder="Toro/IA"
                                                            style={{ padding: '0.4rem', fontSize: '0.8rem', width: '90px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.4rem' }}>
                                                        <input 
                                                            type="text" 
                                                            value={editInseminador} 
                                                            onChange={(e) => setEditInseminador(e.target.value)} 
                                                            placeholder="Inseminador"
                                                            style={{ padding: '0.4rem', fontSize: '0.8rem', width: '90px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.4rem' }}>
                                                        <input 
                                                            type="text" 
                                                            value={editLapso} 
                                                            onChange={(e) => setEditLapso(e.target.value)} 
                                                            placeholder="Ej. 21 días"
                                                            style={{ padding: '0.4rem', fontSize: '0.8rem', width: '90px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.4rem', textAlign: 'center', display: 'flex', gap: '0.3rem', justifyContent: 'center', height: '100%' }}>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleSaveService(index)}
                                                            style={{ border: 'none', background: 'var(--color-state-prenada)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                            title="Guardar"
                                                        >
                                                            ✔
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={handleCancelEditing}
                                                            style={{ border: 'none', background: 'var(--color-state-descarte)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                            title="Cancelar"
                                                        >
                                                            ✖
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        if (isFirstEmpty) {
                                            return (
                                                <tr key={index} style={{ borderBottom: '1px solid hsl(210, 10%, 92%)', height: '35px' }}>
                                                    <td colSpan={editingIndex !== null ? 5 : 4} style={{ padding: '0.6rem', textAlign: 'center', cursor: 'pointer', color: 'var(--color-accent)', fontWeight: '700' }} onClick={() => handleStartEditing(index, fila)}>
                                                        ➕ Registrar / Agregar Encaste
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        if (isAfterEmpty) {
                                            return (
                                                <tr key={index} style={{ borderBottom: '1px solid hsl(210, 10%, 92%)', height: '35px' }}>
                                                    <td style={{ padding: '0.6rem', color: 'transparent' }}>-</td>
                                                    <td style={{ padding: '0.6rem' }}></td>
                                                    <td style={{ padding: '0.6rem' }}></td>
                                                    <td style={{ padding: '0.6rem' }}></td>
                                                    {editingIndex !== null && <td style={{ padding: '0.6rem' }}></td>}
                                                </tr>
                                            );
                                        }

                                        return (
                                            <tr 
                                                key={index} 
                                                style={{ borderBottom: '1px solid hsl(210, 10%, 92%)', height: '35px', cursor: 'pointer' }}
                                                onClick={() => handleStartEditing(index, fila)}
                                                title="Haga clic para editar esta fila"
                                            >
                                                <td style={{ padding: '0.6rem' }}>{formatearFecha(fila.fecha)} ✏️</td>
                                                <td style={{ padding: '0.6rem' }}>{fila.toro}</td>
                                                <td style={{ padding: '0.6rem' }}>{fila.inseminador}</td>
                                                <td style={{ padding: '0.6rem', color: 'var(--color-accent)', fontWeight: fila.lapso !== '-' ? '600' : 'normal' }}>{fila.lapso}</td>
                                                {editingIndex !== null && <td style={{ padding: '0.6rem' }}></td>}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'historial' && (
                    <div>
                        <h4 style={{ marginBottom: '0.8rem' }}>Historial Clínico Reproductivo</h4>
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
                                            <div className="timeline-details">{h.details || h.detalle}</div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
