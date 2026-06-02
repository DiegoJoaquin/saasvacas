'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '../../context/FarmContext';
import { formatearFecha } from '../../lib/calculations';
import * as XLSX from 'xlsx';

export default function RespaldoPage() {
    const { farmData, loading, importarAnimales } = useFarm();
    const router = useRouter();
    const fileInputRef = useRef(null);

    const handleExportarExcel = () => {
        if (!farmData || !farmData.animales) {
            alert('No hay datos disponibles para exportar.');
            return;
        }

        try {
            // 1. Crear un libro de trabajo (Workbook) nuevo
            const wb = XLSX.utils.book_new();

            // 2. Preparar los datos de los animales
            const rows = farmData.animales.map(a => {
                // Serializar historial para ponerlo en una columna
                const historialTexto = a.historial 
                    ? a.historial.map(h => `${formatearFecha(h.fecha)}: [${h.tipo}] ${h.detalle}`).join('\r\n') 
                    : '';
                return {
                    "DIIO": a.diio,
                    "Categoría": a.categoria,
                    "Raza": a.raza,
                    "Fecha de Nacimiento": a.fechaNacimiento,
                    "Estado Reproductivo": a.estado,
                    "Partos Exitosos": a.partosExitosos,
                    "Historial de Eventos": historialTexto
                };
            });

            // 3. Crear la hoja de trabajo (Worksheet) a partir de los datos
            const ws = XLSX.utils.json_to_sheet(rows);

            // Configurar anchos de columna para que se vea limpio
            const wscols = [
                { wch: 12 }, // DIIO
                { wch: 12 }, // Categoría
                { wch: 15 }, // Raza
                { wch: 18 }, // Fecha Nacimiento
                { wch: 18 }, // Estado Reproductivo
                { wch: 15 }, // Partos Exitosos
                { wch: 60 }  // Historial
            ];
            ws['!cols'] = wscols;

            // 4. Agregar la hoja al libro con nombre "Inventario"
            XLSX.utils.book_append_sheet(wb, ws, "Inventario");

            // 5. Descargar el archivo
            const predioNameClean = farmData.predioName ? farmData.predioName.toLowerCase().replace(/ /g, '_') : 'predio';
            const filename = `respaldo_reproduccion_${predioNameClean}.xlsx`;
            XLSX.writeFile(wb, filename);
        } catch (err) {
            console.error("Error al exportar a Excel:", err);
            alert("No se pudo generar el archivo Excel. Verifique que no haya problemas con sus datos.");
        }
    };

    const handleImportarExcel = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Tomar la primera hoja
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convertir a JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                const nuevosAnimales = [];

                jsonData.forEach(row => {
                    const diio = String(row["DIIO"] || "").trim();
                    const categoria = String(row["Categoría"] || row["Categoria"] || "").trim();
                    const raza = String(row["Raza"] || "").trim();
                    
                    // Extraer fecha nacimiento
                    let nacimiento = String(row["Fecha de Nacimiento"] || row["FechaNacimiento"] || "").trim();
                    
                    // Si SheetJS lee la fecha como número de serie de Excel o formato fecha
                    if (!isNaN(nacimiento) && nacimiento.length > 5) {
                        // Es un string numérico largo
                    } else if (!isNaN(Number(nacimiento)) && Number(nacimiento) > 10000) {
                        // Excel serial number
                        const dateObj = XLSX.SSF.parse_date_code(Number(nacimiento));
                        const mStr = String(dateObj.m).padStart(2, '0');
                        const dStr = String(dateObj.d).padStart(2, '0');
                        nacimiento = `${dateObj.y}-${mStr}-${dStr}`;
                    }

                    const estado = String(row["Estado Reproductivo"] || row["EstadoReproductivo"] || "").trim();
                    const partos = parseInt(row["Partos Exitosos"] || row["PartosExitosos"] || "0", 10);
                    
                    let historial = [];
                    const histRaw = row["Historial de Eventos"] || row["HistorialEventos"] || "";
                    if (histRaw) {
                        // Separar por saltos de línea (pueden ser \r\n o \n)
                        const lineas = histRaw.split(/\r?\n/);
                        lineas.forEach(linea => {
                            const limpia = linea.trim();
                            if (!limpia) return;
                            
                            // Regex para capturar "DD/MM/YYYY: [Tipo] Detalle"
                            const match = limpia.match(/^(\d{2})\/(\d{2})\/(\d{4}):\s*\[(.*?)\]\s*(.*)$/);
                            if (match) {
                                const fechaISO = `${match[3]}-${match[2]}-${match[1]}`;
                                historial.push({
                                    fecha: fechaISO,
                                    tipo: match[4],
                                    detalle: match[5]
                                });
                            } else {
                                // Evento alternativo o genérico
                                historial.push({
                                    fecha: new Date().toISOString().split('T')[0],
                                    tipo: "Histórico",
                                    detalle: limpia
                                });
                            }
                        });
                    }

                    if (diio && estado) {
                        nuevosAnimales.push({
                            diio,
                            categoria,
                            raza,
                            fechaNacimiento: nacimiento,
                            estado,
                            partosExitosos: partos,
                            historial
                        });
                    }
                });

                if (nuevosAnimales.length > 0) {
                    importarAnimales(nuevosAnimales);
                    alert(`Importación exitosa. Se cargaron ${nuevosAnimales.length} animales desde el archivo Excel.`);
                    router.push('/');
                } else {
                    alert('No se encontraron registros de animales válidos en la hoja de Excel.');
                }
            } catch (err) {
                console.error("Error al importar de Excel:", err);
                alert('Error al procesar el archivo Excel. Asegúrese de que las columnas coincidan con las exportadas.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--color-primary)' }}>
                <span style={{ fontSize: '3rem', animation: 'spin 2s linear infinite' }}>🐄</span>
                <p style={{ marginTop: '1rem', fontFamily: 'var(--font-heading)', fontWeight: '600' }}>Cargando módulo de respaldo...</p>
            </div>
        );
    }

    return (
        <section id="respaldo-view" className="view-section">
            <div className="section-header">
                <div>
                    <h2>Respaldo e Intercambio de Datos (Excel)</h2>
                    <p>Descarga tus planillas en formato Excel (.xlsx) para trámites de predio o informes al SAG</p>
                </div>
            </div>

            <div className="backup-grid">
                {/* Exportar */}
                <div className="backup-card">
                    <span className="backup-icon" role="img" aria-label="export">📥</span>
                    <h3>Exportar a Microsoft Excel</h3>
                    <p>Obtén una planilla Excel (.xlsx) con el detalle completo de tus vientres, estados actuales e historiales acumulados.</p>
                    <button 
                        className="btn-primary" 
                        id="btn-export-xlsx" 
                        style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                        onClick={handleExportarExcel}
                        type="button"
                    >
                        Descargar Planilla Excel (.xlsx)
                    </button>
                </div>

                {/* Importar */}
                <div className="backup-card">
                    <span className="backup-icon" role="img" aria-label="import">📤</span>
                    <h3>Cargar Planilla desde Excel</h3>
                    <p>Sube una planilla Excel (.xlsx) previamente exportada para recuperar la base de datos o migrar los datos a otro dispositivo.</p>
                    <div className="file-input-wrapper" style={{ width: '100%', marginTop: '1rem' }}>
                        <button 
                            className="btn-secondary" 
                            style={{ width: '100%' }}
                            onClick={triggerFileInput}
                            type="button"
                        >
                            Seleccionar Archivo Excel .xlsx
                        </button>
                        <input 
                            type="file" 
                            id="file-import-xlsx" 
                            accept=".xlsx" 
                            ref={fileInputRef}
                            onChange={handleImportarExcel}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
