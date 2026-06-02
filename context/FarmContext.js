'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSupabase } from '../lib/supabase';

const FarmContext = createContext();

export function FarmProvider({ children }) {
    const { user, session } = useAuth();
    const [farmData, setFarmData] = useState(null);
    const [predioId, setPredioId] = useState(null);
    const [loading, setLoading] = useState(true);
    const supabase = getSupabase();

    // Cargar datos del predio desde Supabase cuando el usuario está autenticado
    const loadFarmData = useCallback(async () => {
        if (!user) {
            setFarmData(null);
            setPredioId(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // 1. Buscar o crear el predio del usuario
            let { data: predios, error: predioError } = await supabase
                .from('predios')
                .select('*')
                .eq('user_id', user.id);

            if (predioError) throw predioError;

            let predio;
            if (!predios || predios.length === 0) {
                // Crear predio por defecto para el usuario nuevo
                const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Mi Predio';
                const { data: newPredio, error: createError } = await supabase
                    .from('predios')
                    .insert({
                        user_id: user.id,
                        nombre: `Predio de ${userName}`,
                        comuna: '',
                        region: ''
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                predio = newPredio;

                // Crear potreros por defecto
                await supabase.from('potreros').insert([
                    { predio_id: predio.id, nombre: 'Potrero Principal' },
                    { predio_id: predio.id, nombre: 'Corral Central' }
                ]);
            } else {
                predio = predios[0];
            }

            setPredioId(predio.id);

            // 2. Cargar animales del predio
            const { data: animales, error: animalesError } = await supabase
                .from('animales')
                .select('*')
                .eq('predio_id', predio.id)
                .order('created_at', { ascending: true });

            if (animalesError) throw animalesError;

            // 3. Cargar eventos de todos los animales
            const animalIds = (animales || []).map(a => a.id);
            let eventos = [];
            if (animalIds.length > 0) {
                const { data: eventosData, error: eventosError } = await supabase
                    .from('eventos')
                    .select('*')
                    .in('animal_id', animalIds)
                    .order('fecha', { ascending: true });

                if (eventosError) throw eventosError;
                eventos = eventosData || [];
            }

            // 4. Cargar toros y potreros
            const { data: toros } = await supabase
                .from('toros')
                .select('*')
                .eq('predio_id', predio.id);

            const { data: potreros } = await supabase
                .from('potreros')
                .select('*')
                .eq('predio_id', predio.id);

            // 5. Construir farmData con la misma estructura que antes
            const animalesConHistorial = (animales || []).map(a => {
                const historial = eventos
                    .filter(e => e.animal_id === a.id)
                    .map(e => ({
                        id: e.id,
                        fecha: e.fecha,
                        tipo: e.tipo,
                        detalle: e.detalle || '',
                        toro: e.toro,
                        inseminador: e.inseminador
                    }));

                return {
                    id: a.id,
                    diio: a.diio,
                    categoria: a.categoria,
                    raza: a.raza,
                    fechaNacimiento: a.fecha_nacimiento,
                    estado: a.estado,
                    partosExitosos: a.partos_exitosos || 0,
                    historial
                };
            });

            setFarmData({
                predioId: predio.id,
                predioName: predio.nombre,
                comuna: predio.comuna || '',
                region: predio.region || '',
                toros: (toros || []).map(t => ({
                    id: t.id,
                    name: t.nombre,
                    diio: t.diio || ''
                })),
                potreros: (potreros || []).map(p => p.nombre),
                animales: animalesConHistorial
            });

        } catch (error) {
            console.error('Error al cargar datos del predio:', error);
            setFarmData(null);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => {
        loadFarmData();
    }, [loadFarmData]);

    // Registrar un evento reproductivo en Supabase
    const registrarEvento = async (diio, tipo, eventData) => {
        if (!farmData || !predioId) return;

        try {
            // Encontrar el animal por DIIO
            const animal = farmData.animales.find(a => a.diio === diio);
            if (!animal) {
                console.error('Animal no encontrado:', diio);
                return;
            }

            // Determinar nuevo estado
            let nuevoEstado = animal.estado;
            let detalleEvento = '';
            let incrementPartos = false;
            let cambiarCategoria = false;
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
                        incrementPartos = true;
                    }
                    if (animal.categoria === 'Vaquilla') {
                        cambiarCategoria = true;
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

            // 1. Insertar evento en Supabase
            const eventoInsert = {
                animal_id: animal.id,
                fecha: fechaEvento,
                tipo: tipo,
                detalle: detalleEvento
            };

            if (tipo === 'Encaste') {
                eventoInsert.toro = eventData.metodo;
                eventoInsert.inseminador = eventData.inseminador || 'N/R';
            }

            const { error: eventoError } = await supabase
                .from('eventos')
                .insert(eventoInsert);

            if (eventoError) throw eventoError;

            // 2. Actualizar estado del animal
            const updateData = { estado: nuevoEstado };
            if (incrementPartos) {
                updateData.partos_exitosos = (animal.partosExitosos || 0) + 1;
            }
            if (cambiarCategoria) {
                updateData.categoria = 'Vaca';
                // Insertar evento de evolución
                await supabase.from('eventos').insert({
                    animal_id: animal.id,
                    fecha: fechaEvento,
                    tipo: 'Evolución',
                    detalle: 'Cambio automático de categoría: Vaquilla a Vaca al registrar su primer parto.'
                });
            }

            const { error: updateError } = await supabase
                .from('animales')
                .update(updateData)
                .eq('id', animal.id);

            if (updateError) throw updateError;

            // 3. Recargar datos
            await loadFarmData();

        } catch (error) {
            console.error('Error al registrar evento:', error);
            alert('Error al registrar el evento. Intente de nuevo.');
        }
    };

    // Agregar un nuevo animal al predio
    const agregarAnimal = async (nuevoAnimalInfo) => {
        if (!farmData || !predioId) return { success: false, message: 'No hay predio cargado.' };

        try {
            // Validar duplicado localmente
            if (farmData.animales.some(a => a.diio === nuevoAnimalInfo.diio)) {
                return { success: false, message: 'Ya existe un animal registrado con este número DIIO.' };
            }

            // Insertar animal en Supabase
            const { data: newAnimal, error: insertError } = await supabase
                .from('animales')
                .insert({
                    predio_id: predioId,
                    diio: nuevoAnimalInfo.diio,
                    categoria: nuevoAnimalInfo.categoria,
                    raza: nuevoAnimalInfo.raza,
                    fecha_nacimiento: nuevoAnimalInfo.fechaNacimiento,
                    estado: 'Vacía',
                    partos_exitosos: 0
                })
                .select()
                .single();

            if (insertError) {
                if (insertError.code === '23505') {
                    return { success: false, message: 'Ya existe un animal registrado con este número DIIO.' };
                }
                throw insertError;
            }

            // Insertar evento de registro
            await supabase.from('eventos').insert({
                animal_id: newAnimal.id,
                fecha: new Date().toISOString().split('T')[0],
                tipo: 'Registro',
                detalle: `Ingreso al inventario predial como ${nuevoAnimalInfo.categoria}. Estado: Vacía.`
            });

            // Recargar datos
            await loadFarmData();

            return { success: true };

        } catch (error) {
            console.error('Error al agregar animal:', error);
            return { success: false, message: 'Error al guardar en la base de datos.' };
        }
    };

    // Importar animales desde Excel
    const importarAnimales = async (nuevosAnimales) => {
        if (!farmData || !predioId) return;

        try {
            // Insertar cada animal y sus eventos
            for (const animal of nuevosAnimales) {
                const { data: inserted, error: insertError } = await supabase
                    .from('animales')
                    .upsert({
                        predio_id: predioId,
                        diio: animal.diio,
                        categoria: animal.categoria,
                        raza: animal.raza,
                        fecha_nacimiento: animal.fechaNacimiento,
                        estado: animal.estado,
                        partos_exitosos: animal.partosExitosos || 0
                    }, { onConflict: 'predio_id,diio' })
                    .select()
                    .single();

                if (insertError) {
                    console.error(`Error al importar DIIO ${animal.diio}:`, insertError);
                    continue;
                }

                // Insertar historial si existe
                if (animal.historial && animal.historial.length > 0) {
                    const eventosInsert = animal.historial.map(h => ({
                        animal_id: inserted.id,
                        fecha: h.fecha,
                        tipo: h.tipo,
                        detalle: h.detalle || '',
                        toro: h.toro || null,
                        inseminador: h.inseminador || null
                    }));

                    await supabase.from('eventos').insert(eventosInsert);
                }
            }

            // Recargar datos
            await loadFarmData();

        } catch (error) {
            console.error('Error al importar animales:', error);
            alert('Error al importar los datos. Algunos registros podrían no haberse guardado.');
        }
    // Actualizar el estado reproductivo de un animal
    const actualizarEstadoAnimal = async (diio, nuevoEstado) => {
        if (!farmData) return { success: false, message: 'No hay predio cargado.' };

        try {
            const animal = farmData.animales.find(a => a.diio === diio);
            if (!animal) return { success: false, message: 'Animal no encontrado.' };

            if (supabase) {
                const { error } = await supabase
                    .from('animales')
                    .update({ estado: nuevoEstado })
                    .eq('id', animal.id);

                if (error) throw error;
            } else {
                const stored = localStorage.getItem('saas_lo_farm_data');
                if (stored) {
                    const localData = JSON.parse(stored);
                    localData.animales = localData.animales.map(a => {
                        if (a.diio === diio) return { ...a, estado: nuevoEstado };
                        return a;
                    });
                    localStorage.setItem('saas_lo_farm_data', JSON.stringify(localData));
                }
            }

            if (supabase) {
                await loadFarmData();
            } else {
                const updatedAnimales = farmData.animales.map(a => {
                    if (a.diio === diio) return { ...a, estado: nuevoEstado };
                    return a;
                });
                setFarmData({ ...farmData, animales: updatedAnimales });
            }

            return { success: true };
        } catch (error) {
            console.error('Error al actualizar estado del animal:', error);
            return { success: false, message: 'Error al actualizar el estado.' };
        }
    };

    return (
        <FarmContext.Provider value={{ farmData, loading, registrarEvento, agregarAnimal, importarAnimales, loadFarmData, actualizarEstadoAnimal }}>
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
