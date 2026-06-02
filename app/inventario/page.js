'use client';

import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { calcularEdad, formatearFecha } from '../../lib/calculations';
import AnimalDrawer from '../../components/AnimalDrawer';

export default function InventarioPage() {
    const { farmData, loading, agregarAnimal } = useFarm();

    // Estado para búsqueda y filtros
    const [searchVal, setSearchVal] = useState('');
    const [filterEstado, setFilterEstado] = useState('Todos');
    const [filterCategoria, setFilterCategoria] = useState('Todos');
    const [filterRaza, setFilterRaza] = useState('Todos');

    // Estado para el drawer de detalles (guardamos el DIIO para que sea reactivo al contexto)
    const [selectedAnimalDiio, setSelectedAnimalDiio] = useState(null);

    // Obtener el animal seleccionado de forma reactiva de los datos frescos del predio
    const selectedAnimal = useMemo(() => {
        if (!selectedAnimalDiio || !farmData || !farmData.animales) return null;
        return farmData.animales.find(a => a.diio === selectedAnimalDiio) || null;
    }, [selectedAnimalDiio, farmData]);

    // Estado para el formulario de nuevo animal
    const [newDiio, setNewDiio] = useState('');
    const [newCategoria, setNewCategoria] = useState('Vaquilla');
    const [newRaza, setNewRaza] = useState('Angus Negro');
    const [newNacimiento, setNewNacimiento] = useState('');

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Extraer razas únicas existentes en el rebaño de forma dinámica
    const uniqueRazas = useMemo(() => {
        if (!farmData || !farmData.animales) return [];
        const razas = farmData.animales.map(a => a.raza).filter(Boolean);
        return ['Todos', ...Array.from(new Set(razas))].sort();
    }, [farmData]);

    // Filtrar animales
    const animalesFiltrados = useMemo(() => {
        if (!farmData || !farmData.animales) return [];

        return farmData.animales.filter(a => {
            const matchSearch = a.diio.toLowerCase().includes(searchVal.toLowerCase());
            const matchRaza = filterRaza === 'Todos' || a.raza === filterRaza;
            const matchEstado = filterEstado === 'Todos' || a.estado === filterEstado;
            const matchCategoria = filterCategoria === 'Todos' || a.categoria === filterCategoria;
            return matchSearch && matchRaza && matchEstado && matchCategoria;
        });
    }, [farmData, searchVal, filterRaza, filterEstado, filterCategoria]);

    const handleAddAnimalSubmit = (e) => {
        e.preventDefault();

        // Validar DIIO chileno
        if (!/^\d{9}$/.test(newDiio)) {
            alert('El DIIO debe contener exactamente 9 dígitos numéricos chilenos.');
            return;
        }

        const res = agregarAnimal({
            diio: newDiio,
            categoria: newCategoria,
            raza: newRaza,
            fechaNacimiento: newNacimiento
        });

        if (res && !res.success) {
            alert(res.message);
            return;
        }

        alert('Animal registrado en el predio correctamente.');
        setNewDiio('');
        setNewNacimiento('');
        setNewCategoria('Vaquilla');
        setNewRaza('Angus Negro');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--color-primary)' }}>
                <span style={{ fontSize: '3rem', animation: 'spin 2s linear infinite' }}>🐄</span>
                <p style={{ marginTop: '1rem', fontFamily: 'var(--font-heading)', fontWeight: '600' }}>Cargando inventario...</p>
            </div>
        );
    }

    return (
        <section id="inventario-view" className="view-section">
            <div className="section-header">
                <div>
                    <h2>Inventario Bovino</h2>
                    <p>Control individual de vientres, historiales reproductivos y DIIO SAG</p>
                </div>
            </div>

            {/* Registro rápido de nuevo animal */}
            <div className="controls-bar" style={{ marginBottom: '1rem', padding: '0.8rem 1.2rem', backgroundColor: 'var(--color-primary-light)', color: 'white', border: 'none' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Ingresar Nuevo Vientre al Predio</h3>
            </div>
            <div className="form-card" style={{ marginBottom: '2.5rem', padding: '1.5rem', maxWidth: '100%' }}>
                <form onSubmit={handleAddAnimalSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto', gap: '1rem', alignItems: 'flex-end' }}>
                    <div className="form-group">
                        <label htmlFor="new-diio">DIIO (9 dígitos oficiales)</label>
                        <input 
                            type="text" 
                            id="new-diio" 
                            placeholder="Ej. 140801234" 
                            required 
                            value={newDiio}
                            onChange={(e) => setNewDiio(e.target.value)}
                            pattern="\d{9}" 
                            title="Debe contener exactamente 9 números (formato oficial chileno)"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-categoria">Categoría inicial</label>
                        <select 
                            id="new-categoria" 
                            required
                            value={newCategoria}
                            onChange={(e) => setNewCategoria(e.target.value)}
                        >
                            <option value="Vaquilla">Vaquilla (Primeriza sin partos)</option>
                            <option value="Vaca">Vaca (Al menos un parto previo)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-raza">Raza</label>
                        <select 
                            id="new-raza" 
                            required
                            value={newRaza}
                            onChange={(e) => setNewRaza(e.target.value)}
                        >
                            <option value="Angus Negro">Angus Negro</option>
                            <option value="Angus Colorado">Angus Colorado</option>
                            <option value="Hereford">Hereford</option>
                            <option value="Clavel de Carne">Clavel de Carne</option>
                            <option value="Overo Negro">Overo Negro</option>
                            <option value="Hibrido/Cruza">Híbrido / Cruza</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-nacimiento">Fecha de Nacimiento</label>
                        <input 
                            type="date" 
                            id="new-nacimiento" 
                            max={todayStr} 
                            required
                            value={newNacimiento}
                            onChange={(e) => setNewNacimiento(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ height: '42px', backgroundColor: 'var(--color-accent)' }}>
                        Agregar Hembra
                    </button>
                </form>
            </div>

            {/* Buscador e Inventario */}
            <div className="controls-bar">
                <div className="search-input-wrapper">
                    <input 
                        type="text" 
                        id="search-diio" 
                        placeholder="Ingresar DIIO..."
                        style={{ paddingLeft: '1rem' }}
                        value={searchVal}
                        onChange={(e) => setSearchVal(e.target.value)}
                    />
                </div>
                <select 
                    id="filter-raza" 
                    className="filter-select"
                    value={filterRaza}
                    onChange={(e) => setFilterRaza(e.target.value)}
                >
                    <option value="Todos">Todas las Razas</option>
                    {uniqueRazas.filter(r => r !== 'Todos').map(raza => (
                        <option key={raza} value={raza}>{raza}</option>
                    ))}
                </select>
                <select 
                    id="filter-estado" 
                    className="filter-select"
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                >
                    <option value="Todos">Todos los Estados</option>
                    <option value="Vacía">Vacía</option>
                    <option value="En Encaste">En Encaste</option>
                    <option value="Preñada">Preñada</option>
                    <option value="Parida">Parida</option>
                    <option value="Descartada">Descartada</option>
                </select>
                <select 
                    id="filter-categoria" 
                    className="filter-select"
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value)}
                >
                    <option value="Todos">Todas las Categorías</option>
                    <option value="Vaca">Vaca</option>
                    <option value="Vaquilla">Vaquilla</option>
                </select>
            </div>

            {/* Grilla de animales */}
            <div className="animal-grid">
                {animalesFiltrados.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        🔍 No se encontraron vacas o vaquillas con los filtros seleccionados.
                    </div>
                ) : (
                    animalesFiltrados.map(a => {
                        const ultimoEvento = a.historial && a.historial.length > 0 ? a.historial[a.historial.length - 1] : null;
                        const ultimoEventoTexto = ultimoEvento 
                            ? `${ultimoEvento.tipo}: ${formatearFecha(ultimoEvento.fecha)}`
                            : 'Sin registros';

                        const edad = calcularEdad(a.fechaNacimiento);
                        const stateBadgeClass = a.estado.toLowerCase().replace(/ /g, '_');

                        return (
                            <div 
                                key={a.diio} 
                                className="animal-card"
                                onClick={() => setSelectedAnimalDiio(a.diio)}
                            >
                                <div className="animal-card-header">
                                    <span className="diio-badge">🇨🇱 {a.diio}</span>
                                    <span className={`state-badge ${stateBadgeClass}`}>{a.estado}</span>
                                </div>
                                <div className="animal-card-body">
                                    <div className="animal-info-row">
                                        <span className="info-label">Categoría:</span>
                                        <span className="info-value">{a.categoria}</span>
                                    </div>
                                    <div className="animal-info-row">
                                        <span className="info-label">Raza:</span>
                                        <span className="info-value">{a.raza}</span>
                                    </div>
                                    <div className="animal-info-row">
                                        <span className="info-label">Edad:</span>
                                        <span className="info-value">{edad} años</span>
                                    </div>
                                    <div className="animal-info-row">
                                        <span className="info-label">Partos Exitosos:</span>
                                        <span className="info-value">{a.partosExitosos}</span>
                                    </div>
                                </div>
                                <div className="animal-card-footer">
                                    <span className="last-event-text">{ultimoEventoTexto}</span>
                                    <button className="btn-details" type="button">
                                        Ver Historial ➔
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Ficha / Detalle Animal */}
            <AnimalDrawer 
                animal={selectedAnimal} 
                onClose={() => setSelectedAnimalDiio(null)} 
            />
        </section>
    );
}
