'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFarm } from '../../context/FarmContext';

function RegistrarEventoForm() {
    const { farmData, loading, registrarEvento } = useFarm();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Obtener parámetros de la URL para preselección
    const paramDiio = searchParams.get('diio');
    const paramType = searchParams.get('type');

    // Tipo de evento activo
    const [eventType, setEventType] = useState('Encaste');

    // Estado de selección del animal
    const [selectedDiio, setSelectedDiio] = useState('');

    // Estados para campos específicos
    const [fecha, setFecha] = useState('');

    // Encaste fields
    const [encMetodo, setEncMetodo] = useState('Inseminación Artificial');
    const [encPotrero, setEncPotrero] = useState('');
    const [encObs, setEncObs] = useState('');

    // Preñez fields
    const [pregResultado, setPregResultado] = useState('Preñada');
    const [pregVeterinario, setPregVeterinario] = useState('');
    const [pregObs, setPregObs] = useState('');

    // Parto fields
    const [partEstado, setPartEstado] = useState('Vivo');
    const [partSexo, setPartSexo] = useState('Macho');
    const [partCriaDiio, setPartCriaDiio] = useState('');
    const [partFacilidad, setPartFacilidad] = useState('Sin ayuda');
    const [partObs, setPartObs] = useState('');

    // Destete fields
    const [destPeso, setDestPeso] = useState('220');
    const [destObs, setDestObs] = useState('');

    // Descarte fields
    const [descMotivo, setDescMotivo] = useState('Edad avanzada');
    const [descObs, setDescObs] = useState('');

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Inicializar fecha
    useEffect(() => {
        setFecha(todayStr);
    }, [todayStr]);

    // Escuchar parámetros de la URL
    useEffect(() => {
        if (paramType) {
            setEventType(paramType);
        }
    }, [paramType]);

    // Establecer el DIIO una vez que cargan los datos y el parámetro está disponible
    useEffect(() => {
        if (paramDiio && farmData) {
            setSelectedDiio(paramDiio);
        }
    }, [paramDiio, farmData, eventType]);

    // Cuando cambia el tipo de evento, reiniciar la selección de DIIO si el animal preseleccionado ya no es apto
    useEffect(() => {
        if (farmData && selectedDiio) {
            const animal = farmData.animales.find(a => a.diio === selectedDiio);
            if (animal) {
                const esApto = verificarAptitud(animal, eventType);
                if (!esApto && !paramDiio) {
                    setSelectedDiio('');
                }
            }
        }
    }, [eventType, farmData]);

    const verificarAptitud = (animal, tipo) => {
        if (animal.estado === 'Descartada') return false;

        switch (tipo) {
            case 'Encaste':
                return animal.estado === 'Vacía' || animal.estado === 'Parida';
            case 'Preñez':
                return animal.estado === 'En Encaste' || animal.estado === 'Vacía';
            case 'Parto':
                return animal.estado === 'Preñada';
            case 'Destete':
                return animal.estado === 'Parida';
            case 'Descarte':
                return true;
            default:
                return true;
        }
    };

    // Filtrado inteligente de animales aptos
    const hembrasAptas = useMemo(() => {
        if (!farmData || !farmData.animales) return [];

        return farmData.animales.filter(a => verificarAptitud(a, eventType));
    }, [farmData, eventType]);

    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (!selectedDiio) {
            alert('Debe seleccionar un animal.');
            return;
        }

        let eventData = { fecha };

        switch (eventType) {
            case 'Encaste':
                eventData = {
                    ...eventData,
                    metodo: encMetodo,
                    potrero: encPotrero || (farmData?.potreros?.[0] || 'Corral'),
                    obs: encObs
                };
                break;
            case 'Preñez':
                eventData = {
                    ...eventData,
                    resultado: pregResultado,
                    veterinario: pregVeterinario,
                    obs: pregObs
                };
                break;
            case 'Parto':
                if (partCriaDiio && !/^\d{9}$/.test(partCriaDiio)) {
                    alert('El DIIO de la cría debe contener exactamente 9 dígitos.');
                    return;
                }
                eventData = {
                    ...eventData,
                    estadoCria: partEstado,
                    sexo: partSexo,
                    criaDiio: partCriaDiio,
                    facilidad: partFacilidad,
                    obs: partObs
                };
                break;
            case 'Destete':
                eventData = {
                    ...eventData,
                    peso: destPeso,
                    obs: destObs
                };
                break;
            case 'Descarte':
                eventData = {
                    ...eventData,
                    motivo: descMotivo,
                    obs: descObs
                };
                break;
        }

        registrarEvento(selectedDiio, eventType, eventData);

        alert('Evento reproductivo registrado correctamente.');
        router.push('/inventario');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                <p>Cargando datos del predio...</p>
            </div>
        );
    }

    const toros = farmData?.toros || [];
    const potreros = farmData?.potreros || [];

    return (
        <section id="registrar-evento-view" className="view-section">
            <div className="section-header">
                <div>
                    <h2>Registrar Evento Reproductivo</h2>
                    <p>Seleccione el evento y asocie los datos del DIIO correspondiente sin doble digitación</p>
                </div>
            </div>

            <div className="form-card">
                {/* Selector de Evento */}
                <div className="event-type-selector">
                    <button 
                        type="button" 
                        className={`event-type-btn ${eventType === 'Encaste' ? 'active' : ''}`}
                        onClick={() => setEventType('Encaste')}
                    >
                        <span style={{ fontSize: '1.8rem' }}>🐂</span>
                        Encaste
                    </button>
                    <button 
                        type="button" 
                        className={`event-type-btn ${eventType === 'Preñez' ? 'active' : ''}`}
                        onClick={() => setEventType('Preñez')}
                    >
                        <span style={{ fontSize: '1.8rem' }}>🩺</span>
                        Tacto / Eco
                    </button>
                    <button 
                        type="button" 
                        className={`event-type-btn ${eventType === 'Parto' ? 'active' : ''}`}
                        onClick={() => setEventType('Parto')}
                    >
                        <span style={{ fontSize: '1.8rem' }}>👶</span>
                        Parto
                    </button>
                    <button 
                        type="button" 
                        className={`event-type-btn ${eventType === 'Destete' ? 'active' : ''}`}
                        onClick={() => setEventType('Destete')}
                    >
                        <span style={{ fontSize: '1.8rem' }}>🌾</span>
                        Destete
                    </button>
                    <button 
                        type="button" 
                        className={`event-type-btn ${eventType === 'Descarte' ? 'active' : ''}`}
                        onClick={() => setEventType('Descarte')}
                    >
                        <span style={{ fontSize: '1.8rem' }}>🏷️</span>
                        Descarte
                    </button>
                </div>

                {/* Formulario de ingreso */}
                <form onSubmit={handleFormSubmit}>
                    <div className="event-form-fields">
                        <div className="form-group full-width">
                            <label htmlFor="event-animal-select">
                                DIIO Hembra (Muestra filtrado inteligente para evitar errores)
                            </label>
                            <select 
                                id="event-animal-select" 
                                required
                                value={selectedDiio}
                                onChange={(e) => setSelectedDiio(e.target.value)}
                            >
                                <option value="" disabled>Seleccione DIIO...</option>
                                {/* Si hay un animal preseleccionado que fue descartado o no cumple los filtros en general, lo mostramos igualmente para no romper el flujo */}
                                {paramDiio && !hembrasAptas.some(a => a.diio === paramDiio) && farmData?.animales && (
                                    (() => {
                                        const pre = farmData.animales.find(a => a.diio === paramDiio);
                                        return pre ? (
                                            <option key={pre.diio} value={pre.diio}>
                                                DIIO {pre.diio} ({pre.categoria} - {pre.raza} - {pre.estado}) [Preseleccionado]
                                            </option>
                                        ) : null;
                                    })()
                                )}
                                {hembrasAptas.map(a => (
                                    <option key={a.diio} value={a.diio}>
                                        DIIO {a.diio} ({a.categoria} - {a.raza} - {a.estado})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Contenedor para campos específicos del tipo de evento */}
                        <div id="event-specific-fields" className="event-form-fields full-width" style={{ gridColumn: 'span 2', display: 'grid', gap: '1.5rem' }}>
                            {eventType === 'Encaste' && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="enc-fecha">Fecha Inicio Encaste</label>
                                        <input 
                                            type="date" 
                                            id="enc-fecha" 
                                            required
                                            value={fecha}
                                            onChange={(e) => setFecha(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="enc-metodo">Toro / Método</label>
                                        <select 
                                            id="enc-metodo" 
                                            required
                                            value={encMetodo}
                                            onChange={(e) => setEncMetodo(e.target.value)}
                                        >
                                            <option value="Inseminación Artificial">Inseminación Artificial (IA)</option>
                                            {toros.map(t => (
                                                <option key={t.id} value={t.name}>{t.name} [DIIO: {t.diio}]</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="enc-potrero">Potrero</label>
                                        <select 
                                            id="enc-potrero" 
                                            required
                                            value={encPotrero}
                                            onChange={(e) => setEncPotrero(e.target.value)}
                                        >
                                            <option value="" disabled>Seleccione Potrero...</option>
                                            {potreros.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="enc-obs">Observaciones de Encaste</label>
                                        <input 
                                            type="text" 
                                            id="enc-obs" 
                                            placeholder="Ej. Retorno a celo, toro activo..."
                                            value={encObs}
                                            onChange={(e) => setEncObs(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {eventType === 'Preñez' && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="preg-fecha">Fecha Diagnóstico</label>
                                        <input 
                                            type="date" 
                                            id="preg-fecha" 
                                            required
                                            value={fecha}
                                            onChange={(e) => setFecha(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="preg-resultado">Resultado del Tacto / Eco</label>
                                        <select 
                                            id="preg-resultado" 
                                            required
                                            value={pregResultado}
                                            onChange={(e) => setPregResultado(e.target.value)}
                                        >
                                            <option value="Preñada">Confirmada Preñada (Positivo)</option>
                                            <option value="Vacía">Vacía (Negativo)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="preg-veterinario">Veterinario / Operador</label>
                                        <input 
                                            type="text" 
                                            id="preg-veterinario" 
                                            placeholder="Dr. Carter / Técnico"
                                            value={pregVeterinario}
                                            onChange={(e) => setPregVeterinario(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="preg-obs">Detalles (Eco / Días de gestación)</label>
                                        <input 
                                            type="text" 
                                            id="preg-obs" 
                                            placeholder="Ej. Feto de 60 días, gestación normal..."
                                            value={pregObs}
                                            onChange={(e) => setPregObs(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {eventType === 'Parto' && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="part-fecha">Fecha de Parto</label>
                                        <input 
                                            type="date" 
                                            id="part-fecha" 
                                            required
                                            value={fecha}
                                            onChange={(e) => setFecha(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="part-estado">Estado de la Cría</label>
                                        <select 
                                            id="part-estado" 
                                            required
                                            value={partEstado}
                                            onChange={(e) => setPartEstado(e.target.value)}
                                        >
                                            <option value="Vivo">Nacido Vivo</option>
                                            <option value="Muerto">Nacido Muerto / Mortinato</option>
                                            <option value="Aborto">Aborto</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="part-sexo">Sexo de la Cría (Si nació viva)</label>
                                        <select 
                                            id="part-sexo"
                                            value={partSexo}
                                            onChange={(e) => setPartSexo(e.target.value)}
                                        >
                                            <option value="Macho">Macho</option>
                                            <option value="Hembra">Hembra</option>
                                            <option value="N/A">N/A</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="part-cria-diio">DIIO de la Cría (Opcional)</label>
                                        <input 
                                            type="text" 
                                            id="part-cria-diio" 
                                            placeholder="Ej. 140859999" 
                                            maxLength="9"
                                            value={partCriaDiio}
                                            onChange={(e) => setPartCriaDiio(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="part-facilidad">Facilidad de Parto</label>
                                        <select 
                                            id="part-facilidad" 
                                            required
                                            value={partFacilidad}
                                            onChange={(e) => setPartFacilidad(e.target.value)}
                                        >
                                            <option value="Sin ayuda">Normal (Sin ayuda)</option>
                                            <option value="Ayuda leve">Asistido leve (Tracción manual)</option>
                                            <option value="Ayuda veterinaria">Distócico severo (Asistencia Veterinaria/Cesárea)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="part-obs">Observaciones del Parto</label>
                                        <input 
                                            type="text" 
                                            id="part-obs" 
                                            placeholder="Ej. Buena habilidad materna, ubre sana..."
                                            value={partObs}
                                            onChange={(e) => setPartObs(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {eventType === 'Destete' && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="dest-fecha">Fecha de Destete</label>
                                        <input 
                                            type="date" 
                                            id="dest-fecha" 
                                            required
                                            value={fecha}
                                            onChange={(e) => setFecha(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="dest-peso">Peso Promedio Estimado Cría (kg)</label>
                                        <input 
                                            type="number" 
                                            id="dest-peso" 
                                            min="100" 
                                            max="350" 
                                            required
                                            value={destPeso}
                                            onChange={(e) => setDestPeso(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group text-obs">
                                        <label htmlFor="dest-obs">Observaciones</label>
                                        <input 
                                            type="text" 
                                            id="dest-obs" 
                                            placeholder="Ej. Destete a los 7 meses. Ternero bien desarrollado..."
                                            value={destObs}
                                            onChange={(e) => setDestObs(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {eventType === 'Descarte' && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="desc-fecha">Fecha de Descarte</label>
                                        <input 
                                            type="date" 
                                            id="desc-fecha" 
                                            required
                                            value={fecha}
                                            onChange={(e) => setFecha(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="desc-motivo">Motivo de Descarte</label>
                                        <select 
                                            id="desc-motivo" 
                                            required
                                            value={descMotivo}
                                            onChange={(e) => setDescMotivo(e.target.value)}
                                        >
                                            <option value="Edad avanzada">Edad Avanzada / Desgaste Dentadura</option>
                                            <option value="Infertilidad">Infertilidad (Vacía repetitiva)</option>
                                            <option value="Problemas de parto">Historial de Partos Difíciles / Prolapso</option>
                                            <option value="Problemas de ubre">Problemas de Ubre / Mastitis recurrente</option>
                                            <option value="Temperamento">Temperamento Agresivo</option>
                                            <option value="Otros">Otros (Enfermedad, accidente, etc.)</option>
                                        </select>
                                    </div>
                                    <div className="form-group full-width">
                                        <label htmlFor="desc-obs">Detalles del Destino o Venta</label>
                                        <input 
                                            type="text" 
                                            id="desc-obs" 
                                            placeholder="Ej. Venta a feria de Osorno para faena..."
                                            value={descObs}
                                            onChange={(e) => setDescObs(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={() => router.push('/inventario')}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">Registrar Evento</button>
                    </div>
                </form>
            </div>
        </section>
    );
}

export default function RegistrarEventoPage() {
    return (
        <Suspense fallback={<div>Cargando formulario...</div>}>
            <RegistrarEventoForm />
        </Suspense>
    );
}
