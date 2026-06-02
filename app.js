// SaaS LO - Control Reproductivo Bovino
// Lógica de negocio, persistencia en LocalStorage y renderizado de la SPA

class SistemaBovino {
    constructor() {
        this.farmData = null;
        this.activeView = 'dashboard';
        this.selectedAnimal = null; // Para ver detalles en el Drawer
        this.selectedEventType = 'Encaste'; // Tipo de evento activo en el formulario
        
        this.init();
    }

    init() {
        // Cargar datos de LocalStorage o inicializar con datos mock
        const storedData = localStorage.getItem('saas_lo_farm_data');
        if (storedData) {
            try {
                this.farmData = JSON.parse(storedData);
            } catch (e) {
                console.error("Error al leer LocalStorage, cargando datos iniciales.", e);
                this.farmData = window.INITIAL_FARM_DATA;
            }
        } else {
            this.farmData = window.INITIAL_FARM_DATA;
            this.saveToStorage();
        }

        this.setupNavigation();
        this.setupEventListeners();
        this.renderActiveView();
    }

    saveToStorage() {
        localStorage.setItem('saas_lo_farm_data', JSON.stringify(this.farmData));
    }

    // --- NAVEGACIÓN SPA ---
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-item button');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetView = e.currentTarget.parentElement.getAttribute('data-view');
                this.switchView(targetView);
            });
        });
    }

    switchView(viewName) {
        this.activeView = viewName;
        
        // Actualizar UI del menú lateral
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('data-view') === viewName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Actualizar secciones
        document.querySelectorAll('.view-section').forEach(section => {
            if (section.id === `${viewName}-view`) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        this.renderActiveView();
    }

    renderActiveView() {
        // Cerrar drawer de detalles si se cambia de vista
        this.closeDrawer();

        switch (this.activeView) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'inventario':
                this.renderInventario();
                break;
            case 'registrar-evento':
                this.renderFormularioEvento();
                break;
            case 'descarte':
                this.renderDescarte();
                break;
            case 'respaldo':
                this.renderRespaldo();
                break;
        }
    }

    // --- EVENTOS DEL SISTEMA ---
    setupEventListeners() {
        // Cerrar Drawer
        const btnCloseDrawer = document.getElementById('btn-close-drawer');
        if (btnCloseDrawer) {
            btnCloseDrawer.addEventListener('click', () => this.closeDrawer());
        }

        // Registrar Evento - Cambio de Tipo
        const eventTypeBtns = document.querySelectorAll('.event-type-btn');
        eventTypeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                eventTypeBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.selectedEventType = e.currentTarget.getAttribute('data-type');
                this.renderFormularioCampos();
            });
        });

        // Guardar Evento
        const formEvento = document.getElementById('form-registrar-evento');
        if (formEvento) {
            formEvento.addEventListener('submit', (e) => {
                e.preventDefault();
                this.procesarGuardarEvento(e.target);
            });
        }

        // Agregar Nuevo Animal
        const formNuevoAnimal = document.getElementById('form-nuevo-animal');
        if (formNuevoAnimal) {
            formNuevoAnimal.addEventListener('submit', (e) => {
                e.preventDefault();
                this.procesarAgregarAnimal(e.target);
            });
        }

        // Exportar CSV
        const btnExport = document.getElementById('btn-export-csv');
        if (btnExport) {
            btnExport.addEventListener('click', () => this.exportarCSV());
        }

        // Importar CSV
        const fileImport = document.getElementById('file-import-csv');
        if (fileImport) {
            fileImport.addEventListener('change', (e) => this.importarCSV(e));
        }

        // Filtros del Inventario
        const searchInput = document.getElementById('search-diio');
        const filterEstado = document.getElementById('filter-estado');
        const filterCategoria = document.getElementById('filter-categoria');

        if (searchInput) searchInput.addEventListener('input', () => this.renderInventario());
        if (filterEstado) filterEstado.addEventListener('change', () => this.renderInventario());
        if (filterCategoria) filterCategoria.addEventListener('change', () => this.renderInventario());
    }

    // --- CÁLCULOS Y LOGICA DE NEGOCIO ---
    calcularKPIs() {
        const activos = this.farmData.animales.filter(a => a.estado !== 'Descartada');
        const totalVientres = activos.length;
        
        const preñadas = activos.filter(a => a.estado === 'Preñada').length;
        const vacias = activos.filter(a => a.estado === 'Vacía').length;
        const enEncaste = activos.filter(a => a.estado === 'En Encaste').length;
        const paridas = activos.filter(a => a.estado === 'Parida').length;
        const descartadas = this.farmData.animales.filter(a => a.estado === 'Descartada').length;

        // Tasa de Preñez = (Preñadas / Vientres Totales Aptos que han tenido encaste o están vacíos) * 100
        // Para simplificar y dar consistencia: preñadas sobre el total de vientres que pasaron por encaste
        const basePrenes = preñadas + vacias + paridas;
        const tasaPrenes = basePrenes > 0 ? Math.round((preñadas / basePrenes) * 100) : 0;

        // Tasa de Parición = (Paridas / (Paridas + Preñadas)) * 100 (basado en la temporada activa)
        const baseParicion = paridas + preñadas;
        const tasaParicion = baseParicion > 0 ? Math.round((paridas / baseParicion) * 100) : 0;

        // Tasa de Destete: porcentaje de crías que llegan a término y se destetan con éxito.
        // Simulamos en base a los partos con cría viva y destetadas de la base de historial.
        let partosTotales = 0;
        let destetesTotales = 0;
        this.farmData.animales.forEach(a => {
            a.historial.forEach(h => {
                if (h.tipo === 'Parto' && !h.detalle.toLowerCase().includes('muerto') && !h.detalle.toLowerCase().includes('aborto')) {
                    partosTotales++;
                }
                if (h.tipo === 'Destete') {
                    destetesTotales++;
                }
            });
        });
        // Si no hay datos históricos, usamos una tasa simulada en base a paridas reales
        const tasaDestete = partosTotales > 0 ? Math.min(100, Math.round((destetesTotales / partosTotales) * 100)) : 88; // 88% por defecto chileno promedio

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

    calcularAlertas() {
        const alertas = [];
        const hoy = new Date();

        this.farmData.animales.forEach(a => {
            if (a.estado === 'Descartada') return;

            // Obtener último evento de cada tipo
            const ultimoEncaste = this.obtenerUltimoEvento(a, 'Encaste');
            const ultimaPrenes = this.obtenerUltimoEvento(a, 'Preñez');
            const ultimoParto = this.obtenerUltimoEvento(a, 'Parto');

            // 1. Alerta: Tacto/Eco pendiente (>60 días en encaste sin confirmación)
            if (a.estado === 'En Encaste' && ultimoEncaste) {
                const dias = this.diferenciaDias(ultimoEncaste.fecha, hoy);
                if (dias >= 60) {
                    alertas.push({
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
                const fechaPartoEst = this.sumarDias(ultimoEncaste.fecha, 283);
                const diasFaltantes = this.diferenciaDias(hoy, fechaPartoEst);
                if (diasFaltantes <= 15 && diasFaltantes >= -15) {
                    const msg = diasFaltantes >= 0 
                        ? `Faltan ${diasFaltantes} días para el parto estimado (${this.formatearFecha(fechaPartoEst)}).`
                        : `Parto atrasado por ${Math.abs(diasFaltantes)} días (${this.formatearFecha(fechaPartoEst)}).`;
                    alertas.push({
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
                const diasParto = this.diferenciaDias(ultimoParto.fecha, hoy);
                if (diasParto >= 180) {
                    alertas.push({
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
                const edadMeses = Math.round(this.diferenciaDias(a.fechaNacimiento, hoy) / 30.4);
                if (edadMeses >= 18 && a.historial.filter(h => h.tipo === 'Encaste').length === 0) {
                    alertas.push({
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

    obtenerCandidatasDescarte() {
        const candidatas = [];
        const hoy = new Date();

        this.farmData.animales.forEach(a => {
            if (a.estado === 'Descartada') return;

            const motivos = [];
            
            // Regla 1: Edad avanzada (>9 años / 108 meses)
            const edadAnos = this.calcularEdad(a.fechaNacimiento);
            if (edadAnos >= 9) {
                motivos.push(`Edad avanzada (${edadAnos} años)`);
            }

            // Regla 2: Vacía repetitiva (2 diagnósticos de preñez negativos consecutivos sin partos entre medio)
            let prenecesNegativas = 0;
            for (let i = a.historial.length - 1; i >= 0; i--) {
                const h = a.historial[i];
                if (h.tipo === 'Parto') break; // Hubo un parto, se corta la racha
                if (h.tipo === 'Preñez' && h.detalle.toLowerCase().includes('negativo') || h.detalle.toLowerCase().includes('vacía')) {
                    prenecesNegativas++;
                }
            }
            if (prenecesNegativas >= 2) {
                motivos.push(`Vacía en ${prenecesNegativas} diagnósticos consecutivos`);
            }

            // Regla 3: Problemas de parto / cría muerta repetida en historial
            let partosFallidos = 0;
            a.historial.forEach(h => {
                if (h.tipo === 'Parto' && (h.detalle.toLowerCase().includes('muert') || h.detalle.toLowerCase().includes('aborto'))) {
                    partosFallidos++;
                }
            });
            if (partosFallidos >= 2) {
                motivos.push(`${partosFallidos} partos con cría muerta o aborto`);
            }

            if (motivos.length > 0) {
                candidatas.push({
                    animal: a,
                    motivos: motivos,
                    detalle: `Vaca nacida el ${this.formatearFecha(a.fechaNacimiento)} (${edadAnos} años), raza ${a.raza}.`
                });
            }
        });

        return candidatas;
    }

    // --- RENDERIZADO DE VISTAS ---

    // 1. Dashboard
    renderDashboard() {
        const kpi = this.calcularKPIs();
        const alertas = this.calcularAlertas();

        // Renderizar números KPI
        document.getElementById('kpi-total-vientres').textContent = kpi.totalVientres;
        document.getElementById('kpi-prenadas').textContent = kpi.preñadas;
        document.getElementById('kpi-vacias').textContent = kpi.vacias;
        document.getElementById('kpi-tasa-prenes').textContent = `${kpi.tasaPrenes}%`;
        document.getElementById('kpi-tasa-paricion').textContent = `${kpi.tasaParicion}%`;
        document.getElementById('kpi-tasa-destete').textContent = `${kpi.tasaDestete}%`;

        // Renderizar gráfico de embudo (Funnel)
        const totalEncaste = kpi.preñadas + kpi.vacias + kpi.enEncaste + kpi.paridas;
        const totalPrenadas = kpi.preñadas + kpi.paridas;
        const totalParidas = kpi.paridas;
        const totalDestetes = this.farmData.animales.reduce((acc, curr) => acc + curr.historial.filter(h => h.tipo === 'Destete').length, 0);

        this.setFunnelBar('funnel-encaste', totalEncaste, totalEncaste);
        this.setFunnelBar('funnel-prenes', totalPrenadas, totalEncaste);
        this.setFunnelBar('funnel-parto', totalParidas, totalPrenadas);
        this.setFunnelBar('funnel-destete', totalDestetes, totalParidas);

        // Renderizar desglose de distribución
        document.getElementById('dist-vacia-count').textContent = kpi.vacias;
        document.getElementById('dist-encaste-count').textContent = kpi.enEncaste;
        document.getElementById('dist-prenada-count').textContent = kpi.preñadas;
        document.getElementById('dist-parida-count').textContent = kpi.paridas;
        document.getElementById('dist-descarte-count').textContent = kpi.descartadas;

        // Renderizar lista de alertas ganaderas
        const containerAlertas = document.getElementById('alerts-list-container');
        containerAlertas.innerHTML = '';

        if (alertas.length === 0) {
            containerAlertas.innerHTML = `
                <div style="text-align: center; color: var(--color-text-muted); padding: 1rem; font-size: 0.9rem;">
                    🟢 No hay tareas ni alertas pendientes en el predio.
                </div>`;
        } else {
            alertas.slice(0, 5).forEach(alert => {
                const item = document.createElement('div');
                item.className = 'alert-item';
                // Añadir color de borde según tipo
                if (alert.tipo === 'Parto Próximo') item.style.borderLeftColor = 'var(--color-state-prenada)';
                if (alert.tipo === 'Destete Pendiente') item.style.borderLeftColor = 'var(--color-state-parida)';
                if (alert.tipo === 'Tacto Pendiente') item.style.borderLeftColor = 'var(--color-state-encaste)';

                item.innerHTML = `
                    <div class="alert-info">
                        <p>${alert.mensaje}</p>
                        <span>${alert.tipo}</span>
                    </div>
                    <button class="alert-action-btn" onclick="app.irAAccionAlerta('${alert.animal.diio}', '${alert.actionView}', '${alert.actionType}')">
                        ${alert.actionLabel}
                    </button>
                `;
                containerAlertas.appendChild(item);
            });
        }
    }

    setFunnelBar(elementId, value, baseValue) {
        const bar = document.getElementById(elementId);
        const percentLabel = document.getElementById(`${elementId}-percent`);
        const percent = baseValue > 0 ? Math.min(100, Math.round((value / baseValue) * 100)) : 0;
        
        bar.style.width = baseValue > 0 ? `${percent}%` : '0%';
        bar.textContent = value;
        percentLabel.textContent = baseValue > 0 ? `${percent}%` : '0%';
    }

    irAAccionAlerta(diio, view, eventType) {
        this.selectedEventType = eventType;
        this.switchView(view);
        
        // Preseleccionar el animal en el selector
        const select = document.getElementById('event-animal-select');
        if (select) {
            // Asegurarnos que renderizó la lista con este animal incluido
            this.renderFormularioEvento();
            select.value = diio;
        }
    }

    // 2. Inventario Bovino
    renderInventario() {
        const searchVal = document.getElementById('search-diio').value.toLowerCase();
        const filterEst = document.getElementById('filter-estado').value;
        const filterCat = document.getElementById('filter-categoria').value;

        const container = document.getElementById('animal-grid-container');
        container.innerHTML = '';

        // Filtrar animales
        const filtrados = this.farmData.animales.filter(a => {
            const matchSearch = a.diio.toLowerCase().includes(searchVal) || a.raza.toLowerCase().includes(searchVal);
            const matchEstado = filterEst === 'Todos' || a.estado === filterEst;
            const matchCategoria = filterCat === 'Todos' || a.categoria === filterCat;
            return matchSearch && matchEstado && matchCategoria;
        });

        if (filtrados.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-muted);">
                    🔍 No se encontraron vacas o vaquillas con los filtros seleccionados.
                </div>`;
            return;
        }

        filtrados.forEach(a => {
            const card = document.createElement('div');
            card.className = 'animal-card';
            card.addEventListener('click', () => this.openDrawer(a));

            const ultimoEvento = a.historial.length > 0 ? a.historial[a.historial.length - 1] : null;
            const ultimoEventoTexto = ultimoEvento 
                ? `${ultimoEvento.tipo}: ${this.formatearFecha(ultimoEvento.fecha)}`
                : 'Sin registros';

            const edad = this.calcularEdad(a.fechaNacimiento);

            card.innerHTML = `
                <div class="animal-card-header">
                    <span class="diio-badge">🇨🇱 ${a.diio}</span>
                    <span class="state-badge ${a.estado.toLowerCase().replace(' ', '_')}">${a.estado}</span>
                </div>
                <div class="animal-card-body">
                    <div class="animal-info-row">
                        <span class="info-label">Categoría:</span>
                        <span class="info-value">${a.categoria}</span>
                    </div>
                    <div class="animal-info-row">
                        <span class="info-label">Raza:</span>
                        <span class="info-value">${a.raza}</span>
                    </div>
                    <div class="animal-info-row">
                        <span class="info-label">Edad:</span>
                        <span class="info-value">${edad} años</span>
                    </div>
                    <div class="animal-info-row">
                        <span class="info-label">Partos Exitosos:</span>
                        <span class="info-value">${a.partosExitosos}</span>
                    </div>
                </div>
                <div class="animal-card-footer">
                    <span class="last-event-text">${ultimoEventoTexto}</span>
                    <button class="btn-details">
                        Ver Historial ➔
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // 3. Formulario de Evento Reproductivo
    renderFormularioEvento() {
        // Renderizar los botones selectores del tipo de evento activo
        document.querySelectorAll('.event-type-btn').forEach(btn => {
            if (btn.getAttribute('data-type') === this.selectedEventType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Cargar selectores de animales y toros/potreros
        this.renderFormularioCampos();
    }

    renderFormularioCampos() {
        const animalSelect = document.getElementById('event-animal-select');
        animalSelect.innerHTML = '<option value="" disabled selected>Seleccione DIIO...</option>';

        // FILTRADO INTELIGENTE PARA EVITAR DOBLE DIGITACIÓN Y ERRORES
        // Según el tipo de evento, pre-filtramos qué animales se pueden seleccionar
        const hembrasAptas = this.farmData.animales.filter(a => {
            if (a.estado === 'Descartada') return false; // Descartadas no participan

            switch (this.selectedEventType) {
                case 'Encaste':
                    // Para encaste, deben estar Vacías o Paridas (listas para volver a encastar)
                    return a.estado === 'Vacía' || a.estado === 'Parida';
                case 'Preñez':
                    // Para tacto/ecografía de preñez, deben estar En Encaste o Vacías
                    return a.estado === 'En Encaste' || a.estado === 'Vacía';
                case 'Parto':
                    // Para parir, lógicamente deben estar Preñadas
                    return a.estado === 'Preñada';
                case 'Destete':
                    // Para destetar, deben estar Paridas (con cría al pie)
                    return a.estado === 'Parida';
                case 'Descarte':
                    // Cualquier animal vivo se puede descartar en cualquier momento
                    return true;
                default:
                    return true;
            }
        });

        hembrasAptas.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.diio;
            opt.textContent = `DIIO ${a.diio} (${a.categoria} - ${a.raza} - ${a.estado})`;
            animalSelect.appendChild(opt);
        });

        // Mostrar u ocultar campos específicos de cada evento
        const specificFieldsContainer = document.getElementById('event-specific-fields');
        specificFieldsContainer.innerHTML = '';

        const hoyStr = new Date().toISOString().split('T')[0];

        switch (this.selectedEventType) {
            case 'Encaste':
                // Campo Toro
                let toroOptions = this.farmData.toros.map(t => `<option value="${t.name}">${t.name} [DIIO: ${t.diio}]</option>`).join('');
                toroOptions = `<option value="Inseminación Artificial">Inseminación Artificial (IA)</option>` + toroOptions;

                // Campo Potrero
                const potreroOptions = this.farmData.potreros.map(p => `<option value="${p}">${p}</option>`).join('');

                specificFieldsContainer.innerHTML = `
                    <div class="form-group">
                        <label for="enc-fecha">Fecha Inicio Encaste</label>
                        <input type="date" id="enc-fecha" value="${hoyStr}" required>
                    </div>
                    <div class="form-group">
                        <label for="enc-metodo">Toro / Método</label>
                        <select id="enc-metodo" required>
                            ${toroOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="enc-potrero">Potrero</label>
                        <select id="enc-potrero" required>
                            ${potreroOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="enc-obs">Observaciones de Encaste</label>
                        <input type="text" id="enc-obs" placeholder="Ej. Retorno a celo, toro activo...">
                    </div>
                `;
                break;

            case 'Preñez':
                specificFieldsContainer.innerHTML = `
                    <div class="form-group">
                        <label for="preg-fecha">Fecha Diagnóstico</label>
                        <input type="date" id="preg-fecha" value="${hoyStr}" required>
                    </div>
                    <div class="form-group">
                        <label for="preg-resultado">Resultado del Tacto / Eco</label>
                        <select id="preg-resultado" required>
                            <option value="Preñada">Confirmada Preñada (Positivo)</option>
                            <option value="Vacía">Vacía (Negativo)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="preg-veterinario">Veterinario / Operador</label>
                        <input type="text" id="preg-veterinario" placeholder="Dr. Carter / Técnico">
                    </div>
                    <div class="form-group">
                        <label for="preg-obs">Detalles (Eco / Días de gestación)</label>
                        <input type="text" id="preg-obs" placeholder="Ej. Feto de 60 días, gestación normal...">
                    </div>
                `;
                break;

            case 'Parto':
                specificFieldsContainer.innerHTML = `
                    <div class="form-group">
                        <label for="part-fecha">Fecha de Parto</label>
                        <input type="date" id="part-fecha" value="${hoyStr}" required>
                    </div>
                    <div class="form-group">
                        <label for="part-estado">Estado de la Cría</label>
                        <select id="part-estado" required>
                            <option value="Vivo">Nacido Vivo</option>
                            <option value="Muerto">Nacido Muerto / Mortinato</option>
                            <option value="Aborto">Aborto</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="part-sexo">Sexo de la Cría (Si nació viva)</label>
                        <select id="part-sexo">
                            <option value="Macho">Macho</option>
                            <option value="Hembra">Hembra</option>
                            <option value="N/A">N/A</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="part-cria-diio">DIIO de la Cría (Opcional)</label>
                        <input type="text" id="part-cria-diio" placeholder="Ej. 140859999" maxlength="9">
                    </div>
                    <div class="form-group">
                        <label for="part-facilidad">Facilidad de Parto</label>
                        <select id="part-facilidad" required>
                            <option value="Sin ayuda">Normal (Sin ayuda)</option>
                            <option value="Ayuda leve">Asistido leve (Tracción manual)</option>
                            <option value="Ayuda veterinaria">Distócico severo (Asistencia Veterinaria/Cesárea)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="part-obs">Observaciones del Parto</label>
                        <input type="text" id="part-obs" placeholder="Ej. Buena habilidad materna, ubre sana...">
                    </div>
                `;
                break;

            case 'Destete':
                specificFieldsContainer.innerHTML = `
                    <div class="form-group">
                        <label for="dest-fecha">Fecha de Destete</label>
                        <input type="date" id="dest-fecha" value="${hoyStr}" required>
                    </div>
                    <div class="form-group">
                        <label for="dest-peso">Peso Promedio Estimado Cría (kg)</label>
                        <input type="number" id="dest-peso" min="100" max="350" value="220" required>
                    </div>
                    <div class="form-group">
                        <label for="dest-obs">Observaciones</label>
                        <input type="text" id="dest-obs" placeholder="Ej. Destete a los 7 meses. Ternero bien desarrollado...">
                    </div>
                `;
                break;

            case 'Descarte':
                specificFieldsContainer.innerHTML = `
                    <div class="form-group">
                        <label for="desc-fecha">Fecha de Descarte</label>
                        <input type="date" id="desc-fecha" value="${hoyStr}" required>
                    </div>
                    <div class="form-group">
                        <label for="desc-motivo">Motivo de Descarte</label>
                        <select id="desc-motivo" required>
                            <option value="Edad avanzada">Edad Avanzada / Desgaste Dentadura</option>
                            <option value="Infertilidad">Infertilidad (Vacía repetitiva)</option>
                            <option value="Problemas de parto">Historial de Partos Difíciles / Prolapso</option>
                            <option value="Problemas de ubre">Problemas de Ubre / Mastitis recurrente</option>
                            <option value="Temperamento">Temperamento Agresivo</option>
                            <option value="Otros">Otros (Enfermedad, accidente, etc.)</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label for="desc-obs">Detalles del Destino o Venta</label>
                        <input type="text" id="desc-obs" placeholder="Ej. Venta a feria de Osorno para faena...">
                    </div>
                `;
                break;
        }
    }

    procesarGuardarEvento(form) {
        const diio = document.getElementById('event-animal-select').value;
        if (!diio) {
            alert('Debe seleccionar un animal.');
            return;
        }

        const animal = this.farmData.animales.find(a => a.diio === diio);
        if (!animal) return;

        let nuevoEstado = animal.estado;
        let detalleEvento = '';
        let fechaEvento = '';

        // Extraer valores según tipo de evento
        switch (this.selectedEventType) {
            case 'Encaste':
                fechaEvento = document.getElementById('enc-fecha').value;
                const metodo = document.getElementById('enc-metodo').value;
                const potrero = document.getElementById('enc-potrero').value;
                const obsEnc = document.getElementById('enc-obs').value;
                
                nuevoEstado = 'En Encaste';
                detalleEvento = `Encaste iniciado con ${metodo} en ${potrero}. ${obsEnc}`;
                break;

            case 'Preñez':
                fechaEvento = document.getElementById('preg-fecha').value;
                const resultado = document.getElementById('preg-resultado').value;
                const vet = document.getElementById('preg-veterinario').value;
                const obsPreg = document.getElementById('preg-obs').value;

                nuevoEstado = resultado; // Puede ser 'Preñada' o 'Vacía'
                detalleEvento = `Diagnóstico de Preñez: ${resultado} (${obsPreg}). Realizado por: ${vet}`;
                break;

            case 'Parto':
                fechaEvento = document.getElementById('part-fecha').value;
                const estadoCria = document.getElementById('part-estado').value;
                const sexo = document.getElementById('part-sexo').value;
                const criaDiio = document.getElementById('part-cria-diio').value;
                const facilidad = document.getElementById('part-facilidad').value;
                const obsPart = document.getElementById('part-obs').value;

                nuevoEstado = 'Parida';
                detalleEvento = `Parto (${facilidad}). Cría: ${estadoCria} (${sexo}). DIIO Cría: ${criaDiio || 'S/D'}. Obs: ${obsPart}`;
                
                if (estadoCria === 'Vivo') {
                    animal.partosExitosos = (animal.partosExitosos || 0) + 1;
                }
                break;

            case 'Destete':
                fechaEvento = document.getElementById('dest-fecha').value;
                const peso = document.getElementById('dest-peso').value;
                const obsDest = document.getElementById('dest-obs').value;

                // El destete finaliza el ciclo productivo. El animal vuelve a estar Vacío, listo para encaste
                nuevoEstado = 'Vacía';
                detalleEvento = `Destete completado. Peso estimado cría: ${peso} kg. Obs: ${obsDest}`;
                break;

            case 'Descarte':
                fechaEvento = document.getElementById('desc-fecha').value;
                const motivo = document.getElementById('desc-motivo').value;
                const obsDesc = document.getElementById('desc-obs').value;

                nuevoEstado = 'Descartada';
                detalleEvento = `Descarte por motivo: ${motivo}. Detalles: ${obsDesc}`;
                break;
        }

        // Registrar evento en el historial del animal
        animal.estado = nuevoEstado;
        
        // Si el animal es una Vaquilla y tuvo un parto exitoso, se convierte en Vaca
        if (animal.categoria === 'Vaquilla' && this.selectedEventType === 'Parto') {
            animal.categoria = 'Vaca';
            animal.historial.push({
                fecha: fechaEvento,
                tipo: 'Evolución',
                detalle: 'Cambio automático de categoría: Vaquilla a Vaca al registrar su primer parto.'
            });
        }

        animal.historial.push({
            fecha: fechaEvento,
            tipo: this.selectedEventType,
            detalle: detalleEvento
        });

        // Ordenar historial por fecha
        animal.historial.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        this.saveToStorage();
        alert('Evento reproductivo registrado correctamente.');
        
        // Resetear formulario y volver al inventario o dashboard
        form.reset();
        this.switchView('inventario');
    }

    procesarAgregarAnimal(form) {
        const diio = document.getElementById('new-diio').value;
        const categoria = document.getElementById('new-categoria').value;
        const raza = document.getElementById('new-raza').value;
        const fechaNac = document.getElementById('new-nacimiento').value;

        // Validar DIIO chileno (9 dígitos obligatorios si es numérico estricto, o formato libre validado)
        if (!/^\d{9}$/.test(diio)) {
            alert('El DIIO debe contener exactamente 9 dígitos numéricos chilenos.');
            return;
        }

        // Validar duplicado
        if (this.farmData.animales.some(a => a.diio === diio)) {
            alert('Ya existe un animal registrado con este número DIIO.');
            return;
        }

        const nuevoAnimal = {
            diio: diio,
            categoria: categoria,
            raza: raza,
            fechaNacimiento: fechaNac,
            estado: 'Vacía', // Todo animal ingresa vacío
            partosExitosos: 0,
            historial: [
                {
                    fecha: new Date().toISOString().split('T')[0],
                    tipo: 'Registro',
                    detalle: `Ingreso al inventario predial como ${categoria}. Estado: Vacía.`
                }
            ]
        };

        this.farmData.animales.push(nuevoAnimal);
        this.saveToStorage();
        alert('Animal registrado en el predio correctamente.');
        
        form.reset();
        // Cerrar modal de registro (si se usa modal, en este caso ocultamos o limpiamos)
        this.renderInventario();
    }

    // 4. Panel de Decisiones de Descarte
    renderDescarte() {
        const candidatas = this.obtenerCandidatasDescarte();
        const container = document.getElementById('descarte-cards-container');
        container.innerHTML = '';

        if (candidatas.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-muted); background: white; border-radius: 12px;">
                    🌿 ¡Excelente eficiencia! No hay vacas recomendadas para descarte en esta revisión.
                </div>`;
            return;
        }

        candidatas.forEach(c => {
            const card = document.createElement('div');
            card.className = 'descarte-card';

            const motivosHTML = c.motivos.map(m => `<span class="reason-badge">${m}</span>`).join(' ');

            card.innerHTML = `
                <div>
                    <div class="descarte-card-header">
                        <h4>DIIO: ${c.animal.diio}</h4>
                        <span class="state-badge vacia">${c.animal.estado}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        ${motivosHTML}
                    </div>
                    <div class="descarte-card-body">
                        <p>${c.detalle}</p>
                        <p style="font-weight:600; color:var(--color-state-descarte); margin-top:0.8rem;">
                            ⚠️ Recomendación: Retirar del ciclo productivo.
                        </p>
                    </div>
                </div>
                <button class="btn-danger" onclick="app.confirmarDescarteRapido('${c.animal.diio}')">
                    Registrar Venta/Descarte
                </button>
            `;
            container.appendChild(card);
        });
    }

    confirmarDescarteRapido(diio) {
        this.selectedEventType = 'Descarte';
        this.switchView('registrar-evento');
        // Preseleccionar el animal
        document.getElementById('event-animal-select').value = diio;
    }

    // 5. Drawer de Detalles de un Animal (Línea de tiempo)
    openDrawer(animal) {
        this.selectedAnimal = animal;
        
        document.getElementById('drawer-diio').textContent = `Ficha Animal: DIIO ${animal.diio}`;
        document.getElementById('drawer-categoria').textContent = animal.categoria;
        document.getElementById('drawer-raza').textContent = animal.raza;
        document.getElementById('drawer-edad').textContent = `${this.calcularEdad(animal.fechaNacimiento)} años`;
        document.getElementById('drawer-nacimiento').textContent = this.formatearFecha(animal.fechaNacimiento);
        document.getElementById('drawer-partos').textContent = animal.partosExitosos;

        // Renderizar línea de tiempo del historial
        const timeline = document.getElementById('drawer-timeline');
        timeline.innerHTML = '';

        if (animal.historial.length === 0) {
            timeline.innerHTML = '<p style="color: var(--color-text-muted);">Sin historial registrado.</p>';
        } else {
            animal.historial.forEach(h => {
                const item = document.createElement('div');
                item.className = `timeline-item ${h.tipo.toLowerCase().replace(' ', '_')}`;
                
                item.innerHTML = `
                    <div class="timeline-dot"></div>
                    <div class="timeline-date">${this.formatearFecha(h.fecha)}</div>
                    <div class="timeline-title">${h.tipo}</div>
                    <div class="timeline-details">${h.detalle}</div>
                `;
                timeline.appendChild(item);
            });
        }

        // Mostrar Drawer
        document.getElementById('drawer-details').classList.add('active');
    }

    closeDrawer() {
        document.getElementById('drawer-details').classList.remove('active');
        this.selectedAnimal = null;
    }

    // 6. Respaldo (Exportación e Importación CSV)
    renderRespaldo() {
        // No necesita lógica pesada de dibujo, la interfaz es estática
    }

    exportarCSV() {
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Encabezados
        csvContent += "DIIO,Categoria,Raza,FechaNacimiento,EstadoReproductivo,PartosExitosos,HistorialEventos\n";

        this.farmData.animales.forEach(a => {
            // Serializar historial en una sola celda usando delimitadores internos alternativos
            const historialSerializado = a.historial.map(h => `${h.fecha}|${h.tipo}|${h.detalle}`).join(';');
            
            const row = [
                a.diio,
                a.categoria,
                a.raza,
                a.fechaNacimiento,
                a.estado,
                a.partosExitosos,
                `"${historialSerializado.replace(/"/g, '""')}"`
            ].join(',');

            csvContent += row + "\n";
        });

        // Crear elemento de descarga
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `respaldo_reproduccion_${this.farmData.predioName.toLowerCase().replace(/ /g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    importarCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n');
            const nuevosAnimales = [];

            try {
                // Omitir cabecera
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Regex para procesar celdas con comillas (historial)
                    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                    if (!matches || matches.length < 6) continue;

                    const diio = matches[0].replace(/"/g, '');
                    const categoria = matches[1].replace(/"/g, '');
                    const raza = matches[2].replace(/"/g, '');
                    const nacimiento = matches[3].replace(/"/g, '');
                    const estado = matches[4].replace(/"/g, '');
                    const partos = parseInt(matches[5].replace(/"/g, ''), 10);
                    
                    let historial = [];
                    if (matches[6]) {
                        const histRaw = matches[6].replace(/"/g, '');
                        historial = histRaw.split(';').map(evStr => {
                            const partes = evStr.split('|');
                            return {
                                fecha: partes[0],
                                tipo: partes[1],
                                detalle: partes[2]
                            };
                        }).filter(h => h.fecha && h.tipo);
                    }

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

                if (nuevosAnimales.length > 0) {
                    this.farmData.animales = nuevosAnimales;
                    this.saveToStorage();
                    alert(`Importación exitosa. Se cargaron ${nuevosAnimales.length} animales.`);
                    this.switchView('dashboard');
                } else {
                    alert('No se encontraron registros válidos en el archivo.');
                }
            } catch (err) {
                console.error(err);
                alert('Error al analizar el archivo CSV. Asegúrese de que el formato sea correcto.');
            }
        };
        reader.readAsText(file);
    }

    // --- UTILIDADES ---
    diferenciaDias(fecha1, fecha2) {
        const f1 = new Date(fecha1);
        const f2 = new Date(fecha2);
        const diffTime = Math.abs(f2 - f1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    sumarDias(fecha, dias) {
        const result = new Date(fecha);
        result.setDate(result.getDate() + dias);
        return result.toISOString().split('T')[0];
    }

    calcularEdad(fechaNacimiento) {
        const hoy = new Date();
        const cumple = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - cumple.getFullYear();
        const m = hoy.getMonth() - cumple.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
            edad--;
        }
        return Math.max(0, edad);
    }

    formatearFecha(fechaStr) {
        if (!fechaStr) return '';
        const partes = fechaStr.split('-');
        if (partes.length !== 3) return fechaStr;
        return `${partes[2]}/${partes[1]}/${partes[0]}`; // Formato chileno DD/MM/YYYY
    }
}

// Instanciar la app globalmente
window.addEventListener('DOMContentLoaded', () => {
    window.app = new SistemaBovino();
});
