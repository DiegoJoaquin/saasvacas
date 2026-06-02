// Datos Iniciales de Prueba - SaaS LO
// Representan un predio ganadero en el sur de Chile (Fundo "Río Bueno", Región de Los Ríos)

export const INITIAL_FARM_DATA = {
    predioName: "Fundo Río Bueno",
    comuna: "Río Bueno",
    region: "Región de Los Ríos",
    toros: [
        { id: "T-01", name: "Cacique (Angus Negro)", diio: "140112345" },
        { id: "T-02", name: "Puelche (Hereford)", diio: "140223456" },
        { id: "T-03", name: "Lonko (Angus Colorado)", diio: "140334567" }
    ],
    potreros: ["Potrero El Estero", "Potrero Bajo Loma", "Potrero Los Maitenes", "Corral Central"],
    animales: [
        {
            diio: "140801201",
            categoria: "Vaca",
            raza: "Angus Negro",
            fechaNacimiento: "2019-10-15",
            estado: "Preñada",
            partosExitosos: 3,
            historial: [
                { fecha: "2024-11-20", tipo: "Encaste", detalle: "Monta natural en Potrero El Estero con Toro 'Cacique'" },
                { fecha: "2025-01-25", tipo: "Preñez", detalle: "Confirmada preñada de 65 días por ecografía (Dr. Carter)" }
            ]
        },
        {
            diio: "140801202",
            categoria: "Vaca",
            raza: "Hereford",
            fechaNacimiento: "2020-04-12",
            estado: "Parida",
            partosExitosos: 2,
            historial: [
                { fecha: "2024-11-15", tipo: "Encaste", detalle: "Monta natural en Potrero Los Maitenes con Toro 'Puelche'" },
                { fecha: "2025-01-20", tipo: "Preñez", detalle: "Confirmada preñada por tacto rectal (Dr. Carter)" },
                { fecha: "2025-08-22", tipo: "Parto", detalle: "Parto normal. Ternero macho nacido vivo (DIIO temporal: 140859901)" }
            ]
        },
        {
            diio: "140801203",
            categoria: "Vaquilla",
            raza: "Angus Colorado",
            fechaNacimiento: "2023-09-01",
            estado: "En Encaste",
            partosExitosos: 0,
            historial: [
                { fecha: "2025-11-01", tipo: "Encaste", detalle: "Inicia primer encaste con Toro 'Lonko' en Potrero Bajo Loma" }
            ]
        },
        {
            diio: "140801204",
            categoria: "Vaca",
            raza: "Clavel de Carne",
            fechaNacimiento: "2018-11-30",
            estado: "Vacía",
            partosExitosos: 4,
            historial: [
                { fecha: "2024-12-05", tipo: "Encaste", detalle: "Inseminación artificial con pajuela Angus Negro (Toro 'Cacique')" },
                { fecha: "2025-02-10", tipo: "Preñez", detalle: "Diagnóstico negativo (Vacía) mediante tacto rectal (Dr. Carter)" }
            ]
        },
        {
            diio: "140801205",
            categoria: "Vaca",
            raza: "Angus Negro",
            fechaNacimiento: "2020-09-22",
            estado: "Preñada",
            partosExitosos: 2,
            historial: [
                { fecha: "2024-11-28", tipo: "Encaste", detalle: "Monta natural en Potrero El Estero con Toro 'Cacique'" },
                { fecha: "2025-02-05", tipo: "Preñez", detalle: "Confirmada preñada por ecografía. Gestación normal." }
            ]
        },
        {
            diio: "140801206",
            categoria: "Vaquilla",
            raza: "Hereford",
            fechaNacimiento: "2023-10-05",
            estado: "Preñada",
            partosExitosos: 0,
            historial: [
                { fecha: "2024-11-10", tipo: "Encaste", detalle: "Inseminación artificial con semen Hereford 'Puelche'" },
                { fecha: "2025-01-15", tipo: "Preñez", detalle: "Confirmada preñada por ecografía (65 días)" }
            ]
        },
        {
            diio: "140801207",
            categoria: "Vaca",
            raza: "Angus Colorado",
            fechaNacimiento: "2021-03-14",
            estado: "Parida",
            partosExitosos: 1,
            historial: [
                { fecha: "2024-12-01", tipo: "Encaste", detalle: "Monta natural con Toro 'Lonko' en Potrero Bajo Loma" },
                { fecha: "2025-02-15", tipo: "Preñez", detalle: "Confirmada preñada por tacto rectal." },
                { fecha: "2025-09-08", tipo: "Parto", detalle: "Parto normal. Ternera hembra nacida viva." }
            ]
        },
        {
            diio: "140801208",
            categoria: "Vaca",
            raza: "Clavel de Carne",
            fechaNacimiento: "2017-08-25",
            estado: "Descartada",
            partosExitosos: 6,
            historial: [
                { fecha: "2024-11-20", tipo: "Encaste", detalle: "Monta natural con Toro 'Cacique'" },
                { fecha: "2025-01-25", tipo: "Preñez", detalle: "Diagnóstico negativo (Vacía). Vaca repetidora." },
                { fecha: "2025-03-01", tipo: "Descarte", detalle: "Recomendación de descarte por edad (>8 años) y dentadura desgastada." }
            ]
        },
        {
            diio: "140801209",
            categoria: "Vaca",
            raza: "Angus Negro",
            fechaNacimiento: "2020-11-05",
            estado: "Vacía",
            partosExitosos: 2,
            historial: [
                { fecha: "2023-11-15", tipo: "Encaste", detalle: "Monta natural con Toro 'Cacique'" },
                { fecha: "2024-01-20", tipo: "Preñez", detalle: "Diagnóstico negativo (Vacía)" },
                { fecha: "2024-11-25", tipo: "Encaste", detalle: "Re-encaste con Toro 'Cacique'" },
                { fecha: "2025-01-30", tipo: "Preñez", detalle: "Diagnóstico negativo (Vacía por segunda temporada consecutiva)" }
            ]
        },
        {
            diio: "140801210",
            categoria: "Vaquilla",
            raza: "Angus Negro",
            fechaNacimiento: "2024-01-18",
            estado: "Vacía",
            partosExitosos: 0,
            historial: [
                { fecha: "2025-06-01", tipo: "Nacimiento", detalle: "Ingreso al inventario general como vaquilla de reposición." }
            ]
        },
        {
            diio: "140801211",
            categoria: "Vaca",
            raza: "Hereford",
            fechaNacimiento: "2019-09-09",
            estado: "Preñada",
            partosExitosos: 3,
            historial: [
                { fecha: "2024-12-10", tipo: "Encaste", detalle: "Monta natural en Potrero Los Maitenes con Toro 'Puelche'" },
                { fecha: "2025-02-18", tipo: "Preñez", detalle: "Confirmada preñada por ecografía." }
            ]
        },
        {
            diio: "140801212",
            categoria: "Vaca",
            raza: "Angus Negro",
            fechaNacimiento: "2021-10-02",
            estado: "Parida",
            partosExitosos: 1,
            historial: [
                { fecha: "2024-11-05", tipo: "Encaste", detalle: "Monta natural con Toro 'Cacique'" },
                { fecha: "2025-01-10", tipo: "Preñez", detalle: "Confirmada preñada de 60 días." },
                { fecha: "2025-08-15", tipo: "Parto", detalle: "Parto normal. Ternera hembra nacida viva (DIIO temporal: 140859902)" }
            ]
        },
        {
            diio: "140801213",
            categoria: "Vaca",
            raza: "Clavel de Carne",
            fechaNacimiento: "2018-05-14",
            estado: "Parida",
            partosExitosos: 4,
            historial: [
                { fecha: "2024-11-12", tipo: "Encaste", detalle: "Monta con Toro 'Cacique'" },
                { fecha: "2025-01-20", tipo: "Preñez", detalle: "Confirmada preñada por tacto rectal." },
                { fecha: "2025-08-20", tipo: "Parto", detalle: "Parto distócico leve. Ternero macho nacido vivo." }
            ]
        },
        {
            diio: "140801214",
            categoria: "Vaca",
            raza: "Angus Colorado",
            fechaNacimiento: "2020-02-28",
            estado: "En Encaste",
            partosExitosos: 2,
            historial: [
                { fecha: "2025-11-15", tipo: "Encaste", detalle: "Inicia temporada de encaste con Toro 'Lonko' en Potrero Los Maitenes" }
            ]
        },
        {
            diio: "140801215",
            categoria: "Vaquilla",
            raza: "Angus Negro",
            fechaNacimiento: "2023-11-20",
            estado: "Vacía",
            partosExitosos: 0,
            historial: [
                { fecha: "2025-03-01", tipo: "Registro", detalle: "Vaquilla apta para encaste en la próxima temporada de primavera." }
            ]
        }
    ]
};
