import React, { useEffect, useRef, useState, forwardRef } from "react";
import * as go from "gojs";
import { exportAsPng, exportAsPdf, exportAsJson, saveDiagramAsZip, obtenerValorArista } from "./funcionesxd";
import "../styles/PizarraDijkstra.css";
import { motion } from "framer-motion";
import { Trash2, Upload, Download, XCircle, Edit, PlayCircle, RotateCcw, Shuffle } from 'lucide-react';
import Swal from "sweetalert2";

const PizarraDijkstra = forwardRef(({ onSave }, ref) => {
    const diagramDivRef = useRef(null);
    const diagramInstance = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedLink, setSelectedLink] = useState(null);

    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(250);
    const [rightPanelWidth, setRightPanelWidth] = useState(300);
    const [isResizingRight, setIsResizingRight] = useState(false);

    const [nodeNames, setNodeNames] = useState([]);

    // Estados para Dijkstra
    const [nodoInicio, setNodoInicio] = useState("");
    const [nodoFin, setNodoFin] = useState("");
    const [resultado, setResultado] = useState(null);
    const [procesoDijkstra, setProcesoDijkstra] = useState([]);
    const [caminoEncontrado, setCaminoEncontrado] = useState(false);
    const [caminosAlternativos, setCaminosAlternativos] = useState([]);
    const [pesoTotal, setPesoTotal] = useState(null);

    const [showHelp, setShowHelp] = useState(false); // Nuevo estado para controlar la ayuda

    const helpContent = (
        <div className="help-content">
            <h2>Guia de usuario Algoritmo de Dijkstra</h2>

            <h3>¿Qué es el algoritmo de Dijkstra?</h3>
            <p>Es un algoritmo para encontrar el camino más corto entre nodos en un grafo con pesos no negativos.</p>

            <h3>Funcionalidad de los botones:</h3>
            <ul>
                <li><strong>Limpiar:</strong> Borra toda la pizarra y reinicia todos los estados.</li>
                <li><strong>Importar/Exportar:</strong> Carga o guarda el grafo en diferentes formatos.</li>
                <li><strong>Eliminar Nodo:</strong> Borra el nodo o arista seleccionado.</li>
                <li><strong>Editar:</strong> Modifica propiedades de nodos o aristas.</li>
                <li><strong>Calcular ruta:</strong> Ejecuta el algoritmo para encontrar caminos cortos/largos.</li>
                <li><strong>Generar grafo:</strong> Crea un grafo aleatorio con parámetros configurables.</li>
                <li><strong>Limpiar resultados:</strong> Reinicia los resultados sin modificar el grafo.</li>
            </ul>

            <h3>Instrucciones de uso:</h3>
            <ul>
                <li>Click izquierdo en espacio vacío: Crear nuevo nodo</li>
                <li>Click en nodo + arrastrar a otro nodo: Crear arista</li>
                <li>Doble click en arista: Editar peso</li>
                <li>Click en nodo/arista: Seleccionar elemento</li>
                <li>Tecla Supr: Borrar elemento seleccionado</li>
            </ul>

            <h3>Leyenda de colores:</h3>
            <ul>
                <li><span style={{ color: '#03A9F4' }}>Celeste:</span> Camino más corto</li>
                <li><span style={{ color: 'red' }}>Rojo:</span> Camino más largo</li>
                <li><span style={{ color: '#B0BEC5' }}>Gris:</span> Nodos no visitados</li>
            </ul>
        </div>
    );

    // Lista de colores para nodos
    const colores = [
        "#FFEB3B", "#FFC107", "#FF9800", "#FF5722", "#F44336", "#D32F2F", "#00E5FF", "#00BCD4", "#03A9F4", "#2196F3", "#3F51B5", "#1A237E",
        "#8BC34A", "#4CAF50", "#009688", "#388E3C", "#2C6E3A", "#1B5E20", "#F06292", "#FF4081", "#E91E63", "#9C27B0", "#673AB7", "#7C4DFF",
        "#D7CCC8", "#BCAAA4", "#8D6E63", "#6D4C41", "#4E342E", "#3E2723"
    ];

    const limpiarDiagrama = () => {
        if (diagramInstance.current) {
            diagramInstance.current.model = new go.GraphLinksModel([], []);
            setNodeNames([]);
            setCaminoEncontrado(false);
            setResultado(null);
            setProcesoDijkstra([]);
            setCaminosAlternativos([]);
            setNodoInicio("");
            setNodoFin("");
        }
    };

    const eliminarNodoSeleccionado = () => {
        if (selectedNode && diagramInstance.current) {
            diagramInstance.current.startTransaction("eliminar");
            diagramInstance.current.remove(selectedNode);
            diagramInstance.current.commitTransaction("eliminar");
            setSelectedNode(null);

            // Actualizar los nombres de nodos después de eliminar
            const updatedNodeNames = diagramInstance.current.model.nodeDataArray.map(
                node => node.text || `Nodo ${node.key}`
            );
            setNodeNames(updatedNodeNames);

            // Reiniciar el algoritmo si se elimina algún nodo involucrado
            if (nodoInicio === selectedNode.data.text || nodoFin === selectedNode.data.text) {
                setCaminoEncontrado(false);
                setResultado(null);
                setProcesoDijkstra([]);
                setCaminosAlternativos([]);
                if (nodoInicio === selectedNode.data.text) setNodoInicio("");
                if (nodoFin === selectedNode.data.text) setNodoFin("");
            }
        } else if (selectedLink && diagramInstance.current) {
            diagramInstance.current.startTransaction("eliminar");
            diagramInstance.current.remove(selectedLink);
            diagramInstance.current.commitTransaction("eliminar");
            setSelectedLink(null);

            // Reiniciar el algoritmo si se modifica el grafo
            setCaminoEncontrado(false);
            setResultado(null);
            setProcesoDijkstra([]);
            setCaminosAlternativos([]);
        }
    };

    const cambiarColorNodo = (color) => {
        if (selectedNode && diagramInstance.current) {
            diagramInstance.current.model.setDataProperty(selectedNode.data, "color", color);
        }
    };

    const saveDiagram = async (format) => {
        if (!diagramInstance.current) return;

        const modelJson = diagramInstance.current.model.toJson();

        try {
            switch (format) {
                case "png":
                    await exportAsPng(diagramDivRef);
                    Swal.fire({
                        icon: "success",
                        title: "Exportado como PNG",
                        text: "El diagrama se ha exportado correctamente en formato PNG.",
                    });
                    break;

                case "pdf":
                    await exportAsPdf(diagramDivRef);
                    Swal.fire({
                        icon: "success",
                        title: "Exportado como PDF",
                        text: "El diagrama se ha exportado correctamente en formato PDF.",
                    });
                    break;

                case "json":
                    await exportAsJson(modelJson);
                    Swal.fire({
                        icon: "success",
                        title: "Guardado como JSON",
                        text: "El diagrama se ha guardado correctamente en formato JSON.",
                    });
                    break;

                case "zip":
                    await saveDiagramAsZip(diagramDivRef, modelJson);
                    Swal.fire({
                        icon: "success",
                        title: "Guardado como ZIP",
                        text: "El diagrama se ha guardado correctamente en formato ZIP.",
                    });
                    break;

                default:
                    Swal.fire({
                        icon: "error",
                        title: "Formato no válido",
                        text: "Por favor, seleccione un formato válido.",
                    });
                    console.error("Formato no válido");
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: `Ocurrió un error al guardar el diagrama: ${error.message}`,
            });
            console.error("Error al guardar el diagrama:", error);
        }
    };

    const importarF = (jsonData) => {
        if (diagramInstance.current) {
            diagramInstance.current.model = new go.GraphLinksModel([], []);

            if (jsonData && jsonData.nodeDataArray && jsonData.linkDataArray) {
                diagramInstance.current.model = new go.GraphLinksModel(jsonData.nodeDataArray, jsonData.linkDataArray);
                const updatedNodeNames = jsonData.nodeDataArray.map(
                    node => node.text || `Nodo ${node.key}`
                );
                setNodeNames(updatedNodeNames);

                // Reiniciar el algoritmo al importar un nuevo grafo
                setCaminoEncontrado(false);
                setResultado(null);
                setProcesoDijkstra([]);
                setCaminosAlternativos([]);
                setNodoInicio("");
                setNodoFin("");
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "El formato del JSON es incorrecto. Asegúrese de que contenga nodos y enlaces.",
                });
            }
        } else {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "El diagrama no está disponible para cargar datos.",
            });
        }
    };

    // Función para calcular matriz de adyacencia no dirigida para Dijkstra
    const calculateNonDirectedAdjacencyMatrix = (nodes, links) => {
        const n = nodes.length;
        const adjacencyMatrix = Array(n).fill().map(() => Array(n).fill(0));
        const nodeNames = nodes.map((node) => node.text || `Nodo ${node.key}`);

        // Mapa para indexar rápidamente los nodos por su key
        const nodeKeyToIndex = {};
        nodes.forEach((node, index) => {
            nodeKeyToIndex[node.key] = index;
        });

        links.forEach((link) => {
            const fromIndex = nodeKeyToIndex[link.from];
            const toIndex = nodeKeyToIndex[link.to];

            if (fromIndex !== undefined && toIndex !== undefined) {
                // Para grafos no dirigidos, la matriz debe ser simétrica
                const weight = parseFloat(link.label) || 0;
                adjacencyMatrix[fromIndex][toIndex] = weight;
                adjacencyMatrix[toIndex][fromIndex] = weight; // Simetría
            }
        });

        return { adjacencyMatrix, nodeNames };
    };

    // Función para calcular matriz de adyacencia dirigida
    const calculateDirectedAdjacencyMatrix = (nodes, links) => {
        const n = nodes.length;
        const adjacencyMatrix = Array(n).fill().map(() => Array(n).fill(0));
        const nodeNames = nodes.map((node) => node.text || `Nodo ${node.key}`);

        // Mapa para indexar rápidamente los nodos por su key
        const nodeKeyToIndex = {};
        nodes.forEach((node, index) => {
            nodeKeyToIndex[node.key] = index;
        });

        links.forEach((link) => {
            const fromIndex = nodeKeyToIndex[link.from];
            const toIndex = nodeKeyToIndex[link.to];

            if (fromIndex !== undefined && toIndex !== undefined) {
                const weight = parseFloat(link.label) || 0;
                adjacencyMatrix[fromIndex][toIndex] = weight; // Solo dirección de `from` a `to`
            }
        });

        return { adjacencyMatrix, nodeNames };
    };

    // Ejecutar algoritmo de Dijkstra
    const ejecutarDijkstra = () => {
        if (!nodoInicio || !nodoFin) {
            Swal.fire({
                icon: "warning",
                title: "Faltan datos",
                text: "Seleccione un nodo de inicio y un nodo de fin para ejecutar el algoritmo de Dijkstra.",
            });
            return;
        }

        if (nodoInicio === nodoFin) {
            Swal.fire({
                icon: "error",
                title: "Nodos inválidos",
                text: "El nodo de inicio no puede ser el mismo que el nodo final.",
            });
            return;
        }

        const { adjacencyMatrix, nodeNames } = calculateDirectedAdjacencyMatrix(
            diagramInstance.current.model.nodeDataArray,
            diagramInstance.current.model.linkDataArray
        );

        if (nodeNames.indexOf(nodoInicio) === -1 || nodeNames.indexOf(nodoFin) === -1) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Los nodos seleccionados no existen en el grafo actual.",
            });
            return;
        }

        const resultado = dijkstra(adjacencyMatrix, nodeNames, nodoInicio, nodoFin);

        setResultado(resultado);
        setProcesoDijkstra(resultado.proceso);
        setCaminoEncontrado(resultado.camino.length > 0);

        if (resultado.camino.length > 0) {
            setPesoTotal(resultado.distancia); // Actualizar el peso total
            resaltarCaminoEnDiagrama(resultado.camino);
            Swal.fire({
                icon: "success",
                title: "Camino más corto encontrado",
                text: `Costo total: ${resultado.distancia}\nCamino: ${resultado.camino.join(" → ")}`,
            });
        } else {
            setPesoTotal(null); // Reiniciar el peso total si no hay camino
            Swal.fire({
                icon: "error",
                title: "No se encontró un camino",
                text: "No existe un camino entre los nodos seleccionados.",
            });
        }
    };

    // Función para encontrar caminos alternativos óptimos
    const encontrarCaminosAlternativos = (adjacencyMatrix, nodeNames, inicio, fin, distanciaOptima) => {
        const caminosAlternativos = [];

        if (distanciaOptima === Infinity) {
            return [];
        }

        const inicioIndex = nodeNames.indexOf(inicio);
        const finIndex = nodeNames.indexOf(fin);

        const buscarCaminosRecursivo = (nodoActual, caminoActual, distanciaActual, visitados) => {
            if (distanciaActual > distanciaOptima) {
                return;
            }

            if (nodoActual === finIndex && distanciaActual === distanciaOptima) {
                const caminoCompleto = [...caminoActual, nodeNames[nodoActual]];

                if (JSON.stringify(caminoCompleto) !== JSON.stringify(resultado.camino)) {
                    caminosAlternativos.push(caminoCompleto);
                }
                return;
            }

            visitados[nodoActual] = true;

            for (let i = 0; i < adjacencyMatrix.length; i++) {
                if (!visitados[i] && adjacencyMatrix[nodoActual][i] > 0) {
                    const nuevaDistancia = distanciaActual + adjacencyMatrix[nodoActual][i];

                    if (nuevaDistancia <= distanciaOptima) {
                        buscarCaminosRecursivo(
                            i,
                            [...caminoActual, nodeNames[nodoActual]],
                            nuevaDistancia,
                            [...visitados]
                        );
                    }
                }
            }
        };

        buscarCaminosRecursivo(inicioIndex, [], 0, Array(adjacencyMatrix.length).fill(false));

        return Array.from(new Set(caminosAlternativos.map(JSON.stringify)))
            .map(JSON.parse)
            .filter(camino => JSON.stringify(camino) !== JSON.stringify(resultado.camino));
    };

    // Función para resaltar visualmente el camino encontrado en el diagrama
    const resaltarCaminoEnDiagrama = (camino, caminosAlternativos = []) => {
        if (!diagramInstance.current || !camino || camino.length <= 1) return;

        const modelo = diagramInstance.current.model;
        modelo.startTransaction("resetear estilos");

        // Colorear todos los nodos y enlaces como plomo por defecto
        modelo.nodeDataArray.forEach(node => {
            modelo.setDataProperty(node, "color", "#B0BEC5"); // Color plomo
            modelo.setDataProperty(node, "isHighlighted", false);
        });

        modelo.linkDataArray.forEach(link => {
            modelo.setDataProperty(link, "color", "#B0BEC5"); // Color plomo
            modelo.setDataProperty(link, "isHighlighted", false);
        });

        modelo.commitTransaction("resetear estilos");

        modelo.startTransaction("resaltar camino");

        // Resaltar los nodos del camino con color celeste
        for (let i = 0; i < camino.length; i++) {
            const nodoKey = obtenerKeyPorTexto(camino[i]);
            if (nodoKey) {
                const nodo = modelo.findNodeDataForKey(nodoKey);
                if (nodo) {
                    modelo.setDataProperty(nodo, "color", "#03A9F4"); // Color celeste
                    modelo.setDataProperty(nodo, "isHighlighted", true);
                }
            }
        }

        // Resaltar los enlaces del camino con color celeste
        for (let i = 0; i < camino.length - 1; i++) {
            const fromKey = obtenerKeyPorTexto(camino[i]);
            const toKey = obtenerKeyPorTexto(camino[i + 1]);

            if (fromKey && toKey) {
                const link = modelo.linkDataArray.find(
                    link => (link.from === fromKey && link.to === toKey) ||
                        (link.from === toKey && link.to === fromKey)
                );

                if (link) {
                    modelo.setDataProperty(link, "color", "#03A9F4"); // Color celeste
                    modelo.setDataProperty(link, "isHighlighted", true);
                }
            }
        }

        modelo.commitTransaction("resaltar camino");

        // Opcional: Resaltar caminos alternativos si existen
        if (caminosAlternativos && caminosAlternativos.length > 0) {
            modelo.startTransaction("resaltar caminos alternativos");

            caminosAlternativos.forEach((camino) => {
                for (let i = 1; i < camino.length - 1; i++) {
                    const nodoKey = obtenerKeyPorTexto(camino[i]);
                    if (nodoKey) {
                        const nodo = modelo.findNodeDataForKey(nodoKey);
                        if (nodo) {
                            modelo.setDataProperty(nodo, "color", "#03A9F4"); // Color celeste
                        }
                    }
                }

                for (let i = 0; i < camino.length - 1; i++) {
                    const fromKey = obtenerKeyPorTexto(camino[i]);
                    const toKey = obtenerKeyPorTexto(camino[i + 1]);

                    if (fromKey && toKey) {
                        const link = modelo.linkDataArray.find(
                            link => (link.from === fromKey && link.to === toKey) ||
                                (link.from === toKey && link.to === fromKey)
                        );

                        if (link && !link.isHighlighted) {
                            modelo.setDataProperty(link, "color", "#03A9F4"); // Color celeste
                        }
                    }
                }
            });

            modelo.commitTransaction("resaltar caminos alternativos");
        }
    };

    const obtenerKeyPorTexto = (texto) => {
        const nodo = diagramInstance.current.model.nodeDataArray.find(n => n.text === texto);
        return nodo ? nodo.key : null;
    };

    const dijkstra = (adjacencyMatrix, nodeNames, inicio, fin) => {
        const n = nodeNames.length;
        const inicioIndex = nodeNames.indexOf(inicio);
        const finIndex = nodeNames.indexOf(fin);

        if (inicioIndex === -1 || finIndex === -1) {
            return {
                distancia: Number.POSITIVE_INFINITY,
                camino: [],
                proceso: []
            };
        }

        const distancia = Array(n).fill(Number.POSITIVE_INFINITY);
        const visitado = Array(n).fill(false);
        const anterior = Array(n).fill(null);
        const proceso = [];

        distancia[inicioIndex] = 0;

        proceso.push({
            iteracion: 0,
            nodoActual: inicio,
            distancias: [...distancia],
            visitados: [...visitado],
            tabla: nodeNames.map((nombre, i) => ({
                nodo: nombre,
                distancia: i === inicioIndex ? 0 : "∞",
                visitado: false,
                actual: i === inicioIndex
            }))
        });

        for (let count = 0; count < n; count++) {
            let min = Number.POSITIVE_INFINITY;
            let minIndex = -1;

            for (let v = 0; v < n; v++) {
                if (!visitado[v] && distancia[v] < min) {
                    min = distancia[v];
                    minIndex = v;
                }
            }

            if (minIndex === -1 || min === Number.POSITIVE_INFINITY) {
                break;
            }

            visitado[minIndex] = true;
            const nodoActualNombre = nodeNames[minIndex];

            const actualizaciones = [];

            for (let v = 0; v < n; v++) {
                if (adjacencyMatrix[minIndex][v] > 0) { // Respetar dirección
                    const nuevaDistancia = distancia[minIndex] + adjacencyMatrix[minIndex][v];

                    if (nuevaDistancia < distancia[v]) {
                        const distanciaAnterior = distancia[v];
                        distancia[v] = nuevaDistancia;
                        anterior[v] = minIndex;

                        actualizaciones.push({
                            nodo: nodeNames[v],
                            distanciaAnterior: distanciaAnterior === Number.POSITIVE_INFINITY ? "∞" : distanciaAnterior,
                            nuevaDistancia: nuevaDistancia
                        });
                    }
                }
            }

            proceso.push({
                iteracion: count + 1,
                nodoActual: nodoActualNombre,
                actualizaciones,
                distancias: [...distancia],
                visitados: [...visitado],
                tabla: nodeNames.map((nombre, i) => ({
                    nodo: nombre,
                    distancia: distancia[i] === Number.POSITIVE_INFINITY ? "∞" : distancia[i],
                    visitado: visitado[i],
                    actual: i === minIndex
                }))
            });
        }

        const camino = [];
        let actual = finIndex;

        if (distancia[finIndex] !== Number.POSITIVE_INFINITY) {
            while (actual !== null) {
                camino.unshift(nodeNames[actual]);
                actual = anterior[actual];
            }
        }

        return {
            distancia: distancia[finIndex] === Number.POSITIVE_INFINITY ? Infinity : distancia[finIndex],
            camino,
            proceso
        };
    };

    const limpiarResultados = () => {
        setCaminoEncontrado(false);
        setResultado(null);
        setProcesoDijkstra([]);
        setCaminosAlternativos([]);

        if (diagramInstance.current) {
            const modelo = diagramInstance.current.model;
            modelo.startTransaction("limpiar resultados");

            modelo.nodeDataArray.forEach(node => {
                modelo.setDataProperty(node, "category", "");
                modelo.setDataProperty(node, "isHighlighted", false);
            });

            modelo.linkDataArray.forEach(link => {
                modelo.setDataProperty(link, "color", "black");
                modelo.setDataProperty(link, "isHighlighted", false);
            });

            modelo.commitTransaction("limpiar resultados");
        }
    };

    const generarGrafoAleatorio = async () => {
        // Preguntar al usuario cuántos nodos desea
        const { value: numNodos } = await Swal.fire({
            title: 'Generar grafo aleatorio',
            input: 'number',
            inputLabel: 'Número de nodos (máximo 26)',
            inputValue: 5,
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) return 'Debes ingresar un número';
                if (parseInt(value) < 2) return 'Debe haber al menos 2 nodos';
                if (parseInt(value) > 26) return 'No puedes crear más de 26 nodos (A-Z)';
            }
        });

        if (numNodos) {
            // Limpiar el diagrama actual
            limpiarDiagrama();

            const n = parseInt(numNodos);
            const $ = go.GraphObject.make;

            // Crear un nuevo modelo vacío
            const nodeDataArray = [];
            const linkDataArray = [];

            // Generar los nodos (A-Z)
            const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

            for (let i = 0; i < n; i++) {
                const nombreNodo = letras.charAt(i);
                // Generar posiciones aleatorias dentro del área visible
                const x = 100 + Math.random() * 400; // entre 100 y 500
                const y = 100 + Math.random() * 400; // entre 100 y 500

                // Elegir un color aleatorio de la lista de colores
                const colorIndex = Math.floor(Math.random() * colores.length);

                nodeDataArray.push({
                    key: i + 1,
                    text: nombreNodo,
                    color: colores[colorIndex],
                    loc: `${x} ${y}`  // Posición aleatoria
                });
            }

            // Generar aristas aleatorias (densidad ~50%)
            // Para cada par de nodos, hay aproximadamente 50% de probabilidad de crear una arista
            const maxAristas = n * (n - 1) / 2; // Máximo número de aristas posibles
            const numAristas = Math.floor(maxAristas * 0.5); // ~50% de densidad

            // Conjunto para evitar aristas duplicadas
            const aristasCreadas = new Set();

            let aristaIndex = 1;
            while (linkDataArray.length < numAristas) {
                // Seleccionar dos nodos aleatorios
                const from = Math.floor(Math.random() * n) + 1;
                const to = Math.floor(Math.random() * n) + 1;

                // Evitar lazos y aristas duplicadas
                if (from !== to) {
                    const aristaKey = from < to ? `${from}-${to}` : `${to}-${from}`;

                    if (!aristasCreadas.has(aristaKey)) {
                        aristasCreadas.add(aristaKey);

                        // Generar peso aleatorio (1-20)
                        const peso = Math.floor(Math.random() * 20) + 1;

                        linkDataArray.push({
                            key: aristaIndex++,
                            from: from,
                            to: to,
                            label: peso.toString(),
                            color: "black"
                        });
                    }
                }
            }

            // Crear el nuevo modelo con los datos generados
            diagramInstance.current.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
            diagramInstance.current.model.linkFromPortIdProperty = "fromPort";
            diagramInstance.current.model.linkToPortIdProperty = "toPort";

            // Actualizar los nombres de nodos
            const updatedNodeNames = diagramInstance.current.model.nodeDataArray.map(
                node => node.text || `Nodo ${node.key}`
            );
            setNodeNames(updatedNodeNames);

            // Sugerir nodos de inicio y fin
            if (n >= 2) {
                setNodoInicio(nodeDataArray[0].text);
                setNodoFin(nodeDataArray[n - 1].text);
            }

            // Limpiar resultados anteriores
            limpiarResultados();

            Swal.fire({
                title: 'Grafo aleatorio generado',
                text: `Se han creado ${n} nodos y ${linkDataArray.length} aristas`,
                icon: 'success',
                confirmButtonText: 'OK'
            });
        }
    };

    const calcularCaminoMasLargo = () => {
        if (!nodoInicio || !nodoFin) {
            Swal.fire({
                icon: "warning",
                title: "Faltan datos",
                text: "Seleccione un nodo de inicio y un nodo de fin para calcular el camino más largo.",
            });
            return;
        }

        if (nodoInicio === nodoFin) {
            Swal.fire({
                icon: "error",
                title: "Nodos inválidos",
                text: "El nodo de inicio no puede ser el mismo que el nodo final.",
            });
            return;
        }

        const { adjacencyMatrix, nodeNames } = calculateDirectedAdjacencyMatrix(
            diagramInstance.current.model.nodeDataArray,
            diagramInstance.current.model.linkDataArray
        );

        if (nodeNames.indexOf(nodoInicio) === -1 || nodeNames.indexOf(nodoFin) === -1) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Los nodos seleccionados no existen en el grafo actual.",
            });
            return;
        }

        const inicioIndex = nodeNames.indexOf(nodoInicio);
        const finIndex = nodeNames.indexOf(nodoFin);

        const visitados = Array(nodeNames.length).fill(false);
        let caminoMasLargo = [];
        let distanciaMasLarga = -Infinity;

        const dfs = (nodoActual, caminoActual, distanciaActual) => {
            visitados[nodoActual] = true;
            caminoActual.push(nodeNames[nodoActual]);

            if (nodoActual === finIndex) {
                if (distanciaActual > distanciaMasLarga) {
                    distanciaMasLarga = distanciaActual;
                    caminoMasLargo = [...caminoActual];
                }
            } else {
                for (let i = 0; i < adjacencyMatrix.length; i++) {
                    if (!visitados[i] && adjacencyMatrix[nodoActual][i] > 0) { // Respetar dirección
                        dfs(i, caminoActual, distanciaActual + adjacencyMatrix[nodoActual][i]);
                    }
                }
            }

            caminoActual.pop();
            visitados[nodoActual] = false;
        };

        dfs(inicioIndex, [], 0);

        if (caminoMasLargo.length > 0) {
            setPesoTotal(distanciaMasLarga); // Actualizar el peso total

            // Resaltar el camino más largo en rojo
            const modelo = diagramInstance.current.model;
            modelo.startTransaction("resaltar camino más largo");

            // Colorear todos los nodos y enlaces como plomo por defecto
            modelo.nodeDataArray.forEach(node => {
                modelo.setDataProperty(node, "color", "#B0BEC5"); // Color plomo
                modelo.setDataProperty(node, "isHighlighted", false);
            });

            modelo.linkDataArray.forEach(link => {
                modelo.setDataProperty(link, "color", "#B0BEC5"); // Color plomo
                modelo.setDataProperty(link, "isHighlighted", false);
            });

            // Resaltar nodos del camino más largo en rojo
            caminoMasLargo.forEach((nodo) => {
                const nodoKey = obtenerKeyPorTexto(nodo);
                if (nodoKey) {
                    const nodoData = modelo.findNodeDataForKey(nodoKey);
                    if (nodoData) {
                        modelo.setDataProperty(nodoData, "color", "red"); // Color rojo
                        modelo.setDataProperty(nodoData, "isHighlighted", true);
                    }
                }
            });

            // Resaltar enlaces del camino más largo en rojo
            for (let i = 0; i < caminoMasLargo.length - 1; i++) {
                const fromKey = obtenerKeyPorTexto(caminoMasLargo[i]);
                const toKey = obtenerKeyPorTexto(caminoMasLargo[i + 1]);

                if (fromKey && toKey) {
                    const link = modelo.linkDataArray.find(
                        link => link.from === fromKey && link.to === toKey
                    );

                    if (link) {
                        modelo.setDataProperty(link, "color", "red"); // Color rojo
                        modelo.setDataProperty(link, "isHighlighted", true);
                    }
                }
            }

            modelo.commitTransaction("resaltar camino más largo");

            Swal.fire({
                icon: "success",
                title: "Camino más largo encontrado",
                text: `Distancia: ${distanciaMasLarga}`,
            });
        } else {
            setPesoTotal(null); // Reiniciar el peso total si no hay camino
            Swal.fire({
                icon: "error",
                title: "No se encontró un camino",
                text: "No existe un camino entre los nodos seleccionados.",
            });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizingRight) {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth > 100 && newWidth < 500) {
                    setRightPanelWidth(newWidth);
                }
            }
        };

        const handleMouseUp = () => {
            setIsResizingRight(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizingRight]);

    useEffect(() => {
        if (!diagramInstance.current) {
            const $ = go.GraphObject.make;
            const myDiagram = $(go.Diagram, diagramDivRef.current, {
                "animationManager.initialAnimationStyle": go.AnimationManager.None,
                "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
                "undoManager.isEnabled": true,
                "clickCreatingTool.archetypeNodeData": { text: "Nuevo Nodo", color: "#4CAF50" },
            });

            const nodeTemplateMap = new go.Map();

            nodeTemplateMap.add("", $(
                go.Node,
                "Auto",
                {
                    selectable: true,
                    locationSpot: go.Spot.Center
                },
                $(go.Shape, "Ellipse", {
                    width: 50,
                    height: 50,
                    strokeWidth: 1.5,
                    fill: "#4CAF50",
                    portId: "",
                    fromLinkable: true,
                    toLinkable: true,
                    fromLinkableSelfNode: false, // Deshabilitar enlaces hacia sí mismo
                    toLinkableSelfNode: false,   // Deshabilitar enlaces hacia sí mismo
                    cursor: "pointer",
                }, new go.Binding("fill", "color")),
                $(go.TextBlock, {
                    font: "bold 12px sans-serif",
                    stroke: "#fff",//XDDDDDD
                    editable: true,
                }, new go.Binding("text").makeTwoWay())
            ));

            myDiagram.nodeTemplateMap = nodeTemplateMap;

            myDiagram.linkTemplate = $(
                go.Link,
                {
                    curve: go.Link.Bezier, // Cambiar a líneas curveadas
                    curviness: 60,
                    relinkableFrom: true,
                    relinkableTo: true,
                    corner: 5, // Bordes redondeados (opcional, no afecta a Bezier)
                },
                $(go.Shape, {
                    strokeWidth: 2,
                    stroke: "black" // Color de la línea
                }, new go.Binding("stroke", "color")),
                $(go.Shape, {
                    toArrow: "Standard", // Flecha en el extremo
                    stroke: "black", // Color del borde de la flecha
                    fill: "black", // Color de relleno de la flecha
                }),
                $(go.TextBlock, {
                    segmentOffset: new go.Point(0, -10),
                    editable: false,
                    font: "bold 12px sans-serif",
                    stroke: "black",
                    background: "white",
                    cursor: "pointer",
                    click: async (e, obj) => {
                        const link = obj.part;
                        const result = await Swal.fire({
                            title: 'Editar valor de la arista',
                            input: 'number',
                            inputLabel: 'Nuevo valor',
                            inputValue: link.data.label || '',
                            showCancelButton: true,
                            inputValidator: (value) => {
                                if (value === "") return "El valor no puede estar vacío!";
                                if (isNaN(value)) return "Debe ingresar un número válido!";
                                if (parseFloat(value) <= 0) return "El valor debe ser positivo!";
                            }
                        });
                        if (result.isConfirmed) {
                            diagramInstance.current.model.setDataProperty(link.data, "label", result.value);
                            limpiarResultados();
                        }
                    }
                }, new go.Binding("text", "label").makeTwoWay())
            );

            myDiagram.addDiagramListener("LinkDrawn", async (e) => {
                const link = e.subject;

                // Validar que no sea un enlace hacia sí mismo (ciclo)
                if (link.fromNode === link.toNode) {
                    diagramInstance.current.remove(link); // Eliminar el enlace
                    Swal.fire({
                        icon: "error",
                        title: "Enlace inválido",
                        text: "No se permiten enlaces hacia el mismo nodo.",
                    });
                    return;
                }

                const valorArista = await obtenerValorArista();
                if (valorArista !== null) {
                    diagramInstance.current.model.setDataProperty(link.data, "label", valorArista.toString());
                    diagramInstance.current.model.commitTransaction("Arista actualizada");

                    const updatedNodeNames = diagramInstance.current.model.nodeDataArray.map(
                        node => node.text || `Nodo ${node.key}`
                    );
                    setNodeNames(updatedNodeNames);

                    limpiarResultados();
                } else {
                    diagramInstance.current.remove(link);
                }
            });

            myDiagram.addModelChangedListener((e) => {
                if (e.isTransactionFinished) {
                    const updatedNodeNames = myDiagram.model.nodeDataArray.map(
                        node => node.text || `Nodo ${node.key}`
                    );
                    setNodeNames(updatedNodeNames);
                }
            });

            myDiagram.model = new go.GraphLinksModel(
                [],
                [],
                {
                    nodeKeyProperty: "key",
                    linkKeyProperty: "key",
                    linkFromPortIdProperty: "fromPort",
                    linkToPortIdProperty: "toPort",
                    linkLabelProperty: "label",
                    nodeCategoryProperty: "category",
                }
            );

            diagramInstance.current = myDiagram;
        }

        return () => {
            if (diagramInstance.current) {
                diagramInstance.current.div = null;
                diagramInstance.current = null;
            }
        };
    }, []);

    React.useImperativeHandle(ref, () => ({
        eliminarNodoSeleccionado,
        limpiarDiagrama,
        saveDiagram,
        importarF,
        ejecutarDijkstra,
    }));

    const editarElementoSeleccionado = () => {
        if (selectedNode) {
            Swal.fire({
                title: 'Editar Nodo',
                html: `
          <div style="margin: 20px 0;">
        <label for="swal-input1" style="display: block; margin-bottom: 8px; font-weight: 500; text-align: left;">Nombre del Nodo</label>
        <input id="swal-input1" class="swal2-input" placeholder="Nombre" value="${selectedNode.data.text}" 
           style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc;">
        
        <label for="swal-input2" style="display: block; margin: 15px 0 8px; font-weight: 500; text-align: left;">Color</label>
        <div style="display: flex; align-items: center;">
          <input id="swal-input2" type="color" class="swal2-input" value="${selectedNode.data.color}" 
             style="width: 60px; height: 40px; padding: 5px; border: none; cursor: pointer;">
          <span id="color-preview" style="display: inline-block; margin-left: 10px; width: 30px; height: 30px; border-radius: 50%; background-color: ${selectedNode.data.color}; border: 1px solid #ddd;"></span>
          <span id="color-value" style="margin-left: 10px; font-family: monospace;">${selectedNode.data.color}</span>
        </div>
          </div>
        `,
                focusConfirm: false,
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar',
                showCancelButton: true,
                didOpen: () => {
                    const colorInput = document.getElementById('swal-input2');
                    const colorPreview = document.getElementById('color-preview');
                    const colorValue = document.getElementById('color-value');

                    colorInput.addEventListener('input', () => {
                        colorPreview.style.backgroundColor = colorInput.value;
                        colorValue.textContent = colorInput.value;
                    });
                },
                preConfirm: () => {
                    const nombre = document.getElementById('swal-input1').value;
                    const color = document.getElementById('swal-input2').value;
                    if (!nombre) {
                        Swal.showValidationMessage('El nombre no puede estar vacío');
                        return false;
                    }
                    return { nombre, color };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const nombreAnterior = selectedNode.data.text;
                    diagramInstance.current.model.setDataProperty(selectedNode.data, "text", result.value.nombre);
                    diagramInstance.current.model.setDataProperty(selectedNode.data, "color", result.value.color);

                    const updatedNodeNames = diagramInstance.current.model.nodeDataArray.map(
                        node => node.text || `Nodo ${node.key}`
                    );
                    setNodeNames(updatedNodeNames);

                    if (nodoInicio === nombreAnterior) {
                        setNodoInicio(result.value.nombre);
                    }
                    if (nodoFin === nombreAnterior) {
                        setNodoFin(result.value.nombre);
                    }

                    limpiarResultados();
                }
            });
        } else if (selectedLink) {
            Swal.fire({
                title: 'Editar Arista',
                input: 'number',
                inputLabel: 'Valor',
                inputValue: selectedLink.data.label,
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value) {
                        return 'El valor no puede estar vacío';
                    }
                    if (isNaN(value)) {
                        return 'El valor debe ser un número';
                    }
                    if (parseFloat(value) <= 0) {
                        return 'El valor debe ser positivo';
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    diagramInstance.current.model.setDataProperty(selectedLink.data, "label", result.value);

                    limpiarResultados();
                }
            });
        } else {
            Swal.fire({
                icon: 'info',
                title: 'Editar',
                text: 'Seleccione un nodo o una arista para editar.',
            });
        }
    };

    return (
        <div className="contenedor">
            <button
                className="help-button"
                onClick={() => setShowHelp(!showHelp)}
                title="Mostrar ayuda"
            >
                ?
            </button>

            {showHelp && (
                <div className="help-popup">
                    <button
                        className="close-help"
                        onClick={() => setShowHelp(false)}
                        title="Cerrar ayuda"
                    >
                        ×
                    </button>
                    {helpContent}
                </div>
            )}
            <motion.div
                className="panel-izquierdo"
                style={{ width: leftPanelWidth }}
                initial="open"
                animate="open"
                transition={{ type: "spring", stiffness: 300 }}
            >
                <div className="contenido-panel">
                    <h3>Cambiar Color del Nodo</h3>
                    <p>Personalizar color: </p>
                    <div className="custom-color-container">
                        <input
                            type="color"
                            value={selectedNode?.data?.color || "#795548"}
                            onChange={(event) => {
                                const nuevoColor = event.target.value;
                                cambiarColorNodo(nuevoColor);
                            }}
                        />
                    </div>
                    <p>Colores Predeterminados: </p>
                    <div className="colores-container">
                        {colores.map((color, index) => (
                            <div
                                key={index}
                                className="color-option"
                                style={{ backgroundColor: color }}
                                onClick={() => cambiarColorNodo(color)}
                            ></div>
                        ))}
                    </div>
                    <br /><br />
                    <button className="button frutiger-button clean-button" onClick={limpiarDiagrama}>
                        <Trash2 size={18} style={{ marginRight: '8px' }} />Limpiar
                    </button>

                    <button className="button frutiger-button import-button" onClick={() => {
                        Swal.fire({
                            title: 'Importar desde JSON',
                            input: 'file',
                            inputAttributes: {
                                accept: 'application/json',
                            },
                            showCancelButton: true,
                            confirmButtonText: 'Importar',
                            cancelButtonText: 'Cancelar',
                            inputValidator: (file) => {
                                if (!file) {
                                    return 'Debe seleccionar un archivo JSON';
                                }
                            }
                        }).then((result) => {
                            if (result.isConfirmed) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    const jsonData = JSON.parse(e.target.result);
                                    importarF(jsonData);
                                };
                                reader.readAsText(result.value);
                            }
                        });
                    }}>
                        <Upload size={18} style={{ marginRight: '8px' }} />Importar desde JSON
                    </button>

                    <button className="button frutiger-button export-button" onClick={() => {
                        Swal.fire({
                            title: 'Exportar como',
                            input: 'select',
                            inputOptions: {
                                'png': 'PNG',
                                'pdf': 'PDF',
                                'json': 'JSON',
                                'zip': 'ZIP'
                            },
                            inputPlaceholder: 'Seleccione un formato',
                            showCancelButton: true,
                            confirmButtonText: 'Exportar',
                            cancelButtonText: 'Cancelar',
                            inputValidator: (value) => {
                                if (!value) {
                                    return 'Debe seleccionar un formato';
                                }
                            }
                        }).then((result) => {
                            if (result.isConfirmed) {
                                saveDiagram(result.value);
                            }
                        });
                    }}>
                        <Download size={18} style={{ marginRight: '8px' }} />Exportar como
                    </button>

                    <button className="button frutiger-button delete-button" onClick={eliminarNodoSeleccionado}>
                        <XCircle size={18} style={{ marginRight: '8px' }} />Eliminar Nodo
                    </button>

                    <button className="button frutiger-button edit-button" onClick={editarElementoSeleccionado}>
                        <Edit size={18} style={{ marginRight: '8px' }} />Editar
                    </button>
                </div>
            </motion.div>

            <div className="pizarra" ref={diagramDivRef} style={{ width: `calc(100% - ${leftPanelWidth + rightPanelWidth}px)` }}>

            </div>

            <motion.div
                className="panel-derecho"
                style={{ width: rightPanelWidth }}
                initial="open"
                animate="open"
                transition={{ type: "spring", stiffness: 300 }}
            >
                <div className="contenido-panel">
                    <h3>Algoritmo de Dijkstra</h3>

                    <button
                        className="button frutiger-button dijkstra-button"
                        onClick={ejecutarDijkstra}
                    >
                        <PlayCircle size={18} style={{ marginRight: '8px' }} />Calcular ruta más corta
                    </button>

                    <button
                        className="button frutiger-button"
                        style={{ backgroundColor: "red", color: "white" }} // Botón rojo
                        onClick={calcularCaminoMasLargo}
                    >
                        <PlayCircle size={18} style={{ marginRight: '8px' }} />Calcular ruta más larga
                    </button>

                    <button
                        className="button frutiger-button"
                        onClick={limpiarResultados}
                    >
                        <RotateCcw size={18} style={{ marginRight: '8px' }} />Limpiar resultados
                    </button>

                    <button
                        className="button frutiger-button generate-button"
                        onClick={generarGrafoAleatorio}
                    >
                        <Shuffle size={18} style={{ marginRight: '8px' }} />Generar grafo aleatorio
                    </button>

                    <div className="inicio-fin-selector">
                        <div className="selector-title">Nodo de inicio:</div>
                        <select
                            className="selector-dropdown"
                            value={nodoInicio}
                            onChange={(e) => {
                                setNodoInicio(e.target.value);
                                if (caminoEncontrado) limpiarResultados();
                            }}
                        >
                            <option value="">Seleccione un nodo</option>
                            {nodeNames.map((nombre, index) => (
                                <option key={index} value={nombre}>{nombre}</option>
                            ))}
                        </select>

                        <div className="selector-title">Nodo de destino:</div>
                        <select
                            className="selector-dropdown"
                            value={nodoFin}
                            onChange={(e) => {
                                setNodoFin(e.target.value);
                                if (caminoEncontrado) limpiarResultados();
                            }}
                        >
                            <option value="">Seleccione un nodo</option>
                            {nodeNames.map((nombre, index) => (
                                <option key={index} value={nombre}>{nombre}</option>
                            ))}
                        </select>
                    </div>

                    {pesoTotal !== null && (
                        <div style={{ marginTop: "20px", fontSize: "24px", color: "green", fontWeight: "bold" }}>
                            Peso total: {pesoTotal}
                        </div>
                    )}

                    <div style={{ marginTop: "20px", fontSize: "14px", color: "gray" }}>
                        <h3><span style={{ color: "red", fontWeight: "bold" }}>Rojo:</span> Camino más largo</h3>
                        <h3><span style={{ color: "#03A9F4", fontWeight: "bold" }}>Celeste:</span> Camino más corto</h3>
                    </div>
                </div>
                <div
                    className="resize-handle"
                    onMouseDown={() => setIsResizingRight(true)}
                />
            </motion.div>
        </div>
    );
});

export default PizarraDijkstra;