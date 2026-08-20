import React, { useState, useEffect, useCallback, useRef } from "react";
// import "../styles/PizarraNorthWest.css";
import Swal from "sweetalert2";
import "../styles/PizarraNorthwest.css"; // Asegúrate que la ruta sea correcta

// --- Constantes ---
const EPSILON = 1e-9; // Para comparaciones generales de punto flotante
const EPSILON_UV = 1e-7; // Tolerancia más específica para verificación U/V

// --- Funciones Auxiliares ---
const deepCopy = (data) => JSON.parse(JSON.stringify(data));
const verificarTodosNoPositivos = (matrix) => { /* ... (sin cambios) ... */
    if (!matrix || matrix.length === 0) return true;
    for (let i = 0; i < matrix.length; i++) {
        if (!matrix[i] || !Array.isArray(matrix[i])) continue;
        for (let j = 0; j < matrix[i].length; j++) {
            const v = matrix[i][j];
            if (typeof v === 'number' && v > EPSILON) return false;
        }
    }
    return true;
};
const verificarTodosNoNegativos = (matrix) => { /* ... (sin cambios) ... */
    if (!matrix || matrix.length === 0) return true;
    for (let i = 0; i < matrix.length; i++) {
        if (!matrix[i] || !Array.isArray(matrix[i])) continue;
        for (let j = 0; j < matrix[i].length; j++) {
            const v = matrix[i][j];
            if (typeof v === 'number' && v < -EPSILON) return false;
        }
    }
    return true;
};
const matrizSolucionToString = (matrix) => { /* ... (sin cambios) ... */
    if (!matrix) return 'null';
    try {
        return JSON.stringify(matrix.map(row =>
            (row || []).map(cell =>
                (cell === null || cell === undefined || isNaN(cell)) ? 'N' : (Math.abs(cell) < EPSILON ? 0 : cell).toFixed(5)
            )
        ));
    } catch (e) {
        console.error("Error stringifying matrix:", e, matrix);
        return `error-${Date.now()}`;
    }
};

// --- Componente React ---
const PizarraTransporteCicloFijo4 = () => {
    // --- Estados del Componente ---
    const [filas, setFilas] = useState(3);
    const [columnas, setColumnas] = useState(4);
    // Valores iniciales de ejemplo (puedes cambiarlos o dejarlos en 0)
    const [matrizCostos, setMatrizCostos] = useState([
        [0, 0, 0, 0], // Ejemplo que diste
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ]);
    const [demanda, setDemanda] = useState([0, 0, 0, 0]); // Ejemplo que diste (sumas)
    const [oferta, setOferta] = useState([0, 0, 0]); // Ejemplo que diste (sumas)
    const [historialIteraciones, setHistorialIteraciones] = useState([]);
    const [calculando, setCalculando] = useState(false);
    const [procesoTerminado, setProcesoTerminado] = useState(false);
    const [errorProceso, setErrorProceso] = useState(null);
    const [iteracionNum, setIteracionNum] = useState(0);
    const [logPasos, setLogPasos] = useState([]);
    const [modoOptimizacion, setModoOptimizacion] = useState(null);
    const vistoSoluciones = useRef(new Set());
    const fileInputRef = useRef(null);

    // --- Handlers de UI y Reset ---
    const handleDimensionChange = (e, type) => { /* ... (sin cambios) ... */ };
    const handleInputChange = (e, i, j, type) => { /* ... (sin cambios, usa Number() ) ... */
        const rawValue = e.target.value;
        const value = rawValue === '' ? '' : Number(rawValue); // Permitir vacío, convertir a número si no
        const checkedValue = (typeof value === 'number' && !isNaN(value) && value >= 0) ? value : 0; // Usar 0 si no es número válido >= 0

        resetProceso();

            if (type === "matriz") {
                const newMatrix = deepCopy(matrizCostos);
                // Asegurarse de que la fila existe
                if (!newMatrix[i]) newMatrix[i] = Array(columnas).fill(0);
                newMatrix[i][j] = checkedValue;
                setMatrizCostos(newMatrix);
            } else if (type === "oferta") {
                const newOferta = [...oferta];
                newOferta[i] = checkedValue;
                setOferta(newOferta);
            } else if (type === "demanda") {
                const newDemanda = [...demanda];
                newDemanda[j] = checkedValue;
                setDemanda(newDemanda);
            }
        };
        const resetProceso = useCallback(() => { /* ... (sin cambios) ... */
            setHistorialIteraciones([]);
            setLogPasos([]);
            setCalculando(false);
            setProcesoTerminado(false);
            setErrorProceso(null);
            setIteracionNum(0);
            setModoOptimizacion(null);
            vistoSoluciones.current.clear();
            console.log("Proceso reseteado.");
        }, []);

        // --- Validación y Ajuste con Dummy ---
        const ajustarMatrizConDummy = useCallback(() => { /* ... (sin cambios) ... */
            let currentOferta = [...oferta];
            let currentDemanda = [...demanda];
            let currentMatrizCostos = deepCopy(matrizCostos);
            let currentFilas = filas;
            let currentColumnas = columnas;
            let adjusted = false;

            const sumaOferta = currentOferta.reduce((a, b) => a + (Number(b) || 0), 0);
            const sumaDemanda = currentDemanda.reduce((a, b) => a + (Number(b) || 0), 0);
            const diferencia = sumaOferta - sumaDemanda;

            if (Math.abs(diferencia) > EPSILON) {
                adjusted = true;
                if (diferencia > 0) {
                    console.log(`Ajustando: Oferta (${sumaOferta}) > Demanda (${sumaDemanda}). Añadiendo columna dummy.`);
                    currentColumnas += 1;
                    currentDemanda.push(diferencia);
                    currentMatrizCostos = currentMatrizCostos.map(fila => [...(fila || []), 0]); // Añadir 0 a cada fila existente
                    // Asegurar que las filas nuevas (si las hay) tengan la nueva columna
                    while (currentMatrizCostos.length < currentFilas) {
                        currentMatrizCostos.push(Array(currentColumnas).fill(0));
                    }

                } else {
                    console.log(`Ajustando: Demanda (${sumaDemanda}) > Oferta (${sumaOferta}). Añadiendo fila dummy.`);
                    currentFilas += 1;
                    currentOferta.push(Math.abs(diferencia));
                    currentMatrizCostos.push(Array(currentColumnas).fill(0));
                }
                setFilas(currentFilas);
                setColumnas(currentColumnas);
                setOferta(currentOferta);
                setDemanda(currentDemanda);
                setMatrizCostos(currentMatrizCostos);
                console.log("Estado actualizado post-ajuste dummy.");
            } else {
                console.log("Oferta y Demanda ya balanceadas o ambas cero.");
            }
            return adjusted;
        }, [oferta, demanda, matrizCostos, filas, columnas]);

        const validarDatos = useCallback(() => { /* ... (sin cambios) ... */
            const ajustado = ajustarMatrizConDummy(); // Llama al ajuste

            // Validar el estado *actual* (puede que el ajuste aún no se refleje si es asíncrono)
            const sO = oferta.reduce((a, b) => a + (Number(b) || 0), 0);
            const sD = demanda.reduce((a, b) => a + (Number(b) || 0), 0);

            if (sO <= 0 && sD <= 0 && filas > 0 && columnas > 0) return true; // Permitir empezar vacío

            if (sO <= 0 || sD <= 0) {
                Swal.fire("Error", "Las sumas de Oferta y Demanda deben ser mayores que 0.", "error");
                return false;
            }
            // La validación de balance se hará implícitamente por el ajuste dummy
            if (Math.abs(sO - sD) > EPSILON && !ajustado) {
                console.warn(`Datos desbalanceados (${sO} vs ${sD}) y no se ajustó (¿error?).`);
                // Podría ser un error si el ajuste no funciona
                // Swal.fire("Desbalanceado", `La suma de Oferta (${sO}) no coincide con Demanda (${sD}). Se intentará ajustar.`, "warning");
                // Devolver true para permitir que el inicio intente el ajuste de nuevo si es necesario.
            }
            // Validar que todos los números sean >= 0
            if ([
                    ...(matrizCostos.flat().filter(v => v !== undefined && v !== null)), // Filtrar undefined/null antes de validar
                    ...(oferta.filter(v => v !== undefined && v !== null)),
                    ...(demanda.filter(v => v !== undefined && v !== null))
                ].some(v => typeof v !== 'number' || v < 0)) {
                console.log("Costos:", matrizCostos.flat());
                console.log("Oferta:", oferta);
                console.log("Demanda:", demanda);
                Swal.fire("Error", "Todos los costos, ofertas y demandas deben ser números no negativos.", "error");
                return false;
            }
            if (filas <= 0 || columnas <= 0) {
                Swal.fire("Error", "Debe haber al menos una Fila y una Columna.", "error");
                return false;
            }
            return true; // Pasa las validaciones básicas
        }, [ajustarMatrizConDummy, matrizCostos, oferta, demanda, filas, columnas]);

        // --- Cálculos Base del Método de Transporte ---

        const calcularCosto = useCallback((mS, c) => { /* ... (sin cambios) ... */
            let cost = 0;
            if (!mS || !c || mS.length !== filas || c.length !== filas) return 0;
            for (let i = 0; i < filas; i++) {
                if (!mS[i] || !c[i] || mS[i].length !== columnas || c[i].length !== columnas) continue;
                for (let j = 0; j < columnas; j++) {
                    if ((mS[i][j] ?? 0) > EPSILON && typeof c[i][j] === 'number') {
                        cost += mS[i][j] * c[i][j];
                    }
                }
            }
            return cost;
        }, [filas, columnas]);

        const calcularMatrizNWInicial = useCallback(() => { /* ... (sin cambios, usa EPSILON) ... */
            const m = Array(filas).fill().map(() => Array(columnas).fill(0));
            let oR = [...oferta];
            let dR = [...demanda];
            let i = 0, j = 0;

            while (i < filas && j < columnas) {
                const oVal = oR[i] ?? 0; // Usar 0 si es undefined
                const dVal = dR[j] ?? 0; // Usar 0 si es undefined
                const cant = Math.min(oVal, dVal);

                if (cant > EPSILON) {
                    m[i][j] = cant;
                    oR[i] -= cant;
                    dR[j] -= cant;
                }

                // Moverse
                const ofertaAgotada = oR[i] < EPSILON;
                const demandaAgotada = dR[j] < EPSILON;

                if (ofertaAgotada && i < filas - 1) {
                    i++; // Mover abajo si oferta se agota (y no es la última fila)
                } else if (demandaAgotada && j < columnas - 1) {
                    j++; // Mover derecha si demanda se agota (y no es la última columna)
                } else if (i < filas - 1) {
                    i++; // Si no se agota oferta, pero demanda sí (o ambas), intentar mover abajo
                } else if (j < columnas - 1) {
                    j++; // Si solo queda moverse a la derecha
                }
                else {
                    break; // Si estamos en la esquina inferior derecha o no hay a dónde moverse
                }
            }
            return m;
        }, [filas, columnas, oferta, demanda]);

        const generarMatrizZ = useCallback((matrizSolucion, costos) => { /* ... (sin cambios, usa EPSILON) ... */
            if (!matrizSolucion || matrizSolucion.length !== filas || !costos || costos.length !== filas) return [];
            return matrizSolucion.map((fila, i) => {
                if (!fila || fila.length !== columnas || !costos[i] || costos[i].length !== columnas) return Array(columnas).fill(null);
                return fila.map((valorAsignado, j) =>
                    ((valorAsignado ?? 0) > EPSILON ? costos[i]?.[j] : null) // Usa costo si asignación > epsilon, si no null
                );
            });
        }, [filas, columnas]);

        const calcularUV_MetodoDirecto = (matrizZ, n, m, log) => {
            log.push("--- Iniciando cálculo de U/V (Método Directo) ---");

            let U = Array(n).fill(null);
            let V = Array(m).fill(null);
            const celdasConocidas = [];
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    const costo = matrizZ[i]?.[j];
                    if (costo !== null && typeof costo === 'number' && !isNaN(costo)) {
                        celdasConocidas.push({ i, j, costo });
                    }
                }
            }

            log.push(`  Número de celdas conocidas (ecuaciones): ${celdasConocidas.length}`);
            if (celdasConocidas.length === 0 && n > 0 && m > 0) {
                log.push("  ADVERTENCIA: No hay celdas conocidas. Se devolverán U y V como ceros.");
                return { ofertas: Array(n).fill(0), demandas: Array(m).fill(0), consistente: true };
            }
            if (celdasConocidas.length < n + m - 1) {
                log.push(`  ADVERTENCIA: Número de celdas conocidas (${celdasConocidas.length}) es menor que n+m-1 (${n + m - 1}). La solución puede no ser única o el problema ser degenerado/desconectado.`);
            }

            let uCalculados = 0;
            let vCalculados = 0;

            const componentes = [];
            const filasVisitadas = Array(n).fill(false);
            const columnasVisitadas = Array(m).fill(false);
            let componentesEncontrados = 0;

            log.push("  Identificando componentes conexos basados en celdas conocidas...");
            for (let filaInicial = 0; filaInicial < n; filaInicial++) {
                if (!filasVisitadas[filaInicial] && celdasConocidas.some(c => c.i === filaInicial)) {
                    componentesEncontrados++;
                    const componenteActual = { id: componentesEncontrados, filas: new Set(), columnas: new Set(), celdas: [] };
                    const filaQueue = [filaInicial];
                    filasVisitadas[filaInicial] = true;
                    componenteActual.filas.add(filaInicial);

                    let head = 0;
                    while (head < filaQueue.length) {
                        const filaActual = filaQueue[head++];
                        for (const celda of celdasConocidas) {
                            if (celda.i === filaActual && !componenteActual.columnas.has(celda.j)) {
                                if (!columnasVisitadas[celda.j]) {
                                    columnasVisitadas[celda.j] = true;
                                }
                                componenteActual.columnas.add(celda.j);
                                for (const celda2 of celdasConocidas) {
                                    if (celda2.j === celda.j && !componenteActual.filas.has(celda2.i)) {
                                        if (!filasVisitadas[celda2.i]) {
                                            filasVisitadas[celda2.i] = true;
                                            filaQueue.push(celda2.i);
                                        }
                                        componenteActual.filas.add(celda2.i);
                                    }
                                }
                            }
                        }
                    }
                    componenteActual.celdas = celdasConocidas.filter(c => componenteActual.filas.has(c.i) && componenteActual.columnas.has(c.j));
                    log.push(`    Componente ${componenteActual.id}: ${componenteActual.filas.size} filas ([${[...componenteActual.filas].map(f => f + 1).join(',')}]]), ${componenteActual.columnas.size} cols ([${[...componenteActual.columnas].map(f => f + 1).join(',')}]]), ${componenteActual.celdas.length} celdas internas.`);
                    if (componenteActual.celdas.length > 0) {
                        componentes.push(componenteActual);
                    }
                }
            }
            log.push(`  Identificación de componentes completa. ${componentes.length} componente(s) útil(es) encontrado(s).`);
            if (componentes.length > 1) {
                log.push("  ADVERTENCIA: Se encontraron múltiples componentes útiles. El problema es degenerado.");
            }
            if (componentes.length === 0 && celdasConocidas.length > 0) {
                log.push("  ERROR CRÍTICO: Hay celdas conocidas pero no se formó ningún componente útil. Revisar lógica de componentes.");
                const compFallback = { id: 1, filas: new Set(), columnas: new Set(), celdas: celdasConocidas };
                celdasConocidas.forEach(c => { compFallback.filas.add(c.i); compFallback.columnas.add(c.j); });
                componentes.push(compFallback);
                log.push("  Fallback: Intentando resolver con todas las celdas conocidas juntas.");
            }

            for (const componente of componentes) {
                log.push(`--- Resolviendo Componente ${componente.id} ---`);
                let uAsignadoEnComponente = false;
                let vAsignadoEnComponente = false;
                let uFijadoIndex = -1;
                let vFijadoIndex = -1;

                for (const i of componente.filas) { if (U[i] !== null) uAsignadoEnComponente = true; }
                for (const j of componente.columnas) { if (V[j] !== null) vAsignadoEnComponente = true; }

                if (!uAsignadoEnComponente && !vAsignadoEnComponente) {
                    const primeraFilaComp = Math.min(...componente.filas);
                    if (U[primeraFilaComp] === null) {
                        log.push(`  Fijando U[${primeraFilaComp + 1}] = 0 arbitrariamente para iniciar componente ${componente.id}.`);
                        U[primeraFilaComp] = 0;
                        uFijadoIndex = primeraFilaComp;
                        uCalculados++;
                    } else {
                        log.push(`  U[${primeraFilaComp + 1}] ya tenía valor ${U[primeraFilaComp]}? Usando valor existente.`);
                    }
                } else {
                    log.push(`  El componente ${componente.id} ya tiene al menos un U/V fijado.`);
                }

                let cambiosEnIteracion = true;
                let iterNum = 0;
                const MAX_ITER_COMP = (componente.filas.size + componente.columnas.size) * 2 + 5;

                while (cambiosEnIteracion && iterNum < MAX_ITER_COMP) {
                    cambiosEnIteracion = false;
                    iterNum++;

                    for (const celda of componente.celdas) {
                        const { i, j, costo } = celda;
                        if (U[i] !== null && V[j] === null) {
                            V[j] = costo - U[i];
                            if (vFijadoIndex === -1) vFijadoIndex = j;
                            vCalculados++;
                            cambiosEnIteracion = true;
                            log.push(`      Calc (U[${i + 1}]=${U[i].toFixed(3)}): V[${j + 1}] = ${costo.toFixed(3)} - ${U[i].toFixed(3)} = ${V[j].toFixed(3)}`);
                        } else if (U[i] === null && V[j] !== null) {
                            U[i] = costo - V[j];
                            if (uFijadoIndex === -1) uFijadoIndex = i;
                            uCalculados++;
                            cambiosEnIteracion = true;
                            log.push(`      Calc (V[${j + 1}]=${V[j].toFixed(3)}): U[${i + 1}] = ${costo.toFixed(3)} - ${V[j].toFixed(3)} = ${U[i].toFixed(3)}`);
                        }
                    }
                }

                if (iterNum >= MAX_ITER_COMP) {
                    log.push(`  ADVERTENCIA: Se alcanzó el límite de iteraciones (${MAX_ITER_COMP}) en el componente ${componente.id}. Puede haber un problema.`);
                } else {
                    log.push(`  Componente ${componente.id} resuelto (o estabilizado) en ${iterNum} iteraciones.`);
                }

                let uFaltantesComp = 0; let vFaltantesComp = 0;
                for (const i of componente.filas) { if (U[i] === null) uFaltantesComp++; }
                for (const j of componente.columnas) { if (V[j] === null) vFaltantesComp++; }
                if (uFaltantesComp > 0 || vFaltantesComp > 0) {
                    log.push(`  ADVERTENCIA: Después de iterar en componente ${componente.id}, ${uFaltantesComp} U y ${vFaltantesComp} V siguen siendo null.`);
                }
            }

            let uFaltantesTotal = 0; let vFaltantesTotal = 0;
            for (let i = 0; i < n; i++) if (U[i] === null) uFaltantesTotal++;
            for (let j = 0; j < m; j++) if (V[j] === null) vFaltantesTotal++;
            if (uFaltantesTotal > 0 || vFaltantesTotal > 0) {
                log.push(`  ADVERTENCIA FINAL: Quedaron ${uFaltantesTotal} U y ${vFaltantesTotal} V como null. Rellenando con 0.`);
                for (let i = 0; i < n; i++) if (U[i] === null) U[i] = 0;
                for (let j = 0; j < m; j++) if (V[j] === null) V[j] = 0;
            } else {
                log.push("  Todos los U y V fueron calculados o rellenados.");
            }

            log.push("--- Verificando consistencia (U[i] + V[j] == costo[i][j] para celdas conocidas) ---");
            let consistente = true;
            let numInconsistencias = 0;
            for (const celda of celdasConocidas) {
                const { i, j, costo } = celda;
                if (U[i] === null || V[j] === null) {
                    log.push(`  ERROR de Verificación en (${i + 1},${j + 1}): U o V es null (U=${U[i]}, V=${V[j]}). Inconsistente.`);
                    consistente = false; numInconsistencias++; continue;
                }
                const sumaUV = U[i] + V[j];
                if (Math.abs(sumaUV - costo) > EPSILON_UV) {
                    log.push(`  INCONSISTENCIA en (${i + 1},${j + 1}): U+V = ${U[i].toFixed(3)} + ${V[j].toFixed(3)} = ${sumaUV.toFixed(3)} !== Costo = ${costo.toFixed(3)} (Diff: ${Math.abs(sumaUV - costo).toExponential(2)})`);
                    consistente = false; numInconsistencias++;
                }
            }
            if (consistente) {
                log.push("  Verificación completada: La solución U/V es CONSISTENTE.");
            } else {
                log.push(`  Verificación completada: Se encontraron ${numInconsistencias} INCONSISTENCIAS.`);
            }
            log.push("--- Fin cálculo U/V ---");

            return { ofertas: U, demandas: V, consistente: consistente };
        };

        const generarMatrizZFinal = useCallback((matrizZOriginal, resultadosUV, currentLog) => { /* ... (sin cambios) ... */
            const logPush = (msg) => currentLog && currentLog.push(msg);
            logPush("  Generando Matriz Z* (Costos Implícitos)...");
            if (!matrizZOriginal || !resultadosUV || !resultadosUV.ofertas || !resultadosUV.demandas || matrizZOriginal.length !== filas || resultadosUV.ofertas.length !== filas) {
                logPush("  ERROR: Datos inválidos para generar Matriz Z*."); console.error("Input inválido para generarMatrizZFinal", { matrizZOriginal, resultadosUV });
                return Array(filas).fill().map(() => Array(columnas).fill(null));
            }
            if (filas > 0 && (!matrizZOriginal[0] || matrizZOriginal[0].length !== columnas || resultadosUV.demandas.length !== columnas)) {
                logPush("  ERROR: Dimensiones inconsistentes para generar Matriz Z*."); console.error("Dimensiones inconsistentes para generarMatrizZFinal");
                return Array(filas).fill().map(() => Array(columnas).fill(null));
            }
            const U = resultadosUV.ofertas; const V = resultadosUV.demandas;
            const matrizZStar = Array(filas).fill().map(() => Array(columnas).fill(null));
            for (let i = 0; i < filas; i++) {
                for (let j = 0; j < columnas; j++) {
                    const valorZOriginal = matrizZOriginal[i]?.[j];
                    const uVal = U[i]; const vVal = V[j];
                    if (uVal === null || vVal === null) {
                        logPush(`    - Z*[${i + 1}][${j + 1}]: ERROR - U[${i+1}]=${uVal} o V[${j+1}]=${vVal} es null.`);
                        matrizZStar[i][j] = null; continue;
                    }
                    const uvSum = uVal + vVal;
                    if (valorZOriginal !== null && typeof valorZOriginal === 'number') {
                        matrizZStar[i][j] = valorZOriginal;
                        if (Math.abs(valorZOriginal - uvSum) > EPSILON_UV) {
                            logPush(`      * ADVERTENCIA: U+V (${uvSum.toFixed(3)}) ≠ Costo (${valorZOriginal.toFixed(3)}) para celda básica (${i+1},${j+1}).`);
                        }
                    } else {
                        matrizZStar[i][j] = uvSum;
                    }
                }
            }
            logPush("  Generación de Matriz Z* completada.");
            return matrizZStar;
        }, [filas, columnas]);

        const calcularMatrizResultadoFinal = useCallback((mZF, costos) => { /* ... (sin cambios) ... */
            const currentLog = []; const logPush = (msg) => currentLog.push(msg);
            logPush("  Calculando Matriz Resultado Final (C - Z*)...");
            if (!mZF || mZF.length !== filas || !costos || costos.length !== filas) { logPush("  ERROR: Datos inválidos para calcular C-Z*."); return Array(filas).fill().map(() => Array(columnas).fill(null)); }
            if (filas > 0 && (!mZF[0] || mZF[0].length !== columnas || !costos[0] || costos[0].length !== columnas)) { logPush("  ERROR: Dimensiones inconsistentes para calcular C-Z*."); return Array(filas).fill().map(() => Array(columnas).fill(null)); }
            const matrizResultado = Array(filas).fill().map(() => Array(columnas).fill(null));
            for (let i = 0; i < filas; i++) {
                for (let j = 0; j < columnas; j++) {
                    const costoReal = costos[i]?.[j]; const costoImplicito = mZF[i]?.[j];
                    if (typeof costoReal === 'number' && typeof costoImplicito === 'number') {
                        matrizResultado[i][j] = costoReal - costoImplicito;
                    } else { matrizResultado[i][j] = null; }
                }
            }
            logPush("  Cálculo de Matriz Resultado Final (C-Z*) completado.");
            return matrizResultado;
        }, [filas, columnas]);

        const encontrarCeldaPivote = useCallback((matrizResultadoFinal, matrizSolucionActual, modo, log) => { /* ... (sin cambios, usa EPSILON) ... */
            let celdaPivote = null;
            let valorExtremo = (modo === 'MAX') ? EPSILON : -EPSILON;

            log.push(`Buscando celda pivote (${modo}):`);
            for (let i = 0; i < filas; i++) {
                for (let j = 0; j < columnas; j++) {
                    const valorResultado = matrizResultadoFinal[i]?.[j];
                    const esBasica = (matrizSolucionActual[i]?.[j] ?? 0) > EPSILON;
                    if (esBasica || typeof valorResultado !== 'number') continue;

                    if (modo === 'MAX' && valorResultado > valorExtremo) {
                            valorExtremo = valorResultado; celdaPivote = { i, j };
                    } else if (modo === 'MIN' && valorResultado < valorExtremo) {
                            valorExtremo = valorResultado; celdaPivote = { i, j };
                    }
                }
            }
            if (celdaPivote) {
                log.push(`  Celda Pivote (entrante) seleccionada: (${celdaPivote.i + 1}, ${celdaPivote.j + 1}) con valor C-Z* ${valorExtremo.toFixed(3)}`);
            } else {
                log.push("  No se encontró celda pivote candidata (óptimo o sin mejora).");
            }
            return celdaPivote;
        }, [filas, columnas]);

        const intentarAjusteUsuario = (matrizSolucionActual, celdaPivote, filas, columnas, log) => { /* ... (sin cambios, usa EPSILON) ... */
            const r_max = celdaPivote.i;
            const c_max = celdaPivote.j;
            log.push(`--- Intentando Ajuste Usuario para Pivote (${r_max + 1}, ${c_max + 1}) ---`);

            log.push("  Fase 1: Buscando Theta y Ajuste en COLUMNA");
            const candidatosColumna = [];
            for (let i = 0; i < filas; i++) { if (i !== r_max) { const v = matrizSolucionActual[i]?.[c_max] ?? 0; if (v > EPSILON) candidatosColumna.push({ r: i, valor: v }); } }
            candidatosColumna.sort((a, b) => b.valor - a.valor);
            log.push(`    Candidatos Theta (Col ${c_max + 1}, excl. fila ${r_max+1}): ${candidatosColumna.map(c => `(${c.r+1})=${c.valor.toFixed(3)}`).join(', ') || 'Ninguno'}`);
            for (const candidato of candidatosColumna) {
                const r_theta_col = candidato.r; const theta = candidato.valor;
                log.push(`    Intentando Theta_col = ${theta.toFixed(3)} desde (${r_theta_col + 1}, ${c_max + 1})`);
                for (let c_ajuste = 0; c_ajuste < columnas; c_ajuste++) {
                    if (c_ajuste === c_max) continue;
                    const v_ajuste_piv = matrizSolucionActual[r_max]?.[c_ajuste] ?? 0;
                    if (v_ajuste_piv >= theta - EPSILON) {
                        log.push(`      Probando c_ajuste = ${c_ajuste + 1} (valor ${v_ajuste_piv.toFixed(3)} >= ${theta.toFixed(3)})`);
                        const nuevaSolucion = deepCopy(matrizSolucionActual);
                        const v1 = (nuevaSolucion[r_max]?.[c_max] ?? 0) + theta;
                        const v2 = (nuevaSolucion[r_theta_col]?.[c_max] ?? 0) - theta;
                        const v3 = (nuevaSolucion[r_max]?.[c_ajuste] ?? 0) - theta;
                        const v4 = (nuevaSolucion[r_theta_col]?.[c_ajuste] ?? 0) + theta;
                        if (v2 >= -EPSILON && v3 >= -EPSILON) {
                            log.push(`        ¡AJUSTE COLUMNA VÁLIDO con c_ajuste = ${c_ajuste + 1}!`);
                            nuevaSolucion[r_max][c_max] = v1; nuevaSolucion[r_theta_col][c_max] = Math.max(0, v2);
                            nuevaSolucion[r_max][c_ajuste] = Math.max(0, v3); nuevaSolucion[r_theta_col][c_ajuste] = v4;
                            log.push(`          (${r_max+1},${c_max+1})=${v1.toFixed(3)}, (${r_theta_col+1},${c_max+1})=${Math.max(0,v2).toFixed(3)}, (${r_max+1},${c_ajuste+1})=${Math.max(0,v3).toFixed(3)}, (${r_theta_col+1},${c_ajuste+1})=${v4.toFixed(3)}`);
                            log.push("--- Fin Ajuste Usuario (Éxito Columna) ---"); return nuevaSolucion;
                        } else { log.push(`        Ajuste con c_ajuste = ${c_ajuste + 1} RECHAZADO (negativo: ${v2.toFixed(3)}, ${v3.toFixed(3)}).`); }
                    }
                }
                log.push(`    No se encontró c_ajuste válido para Theta_col = ${theta.toFixed(3)}.`);
            }
            log.push("  Fase 1 Fallida.");

            log.push("  Fase 2: Buscando Theta y Ajuste en FILA");
            const candidatosFila = [];
            for (let j = 0; j < columnas; j++) { if (j !== c_max) { const v = matrizSolucionActual[r_max]?.[j] ?? 0; if (v > EPSILON) candidatosFila.push({ c: j, valor: v }); } }
            candidatosFila.sort((a, b) => b.valor - a.valor);
            log.push(`    Candidatos Theta (Fila ${r_max + 1}, excl. col ${c_max+1}): ${candidatosFila.map(c => `(${c.c+1})=${c.valor.toFixed(3)}`).join(', ') || 'Ninguno'}`);
            for (const candidato of candidatosFila) {
                const c_theta_fila = candidato.c; const theta = candidato.valor;
                log.push(`    Intentando Theta_fila = ${theta.toFixed(3)} desde (${r_max + 1}, ${c_theta_fila + 1})`);
                for (let r_ajuste = 0; r_ajuste < filas; r_ajuste++) {
                    if (r_ajuste === r_max) continue;
                    const v_ajuste_piv = matrizSolucionActual[r_ajuste]?.[c_max] ?? 0;
                    if (v_ajuste_piv >= theta - EPSILON) {
                        log.push(`      Probando r_ajuste = ${r_ajuste + 1} (valor ${v_ajuste_piv.toFixed(3)} >= ${theta.toFixed(3)})`);
                        const nuevaSolucion = deepCopy(matrizSolucionActual);
                        const v1 = (nuevaSolucion[r_max]?.[c_max] ?? 0) + theta;
                        const v2 = (nuevaSolucion[r_max]?.[c_theta_fila] ?? 0) - theta;
                        const v3 = (nuevaSolucion[r_ajuste]?.[c_max] ?? 0) - theta;
                        const v4 = (nuevaSolucion[r_ajuste]?.[c_theta_fila] ?? 0) + theta;
                        if (v2 >= -EPSILON && v3 >= -EPSILON) {
                            log.push(`        ¡AJUSTE FILA VÁLIDO con r_ajuste = ${r_ajuste + 1}!`);
                            nuevaSolucion[r_max][c_max] = v1; nuevaSolucion[r_max][c_theta_fila] = Math.max(0, v2);
                            nuevaSolucion[r_ajuste][c_max] = Math.max(0, v3); nuevaSolucion[r_ajuste][c_theta_fila] = v4;
                            log.push(`          (${r_max+1},${c_max+1})=${v1.toFixed(3)}, (${r_max+1},${c_theta_fila+1})=${Math.max(0,v2).toFixed(3)}, (${r_ajuste+1},${c_max+1})=${Math.max(0,v3).toFixed(3)}, (${r_ajuste+1},${c_theta_fila+1})=${v4.toFixed(3)}`);
                            log.push("--- Fin Ajuste Usuario (Éxito Fila) ---"); return nuevaSolucion;
                        } else { log.push(`        Ajuste con r_ajuste = ${r_ajuste + 1} RECHAZADO (negativo: ${v2.toFixed(3)}, ${v3.toFixed(3)}).`); }
                    }
                }
                log.push(`    No se encontró r_ajuste válido para Theta_fila = ${theta.toFixed(3)}.`);
            }
            log.push("  Fase 2 Fallida.");

            log.push("--- Fin Ajuste Usuario (FALLO TOTAL) ---");
            return null;
        };

        const ejecutarSiguienteIteracion = useCallback(async () => {
            if (procesoTerminado || calculando || errorProceso || historialIteraciones.length === 0 || !modoOptimizacion) return;
            setCalculando(true);
            setErrorProceso(null);
            const currentIterNum = iteracionNum + 1;
            const currentLog = [`\n=== Iteración #${currentIterNum} (${modoOptimizacion}) ===`];

            try {
                const estadoAnterior = historialIteraciones[historialIteraciones.length - 1];
                const matrizSolucionActual = estadoAnterior.matrizSolucion;
                const matrizResultadoFinalActual = estadoAnterior.matrizResultadoFinal;

                currentLog.push("1. Verificando Optimalidad...");
                let esOptimo = (modoOptimizacion === 'MAX')
                    ? verificarTodosNoPositivos(matrizResultadoFinalActual)
                    : verificarTodosNoNegativos(matrizResultadoFinalActual);
                currentLog.push(`  Condición (${modoOptimizacion}): ${esOptimo ? 'Cumplida' : 'No cumplida'}`);
                if (esOptimo) {
                    currentLog.push("  ¡SOLUCIÓN ÓPTIMA!");
                    setProcesoTerminado(true);
                    setLogPasos(prev => [...prev, ...currentLog]);
                    setCalculando(false);
                    return;
                }

                currentLog.push("2. Encontrando Pivote...");
                const celdaPivote = encontrarCeldaPivote(matrizResultadoFinalActual, matrizSolucionActual, modoOptimizacion, currentLog);
                if (!celdaPivote) {
                    currentLog.push("  ERROR CRÍTICO: No se encontró pivote en solución no óptima.");
                    setErrorProceso("Fallo al encontrar pivote.");
                    setProcesoTerminado(true);
                    setLogPasos(prev => [...prev, ...currentLog]);
                    setCalculando(false);
                    return;
                }

                currentLog.push("3. Intentando Ajuste (Método Usuario)...");
                const nuevaMatrizSolucion = intentarAjusteUsuario(matrizSolucionActual, celdaPivote, filas, columnas, currentLog);
                if (nuevaMatrizSolucion === null) {
                    currentLog.push("  FALLO DEL AJUSTE. Proceso detenido.");
                    setErrorProceso("Fallo en el ajuste de la solución.");
                    setProcesoTerminado(true);
                    setLogPasos(prev => [...prev, ...currentLog]);
                    setCalculando(false);
                    return;
                }

                const nuevaSolString = matrizSolucionToString(nuevaMatrizSolucion);
                if (vistoSoluciones.current.has(nuevaSolString)) {
                    currentLog.push("  ¡CICLO DETECTADO! Evaluando el mejor resultado alcanzado.");
                    finalizarConMejorResultado(currentLog);
                    return;
                }
                vistoSoluciones.current.add(nuevaSolString);

                currentLog.push("4. Recalculando estado...");
                const nuevoCosto = calcularCosto(nuevaMatrizSolucion, matrizCostos);
                currentLog.push(`  Nuevo Costo: ${nuevoCosto.toFixed(3)}`);

                const nuevaMatrizZ = generarMatrizZ(nuevaMatrizSolucion, matrizCostos);
                const nuevosResultadosUV = calcularUV_MetodoDirecto(nuevaMatrizZ, filas, columnas, currentLog);
                const nuevaMatrizZFinal = generarMatrizZFinal(nuevaMatrizZ, nuevosResultadosUV, currentLog);
                const nuevaMatrizResultadoFinal = calcularMatrizResultadoFinal(nuevaMatrizZFinal, matrizCostos);

                const nuevoEstado = {
                    nombre: `Solución ${modoOptimizacion} #${currentIterNum}`,
                    matrizSolucion: nuevaMatrizSolucion,
                    costo: nuevoCosto,
                    matrizZ: nuevaMatrizZ,
                    resultadosUV: nuevosResultadosUV,
                    matrizZFinal: nuevaMatrizZFinal,
                    matrizResultadoFinal: nuevaMatrizResultadoFinal,
                };
                setHistorialIteraciones(prev => [...prev, nuevoEstado]);
                setIteracionNum(currentIterNum);
                currentLog.push("5. Iteración completada.");
            } catch (error) {
                console.error(`Error fatal en iteración ${currentIterNum}:`, error);
                setErrorProceso(`Error inesperado: ${error.message}`);
                currentLog.push(`ERROR FATAL: ${error.message}\n${error.stack || ''}`);
                setProcesoTerminado(true);
            } finally {
                setLogPasos(prev => [...prev, ...currentLog]);
                setCalculando(false);
            }
        }, [
            calculando,
            procesoTerminado,
            errorProceso,
            iteracionNum,
            historialIteraciones,
            modoOptimizacion,
            matrizCostos,
            filas,
            columnas,
            calcularCosto,
            generarMatrizZ,
            generarMatrizZFinal,
            calcularMatrizResultadoFinal,
            encontrarCeldaPivote,
            intentarAjusteUsuario,
            verificarTodosNoPositivos,
            verificarTodosNoNegativos,
            matrizSolucionToString,
            vistoSoluciones,
            setLogPasos,
            setProcesoTerminado,
            setErrorProceso,
            setHistorialIteraciones,
            setIteracionNum,
            setCalculando,
        ]);

        const finalizarConMejorResultado = (currentLog) => {
            currentLog.push("Evaluando el mejor resultado alcanzado...");
            const mejorResultado = historialIteraciones.reduce((mejor, iteracion) => {
                if (modoOptimizacion === 'MIN') {
                    return iteracion.costo < mejor.costo ? iteracion : mejor;
                } else if (modoOptimizacion === 'MAX') {
                    return iteracion.costo > mejor.costo ? iteracion : mejor;
                }
                return mejor;
            }, historialIteraciones[0]);

            currentLog.push(`Mejor resultado encontrado: ${mejorResultado.nombre} con costo ${mejorResultado.costo.toFixed(3)}`);

            // Crear un nuevo estado basado en el mejor resultado
            const nuevoEstado = {
                ...mejorResultado,
                nombre: `Solución Óptima (${modoOptimizacion})`,
            };

            setHistorialIteraciones(prev => [...prev, nuevoEstado]);
            setProcesoTerminado(true);
            setLogPasos(prev => [...prev, ...currentLog]);
            setCalculando(false);
        };

        const iniciarProceso = useCallback(async (modo) => {
            console.log(`Iniciando proceso en modo: ${modo}`);
            resetProceso();
            if (!validarDatos()) { console.error("Validación fallida."); return; }
            await new Promise(resolve => setTimeout(resolve, 0));

            setModoOptimizacion(modo); setCalculando(true);
            const currentLog = [`=== INICIO DEL PROCESO (${modo}) ===`];
            currentLog.push(`Dimensiones: ${filas}x${columnas}. Oferta: [${oferta.join(',')}] (∑=${oferta.reduce((a, b) => a + b, 0)}). Demanda: [${demanda.join(',')}] (∑=${demanda.reduce((a, b) => a + b, 0)})`);

            try {
                currentLog.push("Calculando Solución Inicial (NW)...");
                const nwInicialMatriz = calcularMatrizNWInicial();
                vistoSoluciones.current.add(matrizSolucionToString(nwInicialMatriz));
                const nwInicialCosto = calcularCosto(nwInicialMatriz, matrizCostos);
                currentLog.push(`Costo Inicial (NW): ${nwInicialCosto.toFixed(3)}`);

                currentLog.push("Calculando Z, U/V, Z*, C-Z* Iniciales...");
                const matrizZ_ini = generarMatrizZ(nwInicialMatriz, matrizCostos);
                const resultadosUV_ini = calcularUV_MetodoDirecto(matrizZ_ini, filas, columnas, currentLog);
                currentLog.push(`  U inicial: [${resultadosUV_ini.ofertas.map(u => u === null ? 'N' : u.toFixed(2)).join(', ')}]`);
                currentLog.push(`  V inicial: [${resultadosUV_ini.demandas.map(v => v === null ? 'N' : v.toFixed(2)).join(', ')}]`);

                if (!resultadosUV_ini.consistente) {
                    currentLog.push("  ADVERTENCIA: U/V iniciales podrían ser inconsistentes.");
                } else {
                    currentLog.push("  ¡SOLUCIÓN ÓPTIMA DETECTADA ANTES DE INCONSISTENCIA!");
                    setProcesoTerminado(true);
                }

                const matrizZFinal_ini = generarMatrizZFinal(matrizZ_ini, resultadosUV_ini, currentLog);
                const matrizResultadoFinal_ini = calcularMatrizResultadoFinal(matrizZFinal_ini, matrizCostos);

                const estadoInicial = { nombre: "Solución Inicial (Noroeste)", matrizSolucion: nwInicialMatriz, costo: nwInicialCosto, matrizZ: matrizZ_ini, resultadosUV: resultadosUV_ini, matrizZFinal: matrizZFinal_ini, matrizResultadoFinal: matrizResultadoFinal_ini, };
                setHistorialIteraciones([estadoInicial]); setIteracionNum(0); setProcesoTerminado(false);
                currentLog.push("Proceso inicializado. Use 'Siguiente Iteración'.");

            } catch (error) {
                console.error("Error durante la inicialización:", error); setErrorProceso(`Error inicializando: ${error.message}`);
                currentLog.push(`ERROR FATAL INICIAL: ${error.message}\n${error.stack || ''}`); setModoOptimizacion(null);
            } finally {
                setLogPasos(currentLog); setCalculando(false);
            }
        }, [
            resetProceso, validarDatos, filas, columnas, oferta, demanda, matrizCostos,
            calcularMatrizNWInicial, calcularCosto, generarMatrizZ, generarMatrizZFinal, calcularMatrizResultadoFinal,
            matrizSolucionToString, vistoSoluciones,
            setModoOptimizacion, setCalculando, setHistorialIteraciones, setIteracionNum, setProcesoTerminado, setErrorProceso, setLogPasos
        ]);

        const renderMatrix = (matrix, title, solMatrix = null) => {
            return (
                <div className="matrix-container">
                    
                    {matrix && Array.isArray(matrix) && matrix.length > 0 && Array.isArray(matrix[0]) ? (
                        <table className="matrix-table">
                            <tbody>
                                {matrix.map((row, i) => (
                                    <tr key={`${title}-r-${i}`}>
                                        {(row && Array.isArray(row) ? row : []).map((cell, j) => {
                                            let displayValue = "-";
                                            let cellStyle = {};
                                            const isBasic = solMatrix && (solMatrix[i]?.[j] ?? 0) > EPSILON;
                                            if (cell !== null && cell !== undefined && typeof cell === 'number') {
                                                displayValue = Math.abs(cell) < EPSILON ? "0" : cell.toFixed(2).replace(/\.00$/, '');
                                                if (title.includes("Solución") && isBasic) {
                                                    cellStyle.fontWeight = 'bold';
                                                    cellStyle.backgroundColor = 'rgba(200, 230, 255, 0.5)';
                                                }
                                                if (title.includes("Resultado Final (C-Z*)") && !isBasic) {
                                                    if (modoOptimizacion === 'MAX' && cell > EPSILON) {
                                                        cellStyle.backgroundColor = 'rgba(144, 238, 144, 0.6)';
                                                        cellStyle.fontWeight = 'bold';
                                                    }
                                                    if (modoOptimizacion === 'MIN' && cell < -EPSILON) {
                                                        cellStyle.backgroundColor = 'rgba(240, 128, 128, 0.6)';
                                                        cellStyle.fontWeight = 'bold';
                                                    }
                                                }
                                                if ((title.includes("Matriz Z") || title.includes("Matriz Z*")) && isBasic) {
                                                    cellStyle.backgroundColor = 'rgba(245, 245, 220, 0.7)';
                                                    cellStyle.fontWeight = '500';
                                                }
                                            } else if (cell !== null && cell !== undefined) {
                                                displayValue = String(cell);
                                            }
                                            return <td key={`${title}-c-${i}-${j}`} style={cellStyle}>{displayValue}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p className="placeholder-text">(Datos no disponibles)</p>}
                </div>
            );
        };
        

        const renderUV = (rUV, title) => { /* ... (sin cambios) ... */
            return (
                <div className="uv-container">
                    <strong>{title}</strong>
                    {rUV && rUV.ofertas && rUV.demandas ? (
                        <div className="uv-values">
                            <p><span>U:</span> [{rUV.ofertas.map(u => u === null ? 'N' : u.toFixed(2).replace(/\.00$/, '')).join(', ')}]</p>
                            <p><span>V:</span> [{rUV.demandas.map(v => v === null ? 'N' : v.toFixed(2).replace(/\.00$/, '')).join(', ')}]</p>
                            {!rUV.consistente && <p className="warning-text">Advertencia: U/V podrían ser inconsistentes.</p>
                            }
                        </div>
                    ) : <p className="placeholder-text">(No disponible)</p>}
                </div>
            );
        };
        const BorrarTodo = () => { /* ... (sin cambios) ... */
            Swal.fire({ title: '¿Borrar todo?', text: '¿Está seguro de que desea borrar todos los datos?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, borrar', cancelButtonText: 'Cancelar' })
                .then((result) => {
                    if (result.isConfirmed) {

                        setFilas(0);
                        setColumnas(0);
                        setMatrizCostos([]);
                        setOferta([0,0,0,0]);
                        setDemanda([0,0,0,0]);
                        resetProceso();
                        Swal.fire("Éxito", "Todos los datos han sido borrados.", "success");
                    }
                });
        }

        const handleExport = () => { /* ... (sin cambios) ... */
            Swal.fire({ title: 'Nombre del archivo', input: 'text', inputValue: ``, showCancelButton: true, confirmButtonText: 'Exportar', inputValidator: (v) => !v && 'Ingrese nombre' })
                .then((r) => { if (r.isConfirmed) { const fn = r.value.endsWith('.json') ? r.value : `${r.value}.json`; const data = { matrizCostos, oferta, demanda, filas, columnas }; const blob = new Blob([JSON.stringify(data)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = fn; a.click(); URL.revokeObjectURL(url); a.remove(); } });
        };
        const handleImport = (e) => { /* ... (sin cambios) ... */
            const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader();
            reader.onload = (ev) => { try { const data = JSON.parse(ev.target.result); if (!data.matrizCostos || !data.oferta || !data.demanda) throw new Error("Formato inválido"); const nF = data.filas || data.oferta.length; const nC = data.columnas || data.demanda.length; const normC = Array.from({ length: nF }, (_, i) => Array.from({ length: nC }, (_, j) => Number(data.matrizCostos[i]?.[j] ?? 0))); const normO = Array.from({ length: nF }, (_, i) => Number(data.oferta[i] ?? 0)); const normD = Array.from({ length: nC }, (_, j) => Number(data.demanda[j] ?? 0)); setFilas(nF); setColumnas(nC); setMatrizCostos(normC); setOferta(normO); setDemanda(normD); resetProceso(); Swal.fire("Éxito", "Datos importados!", "success"); } catch (err) { Swal.fire("Error", `No se pudo importar: ${err.message}`, "error"); } finally { if(fileInputRef.current) fileInputRef.current.value = ''; } };
            reader.readAsText(file);
        };
        const generarProblemaAleatorio = () => {
            const numFilas = Math.floor(Math.random() * 4) + 2; // Entre 2 y 5 filas
            const numColumnas = Math.floor(Math.random() * 4) + 2; // Entre 2 y 5 columnas
        
            const oferta = Array(numFilas).fill(0).map(() => Math.floor(Math.random() * 50) + 10); // Ofertas entre 10 y 59
            const demanda = Array(numColumnas).fill(0).map(() => Math.floor(Math.random() * 50) + 10); // Demandas entre 10 y 59
        
            const sumaOferta = oferta.reduce((a, b) => a + b, 0);
            const sumaDemanda = demanda.reduce((a, b) => a + b, 0);
        
            // Ajustar para que las sumas sean iguales
            if (sumaOferta > sumaDemanda) {
                demanda[demanda.length - 1] += sumaOferta - sumaDemanda;
            } else if (sumaDemanda > sumaOferta) {
                oferta[oferta.length - 1] += sumaDemanda - sumaOferta;
            }
        
            const matrizCostos = Array(numFilas)
                .fill(0)
                .map(() =>
                    Array(numColumnas)
                        .fill(0)
                        .map(() => Math.floor(Math.random() * 20) + 1) // Costos entre 1 y 20
                );
        
            // Actualizar el estado con los valores generados
            setFilas(numFilas);
            setColumnas(numColumnas);
            setOferta(oferta);
            setDemanda(demanda);
            setMatrizCostos(matrizCostos);
            resetProceso();
        
            Swal.fire("Éxito", "Problema generado aleatoriamente.", "success");
        };
        const agregarFila = () => { if (!calculando && !modoOptimizacion) { setFilas(f => f + 1); setOferta(o => [...o, 0]); setMatrizCostos(m => [...m, Array(columnas).fill(0)]); } };
        const eliminarFila = () => { if (!calculando && !modoOptimizacion && filas > 1) { setFilas(f => f - 1); setOferta(o => o.slice(0, -1)); setMatrizCostos(m => m.slice(0, -1)); } };
        const agregarColumna = () => { if (!calculando && !modoOptimizacion) { setColumnas(c => c + 1); setDemanda(d => [...d, 0]); setMatrizCostos(m => m.map(f => [...f, 0])); } };
        const eliminarColumna = () => { if (!calculando && !modoOptimizacion && columnas > 1) { setColumnas(c => c - 1); setDemanda(d => d.slice(0, -1)); setMatrizCostos(m => m.map(f => f.slice(0, -1))); } };

        const sumaOferta = oferta.reduce((a, b) => a + (Number(b) || 0), 0);
        const sumaDemanda = demanda.reduce((a, b) => a + (Number(b) || 0), 0);
        const balanceado = Math.abs(sumaOferta - sumaDemanda) < EPSILON && sumaOferta > EPSILON;

        return (
            <div className="contenedor-principal">
                <header className="cabecera">
                    <h1 className="titulo-principal">Algortimo Northwest</h1>
                </header>
            
                <main className="contenido-principal">
                    <section className="seccion-controles">
                    <div className="grupo-controles izquierda">
                        <div className="card">
                        <h3 className="subtitulo">Administrar Datos</h3>
                        <div className="grupo-botones">
                            <button className="btn btn-exportar" onClick={handleExport}>
                            Exportar JSON
                            </button>
                            <button className="btn btn-importar" onClick={() => fileInputRef.current?.click()}>
                            Importar JSON
                            </button>
                            <button className="btn btn-Borrar" onClick={BorrarTodo}>
                            Borrar todo
                            </button>
                            <button className="btn btn-random" onClick={generarProblemaAleatorio}>
                            Generar Aleatorio
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleImport} hidden />
                        </div>
                        </div>
                    </div>
            
                    <div className="grupo-controles derecha">
                        <div className="card">
                        <h3 className="subtitulo">Configuración</h3>
                        <div className="controles-dimensiones">
                            <div className="control-dimension">
                            <label>Filas:</label>
                            <div className="ajustador">
                                <button 
                                className="btn-dimension" 
                                onClick={eliminarFila}
                                disabled={calculando || !!modoOptimizacion || filas <= 1}
                                >
                                -
                                </button>
                                <span className="numero">{filas}</span>
                                <button 
                                className="btn-dimension" 
                                onClick={agregarFila}
                                disabled={calculando || !!modoOptimizacion}
                                >
                                +
                                </button>
                            </div>
                            </div>
                            
                            <div className="control-dimension">
                            <label>Columnas:</label>
                            <div className="ajustador">
                                <button 
                                className="btn-dimension" 
                                onClick={eliminarColumna}
                                disabled={calculando || !!modoOptimizacion || columnas <= 1}
                                >
                                -
                                </button>
                                <span className="numero">{columnas}</span>
                                <button 
                                className="btn-dimension" 
                                onClick={agregarColumna}
                                disabled={calculando || !!modoOptimizacion}
                                >
                                +
                                </button>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    </section>
            
                    <section className="seccion-tabla">
                    <div className="card tabla-container">
                        <h3 className="subtitulo-tabla">Entrada de Datos</h3>
                        
                        <div className="contenedor-tabla">
                        <table className="tabla-transporte">
                            <thead>
                            <tr>
                                <th className="corner-cell">Costo</th>
                                {Array.from({ length: columnas }, (_, j) => 
                                <th key={`dh-${j}`}>D<sub>{j + 1}</sub></th>
                                )}
                                <th className="oferta-header">Oferta</th>
                            </tr>
                            </thead>
                            
                            <tbody>
                            {Array.from({ length: filas }, (_, i) => (
                                <tr key={`dr-${i}`}>
                                <th>O<sub>{i + 1}</sub></th>
                                {Array.from({ length: columnas }, (_, j) => (
                                    <td key={`dcell-${i}-${j}`}>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        step="any"
                                        className="input-cell"
                                        value={matrizCostos[i]?.[j] ?? ''} 
                                        onChange={e => handleInputChange(e, i, j, "matriz")} 
                                        disabled={calculando || !!modoOptimizacion}
                                        placeholder="0"
                                    />
                                    </td>
                                ))}
                                <td>
                                    <input 
                                    type="number" 
                                    min="0" 
                                    step="any"
                                    className="input-cell input-oferta"
                                    value={oferta[i] ?? ''} 
                                    onChange={e => handleInputChange(e, i, null, "oferta")} 
                                    disabled={calculando || !!modoOptimizacion}
                                    placeholder="0"
                                    />
                                </td>
                                </tr>
                            ))}
                            
                            <tr>
                                <th className="demanda-header">Demanda</th>
                                {Array.from({ length: columnas }, (_, j) => (
                                <td key={`dfoot-${j}`}>
                                    <input 
                                    type="number" 
                                    min="0" 
                                    step="any"
                                    className="input-cell input-demanda"
                                    value={demanda[j] ?? ''} 
                                    onChange={e => handleInputChange(e, null, j, "demanda")} 
                                    disabled={calculando || !!modoOptimizacion}
                                    placeholder="0"
                                    />
                                </td>
                                ))}
                                <td className={`summary-cell ${balanceado ? 'balanced' : 'unbalanced'}`}>
                                ∑O={sumaOferta.toFixed(2)}<br />
                                ∑D={sumaDemanda.toFixed(2)}
                                {!balanceado && <span className="icono-alerta">⚠️</span>}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                        </div>
            
                        <div className="controles-optimizacion">
                        <div className="balanceo">
                            {!balanceado && "Sistema no balanceado"}
                        </div>
                        <div className="grupo-botones-acciones">
                            {!modoOptimizacion ? (
                            <>
                                <button 
                                className="btn btn-minimizar" 
                                onClick={() => iniciarProceso('MIN')}
                                disabled={calculando}
                                >
                                Minimizar Costo
                                </button>
                                <button 
                                className="btn btn-maximizar" 
                                onClick={() => iniciarProceso('MAX')}
                                disabled={calculando}
                                >
                                Maximizar Utilidad
                                </button>
                            </>
                            ) : (
                            <>
                                <button 
                                className="btn btn-success" 
                                onClick={ejecutarSiguienteIteracion}
                                disabled={calculando || procesoTerminado || !!errorProceso || historialIteraciones.length === 0}
                                >
                                Siguiente Iteración
                                </button>
                                <button 
                                className="btn btn-limpiar" 
                                onClick={resetProceso}
                                disabled={calculando}
                                >
                                Limpiar Todo
                                </button>
                            </>
                            )}
                        </div>
                        </div>
                    </div>
                    </section>
            
                    <section className="seccion-resultados">
                    <div className="card">
                        <h3 className="subtitulo">Resultados {modoOptimizacion && `(${modoOptimizacion})`}</h3>
                        
                        {historialIteraciones.length === 0 ? (
                        <p className="placeholder-text">
                            {!modoOptimizacion ? "Configure la tabla y presione 'Iniciar'" : "Presione 'Siguiente Iteración'"}
                        </p>
                        ) : (
                        <div className="resultados-carrusel">
                            {historialIteraciones.map((iterData, index) => (
                            <div key={`iter-${index}`} className="iteracion-resultado">
                                <div className="iteration-header">
                                <h2>{iterData.nombre} (Costo: {iterData.costo.toFixed(2)})</h2>
                                <div>
                                    {index === historialIteraciones.length - 1 && procesoTerminado && !errorProceso && 
                                    !iterData.nombre.includes("CICLO") && (
                                    <span className="optimal-badge">ÓPTIMO</span>
                                    )}
                                    {index === historialIteraciones.length - 1 && errorProceso && (
                                    <span className="error-badge">ERROR</span>
                                    )}
                                    {iterData.nombre.includes("CICLO") && (
                                    <span className="cycle-badge">CICLO</span>
                                    )}
                                </div>
                                </div>
                                
                                <div className="iteration-content">
                                <h3 className="matrix-title">Matriz solución</h3>
                                {renderMatrix(iterData.matrizSolucion, "Matriz Solución", iterData.matrizSolucion)}
                                </div>
                            </div>
                            ))}
                        </div>
                        )}
                    </div>
                    </section>
                </main>
                </div>
            );
    };

export default PizarraTransporteCicloFijo4;
