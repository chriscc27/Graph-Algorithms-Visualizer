import React, { useEffect, useRef, useState, forwardRef } from "react";
import * as go from "gojs";
import { exportAsPng, exportAsPdf, exportAsJson, saveDiagramAsZip, obtenerValorArista } from "./funcionesxd";
import "../styles/PizarraKruskal.css";
import { motion } from "framer-motion";
import { Trash2, Upload, Download, XCircle, Edit, PlayCircle, RotateCcw, Shuffle } from 'lucide-react';
import Swal from "sweetalert2";

const PizarraKruskal = forwardRef(({ onSave }, ref) => {
    const diagramDivRef = useRef(null);
    const diagramInstance = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedLink, setSelectedLink] = useState(null);

    const [leftPanelWidth, setLeftPanelWidth] = useState(250);
    const [rightPanelWidth, setRightPanelWidth] = useState(300);
    const [isResizingRight, setIsResizingRight] = useState(false);

    const [nodeNames, setNodeNames] = useState([]);

    // Estados para Kruskal
    const [resultado, setResultado] = useState(null);
    const [procesoKruskal, setProcesoKruskal] = useState([]);
    const [mstEncontrado, setMstEncontrado] = useState(false);
    const [aristasMST, setAristasMST] = useState([]);
    const [aristasMSTMax, setAristasMSTMax] = useState([]);
    const [costoTotal, setCostoTotal] = useState(0);
    const [costoTotalMax, setCostoTotalMax] = useState(0);
    const [conjuntosDisjuntos, setConjuntosDisjuntos] = useState([]);

    const [showHelp, setShowHelp] = useState(false);

    const helpContent = (
        <div className="help-content">
            <h2>Guía de usuario Algoritmo de Kruskal</h2>

            <h3>¿Qué es el algoritmo de Kruskal?</h3>
            <p>Es un algoritmo para encontrar el árbol de expansión mínima/máxima en un grafo conexo no dirigido con pesos.</p>

            <h3>Funcionalidad de los botones:</h3>
            <ul>
                <li><strong>Limpiar:</strong> Borra toda la pizarra y reinicia todos los estados</li>
                <li><strong>Importar/Exportar:</strong> Carga o guarda el grafo en diferentes formatos</li>
                <li><strong>Eliminar Nodo:</strong> Borra el nodo o arista seleccionado</li>
                <li><strong>Editar:</strong> Modifica propiedades de nodos o aristas</li>
                <li><strong>Generar grafo:</strong> Crea un grafo aleatorio con parámetros configurables</li>
                <li><strong>Ejecutar Kruskal:</strong> Calcula el árbol de expansión mínima/máxima</li>
                <li><strong>Limpiar resultados:</strong> Reinicia los resultados sin modificar el grafo</li>
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
                <li><span style={{ color: '#4CAF50' }}>Verde:</span> MST Mínimo</li>
                <li><span style={{ color: '#2196F3' }}>Azul:</span> MST Máximo</li>
                <li><span style={{ color: '#B0BEC5' }}>Gris:</span> Aristas no incluidas</li>
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
            limpiarResultados();
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

            // Reiniciar el algoritmo si se modifica el grafo
            limpiarResultados();
        } else if (selectedLink && diagramInstance.current) {
            diagramInstance.current.startTransaction("eliminar");
            diagramInstance.current.remove(selectedLink);
            diagramInstance.current.commitTransaction("eliminar");
            setSelectedLink(null);

            // Reiniciar el algoritmo si se modifica el grafo
            limpiarResultados();
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
                limpiarResultados();
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

    // Funciones para manipular Conjuntos Disjuntos (Union-Find)
    const makeSet = (nodes) => {
        const sets = {};
        nodes.forEach(node => {
            sets[node] = {
                parent: node,
                rank: 0
            };
        });
        return sets;
    };

    const find = (sets, node) => {
        if (sets[node].parent !== node) {
            sets[node].parent = find(sets, sets[node].parent);
        }
        return sets[node].parent;
    };

    const union = (sets, node1, node2) => {
        const root1 = find(sets, node1);
        const root2 = find(sets, node2);

        if (root1 === root2) return sets;

        if (sets[root1].rank < sets[root2].rank) {
            sets[root1].parent = root2;
        } else if (sets[root1].rank > sets[root2].rank) {
            sets[root2].parent = root1;
        } else {
            sets[root2].parent = root1;
            sets[root1].rank += 1;
        }

        return sets;
    };

    // Función para obtener los conjuntos formados
    const getConjuntos = (sets) => {
        const conjuntos = {};
        Object.keys(sets).forEach(node => {
            const root = find(sets, node);
            if (!conjuntos[root]) {
                conjuntos[root] = [];
            }
            conjuntos[root].push(node);
        });
        return Object.values(conjuntos);
    };

    // Función para ejecutar el algoritmo de Kruskal
    const ejecutarKruskal = (esMaximo = false) => {
        // Obtener lista de nodos y aristas del diagrama
        const nodosArray = diagramInstance.current.model.nodeDataArray;
        const aristasArray = diagramInstance.current.model.linkDataArray;

        if (nodosArray.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "Grafo vacío",
                text: "Por favor, cree un grafo antes de ejecutar el algoritmo de Kruskal.",
            });
            return;
        }

        if (aristasArray.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "Sin aristas",
                text: "El grafo debe tener aristas para ejecutar el algoritmo de Kruskal.",
            });
            return;
        }

        // Verificar que no haya nodos sueltos
        const nodosConectados = new Set();

        aristasArray.forEach(arista => {
            nodosConectados.add(arista.from);
            nodosConectados.add(arista.to);
        });

        const nodosSueltos = nodosArray.filter(nodo => !nodosConectados.has(nodo.key));

        if (nodosSueltos.length > 0) {
            const nombreNodos = nodosSueltos.map(n => n.text || `Nodo ${n.key}`).join(", ");
            Swal.fire({
                icon: "warning",
                title: "Nodos sueltos detectados",
                text: `Los siguientes nodos no están conectados: ${nombreNodos}. Todos los nodos deben estar conectados para ejecutar el algoritmo de Kruskal correctamente.`,
                confirmButtonText: "Entendido"
            });
            return;
        }

        // Limpiar cualquier resultado previo
        limpiarResultados();

        // Preparar nodos y aristas para el algoritmo
        const nodos = nodosArray.map(n => n.key);

        // Convertir aristas a formato adecuado y verificar que tengan peso
        const aristas = [];
        let aristasValidas = true;

        aristasArray.forEach(arista => {
            const peso = parseFloat(arista.label);
            if (isNaN(peso) || peso <= 0) {
                aristasValidas = false;
                return;
            }

            aristas.push({
                from: arista.from,
                to: arista.to,
                weight: peso,
                id: arista.key
            });
        });

        if (!aristasValidas) {
            Swal.fire({
                icon: "error",
                title: "Aristas sin peso",
                text: "Todas las aristas deben tener un peso válido (número positivo).",
            });
            return;
        }

        // Ordenar las aristas por peso (ascendente o descendente según el caso)
        esMaximo
            ? aristas.sort((a, b) => b.weight - a.weight)
            : aristas.sort((a, b) => a.weight - b.weight);

        // Algoritmo de Kruskal
        const sets = makeSet(nodos);
        const mst = [];
        const proceso = [];
        let costoTotal = 0;

        aristas.forEach((arista, index) => {
            const fromRoot = find(sets, arista.from);
            const toRoot = find(sets, arista.to);

            const estadoPrevioConjuntos = getConjuntos(structuredClone(sets));

            const paso = {
                iteracion: index + 1,
                arista: {
                    from: arista.from,
                    to: arista.to,
                    peso: arista.weight,
                    id: arista.id
                },
                nodoFromNombre: obtenerNombreNodo(arista.from),
                nodoToNombre: obtenerNombreNodo(arista.to),
                fromRoot,
                toRoot,
                formaCiclo: fromRoot === toRoot,
                aceptada: false,
                conjuntosPrevios: estadoPrevioConjuntos
            };

            if (fromRoot !== toRoot) {
                // La arista no forma ciclo, se incluye en el MST
                mst.push(arista);
                costoTotal += arista.weight;
                union(sets, arista.from, arista.to);
                paso.aceptada = true;
            }

            paso.conjuntosActuales = getConjuntos(structuredClone(sets));
            proceso.push(paso);
        });

        // Actualizar estados correspondientes
        if (esMaximo) {
            setAristasMSTMax(mst);
            setCostoTotalMax(costoTotal);
        } else {
            setAristasMST(mst);
            setCostoTotal(costoTotal);
        }

        setResultado({
            mst,
            proceso
        });
        setProcesoKruskal(proceso);
        setMstEncontrado(true);
        setConjuntosDisjuntos(getConjuntos(sets));

        // Resaltar MST en el diagrama con el color correspondiente
        setTimeout(() => {
            resaltarMST(mst, esMaximo ? "#2196F3" : "#4CAF50", esMaximo ? "mst-node-max" : "mst-node-min");
        }, 100);
    };

    const ejecutarKruskalMaximo = () => {
        ejecutarKruskal(true);
    };

    const ejecutarKruskalMinimo = () => {
        ejecutarKruskal(false);
    };

    const obtenerNombreNodo = (key) => {
        const nodo = diagramInstance.current.model.nodeDataArray.find(n => n.key === key);
        return nodo ? nodo.text : `Nodo ${key}`;
    };

    // Función para resaltar visualmente el MST en el diagrama
    const resaltarMST = (mst, linkColor = "#4CAF50", nodeCategory = "mst-node-min") => {
        if (!diagramInstance.current || !mst || mst.length === 0) {
            console.log("No hay MST para resaltar");
            return;
        }

        // Iniciar una transacción para modificar el modelo
        diagramInstance.current.startTransaction("resaltar MST");

        // Reiniciar categorías de nodos y colores de aristas
        diagramInstance.current.model.nodeDataArray.forEach(node => {
            diagramInstance.current.model.setDataProperty(node, "category", "");
        });

        diagramInstance.current.model.linkDataArray.forEach(link => {
            diagramInstance.current.model.setDataProperty(link, "color", "black");
        });

        // Marcar nodos del MST
        const nodosMST = new Set();
        mst.forEach(arista => {
            nodosMST.add(arista.from);
            nodosMST.add(arista.to);
        });

        nodosMST.forEach(nodeKey => {
            const nodo = diagramInstance.current.model.nodeDataArray.find(n => n.key === nodeKey);
            if (nodo) {
                diagramInstance.current.model.setDataProperty(nodo, "category", nodeCategory);
            }
        });

        // Marcar aristas del MST
        mst.forEach(arista => {
            // Buscar por conexión entre nodos
            const linkEncontrado = diagramInstance.current.model.linkDataArray.find(link =>
                (link.from === arista.from && link.to === arista.to) ||
                (link.from === arista.to && link.to === arista.from)
            );

            if (linkEncontrado) {
                diagramInstance.current.model.setDataProperty(linkEncontrado, "color", linkColor);
            }
        });

        // Finalizar la transacción
        diagramInstance.current.commitTransaction("resaltar MST");
    };

    const limpiarResultados = () => {
        setMstEncontrado(false);
        setResultado(null);
        setProcesoKruskal([]);
        setAristasMST([]);
        setAristasMSTMax([]);
        setCostoTotal(0);
        setCostoTotalMax(0);
        setConjuntosDisjuntos([]);

        if (diagramInstance.current) {
            diagramInstance.current.startTransaction("limpiar resultados");

            diagramInstance.current.model.nodeDataArray.forEach(node => {
                diagramInstance.current.model.setDataProperty(node, "category", "");
            });

            diagramInstance.current.model.linkDataArray.forEach(link => {
                diagramInstance.current.model.setDataProperty(link, "color", "black");
            });

            diagramInstance.current.commitTransaction("limpiar resultados");
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

            // Template para nodos normales
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
                    fromLinkableSelfNode: true,
                    toLinkableSelfNode: true,
                    cursor: "pointer",
                }, new go.Binding("fill", "color")),
                $(go.TextBlock, {
                    font: "bold 12px sans-serif",
                    stroke: "#fff",
                    editable: true,
                }, new go.Binding("text").makeTwoWay())
            ));

            // Template para nodos que forman parte del MST
            nodeTemplateMap.add("mst-node-min", $(
                go.Node,
                "Auto",
                {
                    selectable: true,
                    locationSpot: go.Spot.Center
                },
                $(go.Shape, "Ellipse", {
                    width: 55,
                    height: 55,
                    strokeWidth: 3,
                    fill: "#81C784",  // Verde claro
                    stroke: "#2E7D32", // Verde oscuro
                    portId: "",
                    fromLinkable: true,
                    toLinkable: true,
                    cursor: "pointer",
                }),
                $(go.TextBlock, {
                    font: "bold 14px sans-serif",
                    stroke: "#fff",
                }, new go.Binding("text").makeTwoWay())
            ));

            // Template para nodos del MST máximo (celeste)
            nodeTemplateMap.add("mst-node-max", $(
                go.Node,
                "Auto",
                {
                    selectable: true,
                    locationSpot: go.Spot.Center
                },
                $(go.Shape, "Ellipse", {
                    width: 55,
                    height: 55,
                    strokeWidth: 3,
                    fill: "#81D4FA",  // Celeste claro
                    stroke: "#0277BD", // Azul oscuro
                    portId: "",
                    fromLinkable: true,
                    toLinkable: true,
                    cursor: "pointer",
                }),
                $(go.TextBlock, {
                    font: "bold 14px sans-serif",
                    stroke: "#fff",
                }, new go.Binding("text").makeTwoWay())
            ));

            myDiagram.nodeTemplateMap = nodeTemplateMap;

            // Template para las aristas
            myDiagram.linkTemplate = $(
                go.Link,
                {
                    curve: go.Link.None,
                    relinkableFrom: true,
                    relinkableTo: true,
                    selectionAdorned: true,
                    shadowOffset: new go.Point(0, 0),
                    shadowBlur: 5,
                    shadowColor: "rgba(0, 0, 0, 0.5)",
                    // Validación durante la creación
                    click: function (e, obj) {
                        const link = obj.part;
                        const fromNode = link.data.from;
                        const toNode = link.data.to;

                        // Validar conexión consigo mismo
                        if (fromNode === toNode) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Conexión inválida',
                                text: 'No se pueden crear bucles en un mismo nodo'
                            });
                            diagramInstance.current.remove(link);
                            return;
                        }

                        // Validar conexión duplicada
                        const existeConexion = diagramInstance.current.model.linkDataArray.some(existingLink => {
                            return existingLink.key !== link.key &&
                                ((existingLink.from === fromNode && existingLink.to === toNode) ||
                                    (existingLink.from === toNode && existingLink.to === fromNode));
                        });

                        if (existeConexion) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Conexión duplicada',
                                text: 'Ya existe una conexión entre estos nodos'
                            });
                            diagramInstance.current.remove(link);
                        }
                    }
                },
                $(go.Shape, {
                    strokeWidth: 3,
                    stroke: "black",
                    name: "SHAPE",
                    strokeCap: "round"
                }, new go.Binding("stroke", "color").makeTwoWay()),
                $(go.TextBlock, {
                    segmentOffset: new go.Point(0, -10),
                    editable: false,
                    font: "bold 12px sans-serif",
                    stroke: "black",
                    background: "white",
                    cursor: "pointer",
                    click: async (e, obj) => {
                        const link = obj.part;
                        const oldFrom = link.data.from;
                        const oldTo = link.data.to;

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
                            // Verificar si los nodos fueron modificados
                            if (link.data.from !== oldFrom || link.data.to !== oldTo) {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Modificación no permitida',
                                    text: 'No se puede cambiar los nodos de una conexión existente',
                                });
                                return;
                            }

                            diagramInstance.current.model.setDataProperty(link.data, "label", result.value);
                            limpiarResultados();
                        }
                    }
                }, new go.Binding("text", "label").makeTwoWay())
            );

            myDiagram.addDiagramListener("ChangedSelection", (e) => {
                const selected = myDiagram.selection.first();
                if (selected instanceof go.Node) {
                    setSelectedNode(selected);
                    setSelectedLink(null);
                } else if (selected instanceof go.Link) {
                    setSelectedLink(selected);
                    setSelectedNode(null);
                } else {
                    setSelectedNode(null);
                    setSelectedLink(null);
                }
            });

            myDiagram.addDiagramListener("LinkDrawn", async (e) => {
                const link = e.subject;
                const from = link.data.from;
                const to = link.data.to;

                // Validar conexión consigo mismo
                if (from === to) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Conexión inválida',
                        text: 'No se pueden crear bucles en un mismo nodo',
                    });
                    diagramInstance.current.remove(link);
                    return;
                }

                // Validar conexión duplicada
                const existeConexion = diagramInstance.current.model.linkDataArray.some(existingLink => {
                    return existingLink.key !== link.key &&
                        ((existingLink.from === from && existingLink.to === to) ||
                            (existingLink.from === to && existingLink.to === from));
                });

                if (existeConexion) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Conexión duplicada',
                        text: 'Ya existe una conexión entre estos nodos',
                    });
                    diagramInstance.current.remove(link);
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
        ejecutarKruskal,
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
                    diagramInstance.current.model.setDataProperty(selectedNode.data, "text", result.value.nombre);
                    diagramInstance.current.model.setDataProperty(selectedNode.data, "color", result.value.color);

                    const updatedNodeNames = diagramInstance.current.model.nodeDataArray.map(
                        node => node.text || `Nodo ${node.key}`
                    );
                    setNodeNames(updatedNodeNames);

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

    const renderResultado = () => {
        return (
            <div className="result-container">
                {/* MST Mínimo */}
                <div className="mst-section">
                    <div className="result-title" style={{ color: '#4CAF50' }}>
                        Árbol de Expansión Mínima
                    </div>
                    <div className="costo-total">
                        Costo total: {costoTotal}
                    </div>
                    <div className="aristas-list">
                        {aristasMST.map((arista, idx) => (
                            <div key={`min-${idx}`} className="arista-item">
                                <span className="nodos">
                                    {obtenerNombreNodo(arista.from)} &nbsp;↔&nbsp; {obtenerNombreNodo(arista.to)}
                                </span>
                                <span className="peso" style={{ color: '#4CAF50' }}>
                                    &nbsp;{arista.weight}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MST Máximo */}
                <div className="mst-section" style={{ marginTop: '20px' }}>
                    <div className="result-title" style={{ color: '#2196F3' }}>
                        Árbol de Expansión Máxima
                    </div>
                    <div className="costo-total">
                        Costo total: {costoTotalMax}
                    </div>
                    <div className="aristas-list">
                        {aristasMSTMax.map((arista, idx) => (
                            <div key={`max-${idx}`} className="arista-item">
                                <span className="nodos">
                                    {obtenerNombreNodo(arista.from)} ↔ {obtenerNombreNodo(arista.to)}
                                </span>
                                <span className="peso" style={{ color: '#2196F3' }}>
                                    {arista.weight}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {conjuntosDisjuntos.length > 1 && (
                    <div className="alerta-desconexion">
                        ⚠️ El grafo no es conexo. Componentes encontrados: {conjuntosDisjuntos.length}
                    </div>
                )}
            </div>
        );
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

            {/* Ventana emergente de ayuda */}
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

                    <button
                        className="button frutiger-button generate-button"
                        onClick={generarGrafoAleatorio}
                    >
                        <Shuffle size={18} style={{ marginRight: '8px' }} />Generar grafo aleatorio
                    </button>

                    <button
                        className="button frutiger-button"
                        onClick={ejecutarKruskal}
                    >
                        <PlayCircle size={18} style={{ marginRight: '8px' }} />Ejecutar Kruskal
                    </button>

                    <button
                        className="button frutiger-button"
                        onClick={limpiarResultados}
                    >
                        <RotateCcw size={18} style={{ marginRight: '8px' }} />Limpiar resultados
                    </button>
                </div>
            </motion.div>

            <div className="pizarra" ref={diagramDivRef} style={{ width: `calc(100% - ${leftPanelWidth + rightPanelWidth}px)` }}></div>

            <motion.div
                className="panel-derecho"
                style={{ width: rightPanelWidth }}
                initial="open"
                animate="open"
                transition={{ type: "spring", stiffness: 300 }}
            >
                <div className="contenido-panel">
                    <h3>Algoritmo de Kruskal</h3>

                    {renderResultado()}


                    <div className="botones-container">
                        <button
                            className="btn-calcular"
                            onClick={ejecutarKruskalMinimo}
                            style={{ backgroundColor: '#4CAF50' }}
                        >
                            Calcular MST Mínimo
                        </button>

                        <button
                            className="btn-calcular"
                            onClick={ejecutarKruskalMaximo}
                            style={{ backgroundColor: '#2196F3', marginTop: '10px' }}
                        >
                            Calcular MST Máximo
                        </button>

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

export default PizarraKruskal;