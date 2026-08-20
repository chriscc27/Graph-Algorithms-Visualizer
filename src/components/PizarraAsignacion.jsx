import React, { useEffect, useRef, useState, forwardRef } from "react";
import * as go from "gojs";
import { exportAsPng, exportAsPdf, exportAsJson, saveDiagramAsZip, calculateAdjacencyMatrix, obtenerValorArista } from "./funcionesxd";
import "../styles/pizarraAsignacion.css";
import { FaPalette, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import { Trash2, Upload, Download, XCircle, Edit } from 'lucide-react';
import MatrizAdyacencia from "./MatrizAdyacencia";
import MatrizAsignacion from "./MatrizAsignacion";
import MatrizModificada from "./MatrizModificada";
import { aplicarMetodoHungaro } from "./MetodoHungaro";
import Swal from "sweetalert2";



const PizarraAsignacion = forwardRef(({ onSave }, ref) => {
    const diagramDivRef = useRef(null);
    const diagramInstance = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedLink, setSelectedLink] = useState(null);
    
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(250); // Ancho del panel izquierdo
    const [rightPanelWidth, setRightPanelWidth] = useState(300); // Ancho inicial del panel derecho
    const [isResizingRight, setIsResizingRight] = useState(false);
    
    const [matrix, setMatrix] = useState([]);
    const [matrixNew, setMatrixNew] = useState([]);
    const [nodeNames, setNodeNames] = useState([]);
    const [nodeNames1, setNodeNames1] = useState([]);
    const [processedMatrix, setProcessedMatrix] = useState([]);  // Estado de la matriz procesada
    const [columnHeaders, setColumnHeaders] = useState([]);

    const [matrizM, setMatrixM] = useState([]);
    const [costoAtributo, setCostoAtributo] = useState(null);
    const [matrizA, setMatrixA] = useState([]);
    const [modoAsignacion, setModoAsignacion] = useState(null);

    const colores = [
        "#FFEB3B", "#FFC107", "#FF9800", "#FF5722", "#F44336", "#D32F2F", "#00E5FF", "#00BCD4", "#03A9F4", "#2196F3", "#3F51B5", "#1A237E",
        "#8BC34A", "#4CAF50", "#009688", "#388E3C", "#2C6E3A", "#1B5E20", "#F06292", "#FF4081", "#E91E63", "#9C27B0", "#673AB7", "#7C4DFF",
        "#D7CCC8", "#BCAAA4", "#8D6E63", "#6D4C41", "#4E342E", "#3E2723"
    ];

    const limpiarDiagrama = () => {
        if (diagramInstance.current) {
            diagramInstance.current.model = new go.GraphLinksModel([], []);
            setMatrix([]);
            setNodeNames([]);
        }
    };

    const eliminarNodoSeleccionado = () => {
        if (selectedNode && diagramInstance.current) {
            diagramInstance.current.startTransaction("eliminar");
            diagramInstance.current.remove(selectedNode);
            diagramInstance.current.commitTransaction("eliminar");
            setSelectedNode(null);

            // Actualizar la matriz de adyacencia después de eliminar el nodo y sus enlaces
            const { adjacencyMatrix, nodeNames } = calculateAdjacencyMatrix(
                diagramInstance.current.model.nodeDataArray,
                diagramInstance.current.model.linkDataArray
            );
            setMatrix(adjacencyMatrix);
            setNodeNames(nodeNames);
        } else if (selectedLink && diagramInstance.current) {
            diagramInstance.current.startTransaction("eliminar");
            diagramInstance.current.remove(selectedLink);
            diagramInstance.current.commitTransaction("eliminar");
            setSelectedLink(null);

            // Actualizar la matriz de adyacencia después de eliminar la arista
            const { adjacencyMatrix, nodeNames } = calculateAdjacencyMatrix(
                diagramInstance.current.model.nodeDataArray,
                diagramInstance.current.model.linkDataArray
            );
            setMatrix(adjacencyMatrix);
            setNodeNames(nodeNames);
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
                    console.log("modelo json: ", modelJson)
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
    const aplicarAlgoritmoAsignacion = () => {
        if (!diagramInstance.current) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se ha inicializado el diagrama.',
            });
            return;
            }
        
            const nodes = diagramInstance.current.model.nodeDataArray;
            const links = diagramInstance.current.model.linkDataArray;
        
            // Verificar si hay nodos
            if (nodes.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No hay nodos en el diagrama.',
            });
            return;
            }
        
            // Verificar si hay aristas
            if (links.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No hay aristas en el diagrama.',
            });
            return;
            }
        
            // Aplicar el algoritmo de asignación
            handleGenerateJson('Generar matriz de asignacion');
        };

    const importarF = (jsonData) => {
        if (diagramInstance.current) {
            diagramInstance.current.model = new go.GraphLinksModel([], []);

            if (jsonData && jsonData.nodeDataArray && jsonData.linkDataArray) {
                diagramInstance.current.model = new go.GraphLinksModel(jsonData.nodeDataArray, jsonData.linkDataArray);
                const { adjacencyMatrix, nodeNames } = calculateAdjacencyMatrix(
                    jsonData.nodeDataArray,
                    jsonData.linkDataArray
                );
                setMatrix(adjacencyMatrix);
                setNodeNames(nodeNames);
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

// Lógica para redimensionar el panel derecho
useEffect(() => {
    const handleMouseMove = (e) => {
        if (isResizingRight) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 100 && newWidth < 500) { // Límites de ancho
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
        if (!matrizA.length || !modoAsignacion || !diagramInstance.current) return;
      
        const model = diagramInstance.current.model;
        const nodeData = model.nodeDataArray;
        const linkData = model.linkDataArray;
      
        // Mapeo de textos a claves de nodos
        const textToKeyMap = {};
        nodeData.forEach(node => {
          textToKeyMap[node.text] = node.key;
        });
      
        // Color según el modo
        const highlightColor = modoAsignacion === 'min' ? '#FF4081' : '#4CAF50';
      
        // Reiniciar colores
        linkData.forEach(link => {
          model.setDataProperty(link, 'color', '#2D2D2D');
        });
      
        // Resaltar asignaciones óptimas
        matrizA.forEach((row, i) => {
          row.forEach((cell, j) => {
            if (cell === 1) {
              const fromText = nodeNames1.fromNodes[i];
              const toText = nodeNames1.toNodes[j];
              const fromKey = textToKeyMap[fromText];
              const toKey = textToKeyMap[toText];
      
              if (fromKey && toKey) {
                const optimalLink = linkData.find(link => 
                  link.from === fromKey && link.to === toKey
                );
                if (optimalLink) {
                  model.setDataProperty(optimalLink, 'color', highlightColor);
                  model.setDataProperty(optimalLink, 'strokeWidth', 4);
                }
              }
            }
          });
        });
      
      }, [matrizA, modoAsignacion, nodeNames1]);

    
    useEffect(() => {
        if (!diagramInstance.current) {
            const $ = go.GraphObject.make;
            const myDiagram = $(go.Diagram, diagramDivRef.current, {
                "animationManager.initialAnimationStyle": go.AnimationManager.None,
                "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
                "undoManager.isEnabled": true,
                "clickCreatingTool.archetypeNodeData": { text: "Nuevo Nodo", color: "#4CAF50" },
            });

            // Configuración del template para los nodos
            myDiagram.nodeTemplate = $(
                go.Node,
                "Auto",
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
            );

            // Configuración del template para los enlaces
            myDiagram.linkTemplate = $(
                go.Link,
                {
                    curve: go.Link.Bezier,
                    curviness: 40,
                    relinkableFrom: true,
                    relinkableTo: true,
                },
                $(go.Shape, { 
                    strokeWidth: 3,  // Aumentar grosor para mejor visibilidad
                    stroke: "black" 
                }, new go.Binding("stroke", "color")),
                $(go.Shape, { toArrow: "Standard", fill: "black" }),
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
                            }
                        });
                        if (result.isConfirmed) {
                            diagramInstance.current.model.setDataProperty(link.data, "label", result.value);
                            const { adjacencyMatrix, nodeNames } = calculateAdjacencyMatrix(
                                diagramInstance.current.model.nodeDataArray,
                                diagramInstance.current.model.linkDataArray
                            );
                            setMatrix(adjacencyMatrix);
                            setNodeNames(nodeNames);
                        }
                    }
                }, new go.Binding("text", "label").makeTwoWay())
            );

            // Listener para cambios en la selección
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

            // Listener para cuando se dibuja un enlace
            myDiagram.addDiagramListener("LinkDrawn", async (e) => {
                const link = e.subject;
                const fromNode = link.fromNode.data.key;
                const toNode = link.toNode.data.key;
            
                // Verificar si ya existe una arista en la dirección opuesta
                const existingLink = diagramInstance.current.model.linkDataArray.find(
                    (l) => l.from === toNode && l.to === fromNode
                );
                if (existingLink) {
                    Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se permite una arista de regreso.',
                    });
                    diagramInstance.current.remove(link);
                    return;
                    }
                
                    const valorArista = await obtenerValorArista();
                    if (valorArista !== null) {
                    diagramInstance.current.model.setDataProperty(link.data, "label", valorArista.toString());
                    diagramInstance.current.model.commitTransaction("Arista actualizada");
                    const { adjacencyMatrix, nodeNames } = calculateAdjacencyMatrix(
                        diagramInstance.current.model.nodeDataArray,
                        diagramInstance.current.model.linkDataArray
                    );
                    setMatrix(adjacencyMatrix);
                    setNodeNames(nodeNames);
                    } else {
                    diagramInstance.current.remove(link);
                    }
                });

            // Listener para cambios en el modelo
            myDiagram.addModelChangedListener((e) => {
                if (e.isTransactionFinished) {
                    const { adjacencyMatrix, nodeNames } = calculateAdjacencyMatrix(
                        myDiagram.model.nodeDataArray,
                        myDiagram.model.linkDataArray
                    );
                    setMatrix(adjacencyMatrix);
                    setNodeNames(nodeNames);
                }
            });

            // Configuración del modelo
            myDiagram.model = new go.GraphLinksModel(
                [], // nodeDataArray inicial (vacío)
                [], // linkDataArray inicial (vacío)
                {
                    nodeKeyProperty: "key", // Propiedad clave para los nodos
                    linkKeyProperty: "key", // Propiedad clave para los enlaces
                    linkFromPortIdProperty: "fromPort",
                    linkToPortIdProperty: "toPort",
                    linkLabelProperty: "label", // Propiedad para el texto del enlace
                    nodeCategoryProperty: "category", // Propiedad para la categoría del nodo
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

                    // Actualizar la matriz de adyacencia después de editar el nodo
                    const { adjacencyMatrix, nodeNames } = calculateAdjacencyMatrix(
                        diagramInstance.current.model.nodeDataArray,
                        diagramInstance.current.model.linkDataArray
                    );
                    setMatrix(adjacencyMatrix);
                    setNodeNames(nodeNames);
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
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    diagramInstance.current.model.setDataProperty(selectedLink.data, "label", result.value);

                    // Actualizar la matriz de adyacencia después de editar la arista
                    const { adjacencyMatrix, nodeNames } = calculateAdjacencyMatrix(
                        diagramInstance.current.model.nodeDataArray,
                        diagramInstance.current.model.linkDataArray
                    );
                    setMatrix(adjacencyMatrix);
                    setNodeNames(nodeNames);
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

    const handleGenerateJson = async (type) => {
        try {
            // Obtener el JSON del diagrama
            const modelJsonString = diagramInstance.current.model.toJson();
            console.log("Contenido del JSON (string):", modelJsonString);

            // Parsear el JSON a un objeto de JavaScript
            const modelJson = JSON.parse(modelJsonString);
            console.log("Contenido del JSON (objeto):", modelJson);

            // Verificar si el JSON tiene las propiedades 'nodeDataArray' y 'linkDataArray'
            if (!modelJson || !Array.isArray(modelJson.nodeDataArray) || !Array.isArray(modelJson.linkDataArray)) {
                console.error("Estructura del JSON inesperada. Verifique que tenga las propiedades 'nodeDataArray' y 'linkDataArray'.");
                Swal.fire({
                    icon: "error",
                    title: "Error al generar la matriz",
                    text: "El JSON no tiene los campos necesarios (nodeDataArray y linkDataArray)."
                });
                return;
            }

            // Obtener los datos de nodos y enlaces
            const nodeData = modelJson.nodeDataArray;
            const linkData = modelJson.linkDataArray;

            // Crear un objeto para mapear las claves de los nodos a sus textos
            const nodeTextMap = {};
            nodeData.forEach((node) => {
                if (node.key !== undefined && node.text !== undefined) {
                    nodeTextMap[node.key] = node.text;  // Mapear la clave del nodo a su texto
                } else {
                    console.warn(`El nodo con key ${node.key} no tiene la propiedad 'text'.`);
                }
            });

            // Obtener los nodos únicos que tienen aristas (from y to)
            const uniqueFromNodes = new Set();
            const uniqueToNodes = new Set();
            linkData.forEach((link) => {
                if (link.from !== undefined && link.to !== undefined) {
                    uniqueFromNodes.add(link.from); // Agregar el nodo 'from'
                    uniqueToNodes.add(link.to);   // Agregar el nodo 'to'
                }
            });

            // Convertir los conjuntos de nodos únicos a arrays
            const uniqueFromNodesArray = Array.from(uniqueFromNodes);
            const uniqueToNodesArray = Array.from(uniqueToNodes);

            // Crear un objeto para mapear los textos de los nodos a índices de la matriz
            const fromTextIndexMap = {};
            uniqueFromNodesArray.forEach((nodeKey, index) => {
                fromTextIndexMap[nodeTextMap[nodeKey]] = index;  // Mapear el texto del nodo 'from' a su índice
            });

            const toTextIndexMap = {};
            uniqueToNodesArray.forEach((nodeKey, index) => {
                toTextIndexMap[nodeTextMap[nodeKey]] = index;  // Mapear el texto del nodo 'to' a su índice
            });

            // Inicializar la matriz con las dimensiones correctas
            const matrixNew = Array.from({ length: uniqueFromNodesArray.length }, () =>
                Array(uniqueToNodesArray.length).fill(0)
            );

            // Llenar la matriz con los valores de 'from' y 'to' usando los textos de los nodos
            linkData.forEach((link) => {
                const fromKey = link.from;  // Clave del nodo de origen
                const toKey = link.to;      // Clave del nodo de destino
                const label = parseInt(link.label, 10);  // El valor del enlace (por ejemplo, el peso de la conexión)

                const fromText = nodeTextMap[fromKey];  // Texto del nodo de origen
                const toText = nodeTextMap[toKey];      // Texto del nodo de destino

                const fromIndex = fromTextIndexMap[fromText];  // Convertir 'from' a índice
                const toIndex = toTextIndexMap[toText];      // Convertir 'to' a índice

                // Asignar el valor en la matriz
                if (fromIndex !== undefined && toIndex !== undefined) {
                    matrixNew[fromIndex][toIndex] = label;
                } else {
                    console.warn(`No se encontró el índice para fromText: ${fromText} o toText: ${toText}`);
                }
            });

            // Mostrar la matriz generada en la consola
            console.log("Matriz generada a partir del JSON:", matrixNew);

            // Mostrar la matriz en la interfaz de usuario (opcional)
            setMatrixNew(matrixNew); // Actualizar el estado de la matriz
            setNodeNames1({
                fromNodes: uniqueFromNodesArray.map(nodeKey => nodeTextMap[nodeKey]), // Nombres de los nodos 'from'
                toNodes: uniqueToNodesArray.map(nodeKey => nodeTextMap[nodeKey])       // Nombres de los nodos 'to'
            });

        } catch (error) {
            console.error("Error al generar la matriz:", error.message);
            Swal.fire({
                icon: "error",
                title: "Error al generar la matriz",
                text: error.message || "Ha ocurrido un error inesperado.",
            });
        }
    };

    React.useImperativeHandle(ref, () => ({
        // ... otras funciones
        handleGenerateJson // Añadir esta línea
    }));

    const obtenerMinimo = (matriz) => {
        const { matrizAsignacion, costo, matrizModificada } = aplicarMetodoHungaro(matriz, false);
        setModoAsignacion('min');
        setMatrixM(matrizModificada);
        setCostoAtributo(costo);
        setMatrixA(matrizAsignacion); // Guardar la matriz de asignación
        console.log(matrizAsignacion, costo);
    
        return {
            mensaje: "Asignación óptima por minimización",
            matrizAsignacion,
            costo,
            matrizModificada,
        };
    };



    // Función para aplicar el método húngaro en modo maximización
    const obtenerMaximo = (matriz) => {
        const { matrizAsignacion, costo, matrizModificada } = aplicarMetodoHungaro(matriz, true);
        setModoAsignacion('max');
        setMatrixM(matrizModificada);
        setCostoAtributo(costo);
        setMatrixA(matrizAsignacion); // Guardar la matriz de asignación
        console.log(matrizAsignacion, costo);
    
        return {
            mensaje: "Asignación óptima por maximización",
            matrizAsignacion,
            costo,
            matrizModificada,
        };
    };

    // Para manejar la actualización de matrizM
    useEffect(() => {
        console.log(matrizM); // Este log se ejecutará cada vez que 'matrizM' cambie
    }, [matrizM]);

    return (
        <div className="contenedor">
            {/* Panel izquierdo */}
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
                    <br /><br /><br />
                    <button className="button frutiger-button clean-button" onClick={limpiarDiagrama}>
                        <i className="fas fa-trash-alt"><Trash2 size={18} style={{ marginRight: '8px' }} /></i>Limpiar
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
                        <i className="fas fa-file-import"></i><Upload size={18} style={{ marginRight: '8px' }} />Importar desde JSON
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
                        <i className="fas fa-file-export"></i><Download size={18} style={{ marginRight: '8px' }} />Exportar como
                    </button>

                    <button className="button frutiger-button delete-button" onClick={eliminarNodoSeleccionado}>
                        <i className="fas fa-trash"></i><XCircle size={18} style={{ marginRight: '8px' }} />Eliminar Nodo
                    </button>

                    <button className="button frutiger-button edit-button" onClick={editarElementoSeleccionado}>
                        <i className="fas fa-edit"></i><Edit size={18} style={{ marginRight: '8px' }} />Editar
                    </button>
                    <button 
                        className="button frutiger-button asignacion-button"
                        onClick={aplicarAlgoritmoAsignacion} // Función para aplicar el algoritmo
                        >
                        <i className="fas fa-calculator"></i>Aplicar Algoritmo de Asignación
                    </button>
                </div>
            </motion.div>

            {/* Pizarra central */}
            <div className="pizarra" ref={diagramDivRef} style={{ width: `calc(100% - ${leftPanelWidth + rightPanelWidth}px)` }}></div>

            {/* Panel derecho */}
            <motion.div
                className="panel-derecho"
                style={{ width: rightPanelWidth }}
                initial="open"
                animate="open"
                transition={{ type: "spring", stiffness: 300 }}
                >
                <div className="contenido-panel">
                    <div className="botones-container">
                        <button 
                            className="btn-minimo" 
                            onClick={() => obtenerMinimo(matrixNew)}
                        >
                            Mínimo
                        </button>

                        <button 
                            className="btn-maximo" 
                            onClick={() => obtenerMaximo(matrixNew)}
                        >
                            Máximo
                        </button>
                    </div>
                        <div>
                        <MatrizAsignacion matrix={matrixNew} nodeNames={nodeNames1} matrizAsignacion={matrizA} />
                        </div>

                        <div className="costo">
                            <h3>Costo total: {costoAtributo}</h3>
                        </div>
                        
                        <div 
                            className={`linea-color ${modoAsignacion === 'min' ? 'minimo' : 'maximo'}`}
                            style={{ display: costoAtributo ? 'block' : 'none' }}
                        />
                        
                        {costoAtributo && (
                            <div className="conexiones-container">
                                <div className="conexiones-titulo">
                                    Asignaciones óptimas ({modoAsignacion === 'min' ? 'Minimización' : 'Maximización'})
                                </div>
                                <div className="conexiones-lista">
                                    {matrizA.map((row, i) => 
                                        row.map((cell, j) => 
                                            cell === 1 && (
                                                <div key={`${i}-${j}`} className="conexion-item">
                                                    {nodeNames1.fromNodes[i]} → {nodeNames1.toNodes[j]}
                                                </div>
                                            )
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                        </div>
                <div
                    className="resize-handle"
                    onMouseDown={() => setIsResizingRight(true)}
                />
            </motion.div>
        </div>
    );
});


export default PizarraAsignacion;

