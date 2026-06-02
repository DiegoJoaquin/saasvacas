// utilidades de fecha e histograma reproductivo

export function diferenciaDias(fecha1, fecha2) {
    const f1 = new Date(fecha1);
    const f2 = new Date(fecha2);
    // Asegurarse de que no influyan las horas
    f1.setHours(0, 0, 0, 0);
    f2.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(f2 - f1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function sumarDias(fecha, dias) {
    const result = new Date(fecha);
    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() + dias);
    return result.toISOString().split('T')[0];
}

export function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const cumple = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
        edad--;
    }
    return Math.max(0, edad);
}

export function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return fechaStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`; // Formato chileno DD/MM/YYYY
}

export function obtenerUltimoEvento(animal, tipo) {
    if (!animal.historial || animal.historial.length === 0) return null;
    for (let i = animal.historial.length - 1; i >= 0; i--) {
        if (animal.historial[i].tipo === tipo) {
            return animal.historial[i];
        }
    }
    return null;
}

export function calcularKPIs(animales) {
    if (!animales) return {
        totalVientres: 0,
        preñadas: 0,
        vacias: 0,
        enEncaste: 0,
        paridas: 0,
        descartadas: 0,
        tasaPrenes: 0,
        tasaParicion: 0,
        tasaDestete: 0
    };

    const activos = animales.filter(a => a.estado !== 'Descartada');
    const totalVientres = activos.length;
    
    const preñadas = activos.filter(a => a.estado === 'Preñada').length;
    const vacias = activos.filter(a => a.estado === 'Vacía').length;
    const enEncaste = activos.filter(a => a.estado === 'En Encaste').length;
    const paridas = activos.filter(a => a.estado === 'Parida').length;
    const descartadas = animales.filter(a => a.estado === 'Descartada').length;

    // Tasa de Preñez = (Preñadas / Vientres Totales Aptos que han tenido encaste o están vacíos) * 100
    const basePrenes = preñadas + vacias + paridas;
    const tasaPrenes = basePrenes > 0 ? Math.round((preñadas / basePrenes) * 100) : 0;

    // Tasa de Parición = (Paridas / (Paridas + Preñadas)) * 100
    const baseParicion = paridas + preñadas;
    const tasaParicion = baseParicion > 0 ? Math.round((paridas / baseParicion) * 100) : 0;

    // Tasa de Destete: porcentaje de crías que llegan a término y se destetan con éxito.
    let partosTotales = 0;
    let destetesTotales = 0;
    animales.forEach(a => {
        if (!a.historial) return;
        a.historial.forEach(h => {
            if (h.tipo === 'Parto' && !h.detalle.toLowerCase().includes('muerto') && !h.detalle.toLowerCase().includes('aborto')) {
                partosTotales++;
            }
            if (h.tipo === 'Destete') {
                destetesTotales++;
            }
        });
    });
    const tasaDestete = partosTotales > 0 ? Math.min(100, Math.round((destetesTotales / partosTotales) * 100)) : 88;

    return {
        totalVientres,
        preñadas,
        vacias,
        enEncaste,
        paridas,
        descartadas,
        tasaPrenes,
        tasaParicion,
        tasaDestete
    };
}

export function calcularAlertas(animales) {
    if (!animales) return [];
    const alertas = [];
    const hoy = new Date();

    animales.forEach(a => {
        if (a.estado === 'Descartada') return;

        const ultimoEncaste = obtenerUltimoEvento(a, 'Encaste');
        const ultimoParto = obtenerUltimoEvento(a, 'Parto');

        // 1. Alerta: Tacto/Eco pendiente (>60 días en encaste sin confirmación)
        if (a.estado === 'En Encaste' && ultimoEncaste) {
            const dias = diferenciaDias(ultimoEncaste.fecha, hoy);
            if (dias >= 60) {
                alertas.push({
                    diio: a.diio,
                    animal: a,
                    tipo: 'Tacto Pendiente',
                    mensaje: `DIIO ${a.diio}: Lleva ${dias} días en encaste. Requiere tacto o ecografía.`,
                    actionLabel: 'Confirmar Preñez',
                    actionView: 'registrar-evento',
                    actionType: 'Preñez'
                });
            }
        }

        // 2. Alerta: Parto Próximo (Preñada y cercana a los 283 días de gestación desde el encaste)
        if (a.estado === 'Preñada' && ultimoEncaste) {
            const fechaPartoEst = sumarDias(ultimoEncaste.fecha, 283);
            const diasFaltantes = diferenciaDias(hoy, fechaPartoEst);
            // Si la fecha estimada de parto está dentro de +/- 15 días
            const diffTime = (new Date(fechaPartoEst).getTime() - hoy.getTime());
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 15 && diffDays >= -15) {
                const msg = diffDays >= 0 
                    ? `Faltan ${diffDays} días para el parto estimado (${formatearFecha(fechaPartoEst)}).`
                    : `Parto atrasado por ${Math.abs(diffDays)} días (${formatearFecha(fechaPartoEst)}).`;
                alertas.push({
                    diio: a.diio,
                    animal: a,
                    tipo: 'Parto Próximo',
                    mensaje: `DIIO ${a.diio}: ${msg}`,
                    actionLabel: 'Registrar Parto',
                    actionView: 'registrar-evento',
                    actionType: 'Parto'
                });
            }
        }

        // 3. Alerta: Destete Pendiente (Ternero de vaca parida tiene > 180 días / 6 meses)
        if (a.estado === 'Parida' && ultimoParto) {
            const diasParto = diferenciaDias(ultimoParto.fecha, hoy);
            if (diasParto >= 180) {
                alertas.push({
                    diio: a.diio,
                    animal: a,
                    tipo: 'Destete Pendiente',
                    mensaje: `DIIO ${a.diio}: Cría tiene ${Math.round(diasParto/30.4)} meses. Listo para destetar.`,
                    actionLabel: 'Registrar Destete',
                    actionView: 'registrar-evento',
                    actionType: 'Destete'
                });
            }
        }

        // 4. Alerta: Vaquilla apta para primer encaste (>18 meses y vacía)
        if (a.categoria === 'Vaquilla' && a.estado === 'Vacía') {
            const edadMeses = Math.round(diferenciaDias(a.fechaNacimiento, hoy) / 30.4);
            if (edadMeses >= 18 && (!a.historial || a.historial.filter(h => h.tipo === 'Encaste').length === 0)) {
                alertas.push({
                    diio: a.diio,
                    animal: a,
                    tipo: 'Primer Encaste',
                    mensaje: `DIIO ${a.diio}: Vaquilla de ${edadMeses} meses lista para su primer encaste.`,
                    actionLabel: 'Iniciar Encaste',
                    actionView: 'registrar-evento',
                    actionType: 'Encaste'
                });
            }
        }
    });

    return alertas;
}

export function obtenerCandidatasDescarte(animales) {
    if (!animales) return [];
    const candidatas = [];

    animales.forEach(a => {
        if (a.estado === 'Descartada') return;

        const motivos = [];
        
        // Regla 1: Edad avanzada (>9 años)
        const edadAnos = calcularEdad(a.fechaNacimiento);
        if (edadAnos >= 9) {
            motivos.push(`Edad avanzada (${edadAnos} años)`);
        }

        // Regla 2: Vacía repetitiva (2 diagnósticos de preñez negativos consecutivos sin partos entre medio)
        let prenecesNegativas = 0;
        if (a.historial) {
            for (let i = a.historial.length - 1; i >= 0; i--) {
                const h = a.historial[i];
                if (h.tipo === 'Parto') break; // Hubo un parto, se corta la racha
                if (h.tipo === 'Preñez' && (h.detalle.toLowerCase().includes('negativo') || h.detalle.toLowerCase().includes('vacía'))) {
                    prenecesNegativas++;
                }
            }
        }
        if (prenecesNegativas >= 2) {
            motivos.push(`Vacía en ${prenecesNegativas} diagnósticos consecutivos`);
        }

        // Regla 3: Problemas de parto / cría muerta repetida en historial
        let partosFallidos = 0;
        if (a.historial) {
            a.historial.forEach(h => {
                if (h.tipo === 'Parto' && (h.detalle.toLowerCase().includes('muert') || h.detalle.toLowerCase().includes('aborto'))) {
                    partosFallidos++;
                }
            });
        }
        if (partosFallidos >= 2) {
            motivos.push(`${partosFallidos} partos con cría muerta o aborto`);
        }

        if (motivos.length > 0) {
            candidatas.push({
                animal: a,
                motivos: motivos,
                detalle: `Vaca nacida el ${formatearFecha(a.fechaNacimiento)} (${edadAnos} años), raza ${a.raza}.`
            });
        }
    });

    return candidatas;
}

export function obtenerDatosServicio(evento) {
    if (!evento) return { toro: 'No Registrado', inseminador: 'N/R' };
    
    if (evento.toro) {
        return {
            toro: evento.toro,
            inseminador: evento.inseminador || 'N/R'
        };
    }
    
    // Intentar parsear del detalle (compatibilidad)
    let toro = 'No Registrado';
    let inseminador = 'N/R';
    const det = evento.detalle || '';
    
    // Buscar toro
    const matchToro = det.match(/Toro '([^']+)'/) || det.match(/Toro ([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/);
    if (matchToro) {
        toro = matchToro[1];
    } else if (det.toLowerCase().includes('inseminación') || det.toLowerCase().includes('ia')) {
        toro = 'I.A.';
    }
    
    // Buscar inseminador
    if (det.toLowerCase().includes('dr. carter') || det.toLowerCase().includes('carter')) {
        inseminador = 'Dr. Carter';
    }
    
    return { toro, inseminador };
}

