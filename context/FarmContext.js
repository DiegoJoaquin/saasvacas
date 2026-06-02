'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_FARM_DATA } from '../lib/mock-data';

const FarmContext = createContext();

export function FarmProvider({ children }) {
    const [farmData, setFarmData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar desde LocalStorage
    useEffect(() => {
        const stored = localStorage.getItem('saas_lo_farm_data');
        if (stored) {
            try {
                setFarmData(JSON.parse(stored));
            } catch (e) {
                console.error("Error al cargar LocalStorage, cargando datos mock", e);
                setFarmData(INITIAL_FARM_DATA);
            }
        } else {
            setFarmData(INITIAL_FARM_DATA);
            localStorage.setItem('saas_lo_farm_data', JSON.stringify(INITIAL_FARM_DATA));
        }
        setLoading(false);
    }, []);

    // Guardar en LocalStorage cada vez que cambie farmData
    const saveFarmData = (newData) => {
        setFarmData(newData);
        localStorage.setItem('saas_lo_farm_data', JSON.stringify(newData));
    };

    const registrarEvento = (diio, tipo, eventData) => {
        if (!farmData) return;

        const updatedAnimales = farmData.animales.map(a => {
            if (a.diio !== diio) return a;

            // Clonar animal para no mutar el estado directamente
            const animal = { ...a, historial: [...a.historial] };
            let nuevoEstado = animal.estado;
            let detalleEvento = '';
            const fechaEvento = eventData.fecha;

            switch (tipo) {
                case 'Encaste':
                    nuevoEstado = 'En Encaste';
                    detalleEvento = `Encaste iniciado con ${eventData.metodo} en ${eventData.potrero}. ${eventData.obs || ''}`;
                    break;
                case 'Preñez':
                    nuevoEstado = eventData.resultado; // 'Preñada' o 'Vacía'
                    detalleEvento = `Diagnóstico de Preñez: ${eventData.resultado} (${eventData.obs || ''}). Realizado por: ${eventData.veterinario || ''}`;
                    break;
                case 'Parto':
                    nuevoEstado = 'Parida';
                    detalleEvento = `Parto (${eventData.facilidad}). Cría: ${eventData.estadoCria} (${eventData.sexo}). DIIO Cría: ${eventData.criaDiio || 'S/D'}. Obs: ${eventData.obs || ''}`;
                    if (eventData.estadoCria === 'Vivo') {
                        animal.partosExitosos = (animal.partosExitosos || 0) + 1;
                    }
                    // Si el animal es una Vaquilla y tuvo un parto exitoso, se convierte en Vaca
                    if (animal.categoria === 'Vaquilla') {
                        animal.categoria = 'Vaca';
                        animal.historial.push({
                            fecha: fechaEvento,
                            tipo: 'Evolución',
                            detalle: 'Cambio automático de categoría: Vaquilla a Vaca al registrar su primer parto.'
                        });
                    }
                    break;
                case 'Destete':
                    nuevoEstado = 'Vacía';
                    detalleEvento = `Destete completado. Peso estimado cría: ${eventData.peso} kg. Obs: ${eventData.obs || ''}`;
                    break;
                case 'Descarte':
                    nuevoEstado = 'Descartada';
                    detalleEvento = `Descarte por motivo: ${eventData.motivo}. Detalles: ${eventData.obs || ''}`;
                    break;
            }

            animal.estado = nuevoEstado;
            animal.historial.push({
                fecha: fechaEvento,
                tipo: tipo,
                detalle: detalleEvento
            });

            // Ordenar historial
            animal.historial.sort((x, y) => new Date(x.fecha) - new Date(y.fecha));
            return animal;
        });

        saveFarmData({
            ...farmData,
            animales: updatedAnimales
        });
    };

    const agregarAnimal = (nuevoAnimalInfo) => {
        if (!farmData) return false;

        // Validar duplicado
        if (farmData.animales.some(a => a.diio === nuevoAnimalInfo.diio)) {
            return { success: false, message: 'Ya existe un animal registrado con este número DIIO.' };
        }

        const nuevoAnimal = {
            diio: nuevoAnimalInfo.diio,
            categoria: nuevoAnimalInfo.categoria,
            raza: nuevoAnimalInfo.raza,
            fechaNacimiento: nuevoAnimalInfo.fechaNacimiento,
            estado: 'Vacía',
            partosExitosos: 0,
            historial: [
                {
                    fecha: new Date().toISOString().split('T')[0],
                    tipo: 'Registro',
                    detalle: `Ingreso al inventario predial como ${nuevoAnimalInfo.categoria}. Estado: Vacía.`
                }
            ]
        };

        saveFarmData({
            ...farmData,
            animales: [...farmData.animales, nuevoAnimal]
        });

        return { success: true };
    };

    const importarAnimales = (nuevosAnimales) => {
        if (!farmData) return;
        saveFarmData({
            ...farmData,
            animales: nuevosAnimales
        });
    };

    return (
        <FarmContext.Provider value={{ farmData, loading, registrarEvento, agregarAnimal, importarAnimales, saveFarmData }}>
            {children}
        </FarmContext.Provider>
    );
}

export function useFarm() {
    const context = useContext(FarmContext);
    if (!context) {
        throw new Error('useFarm debe usarse dentro de un FarmProvider');
    }
    return context;
}
