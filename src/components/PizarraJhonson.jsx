import React, { useEffect, useRef, useState, forwardRef } from "react";
import * as go from "gojs";
import { exportAsPng, exportAsPdf, exportAsJson, saveDiagramAsZip, calculateAdjacencyMatrix, obtenerValorArista } from "./funcionesxd";
import "../styles/PizarraJohnson.css";
import { FaPalette, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import { Trash2, Upload, Download, XCircle, Edit } from 'lucide-react';
import MatrizAdyacencia from "./MatrizAdyacencia";
import Swal from "sweetalert2";

const PizarraJohnson = forwardRef(({ onSave }, ref) => {
  const diagramDivRef = useRef(null);
  const diagramInstance = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(250);
  const [rightPanelWidth, setRightPanelWidth] = useState(250);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [matrix, setMatrix] = useState([]);
  const [nodeNames, setNodeNames] = useState([]);

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

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        const newWidth = e.clientX;
        if (newWidth > 100 && newWidth < 500) {
          setLeftPanelWidth(newWidth);
        }
      }
      if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 100 && newWidth < 500) {
          setRightPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  useEffect(() => {
    if (!diagramInstance.current) {
      const $ = go.GraphObject.make;
      const myDiagram = $(go.Diagram, diagramDivRef.current, {
        "animationManager.initialAnimationStyle": go.AnimationManager.None,
        "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
        "undoManager.isEnabled": true,
        "clickCreatingTool.archetypeNodeData": { text: "Nuevo Nodo", color: "#4CAF50" },
      });

      myDiagram.nodeTemplate = $(
        go.Node,
        "Auto",
        $(go.Shape, "Ellipse", {
            width: 75,
            height: 75,
            strokeWidth: 1.5,
            fill: "#4CAF50",
            portId: "",
            fromLinkable: true,
            toLinkable: true,
            cursor: "pointer",
        }, new go.Binding("fill", "color")),
    
        $(go.Panel, "Table",
            {
                margin: 2,
                defaultAlignment: go.Spot.Center
            },
    
            $(go.TextBlock, {
                row: 0,
                columnSpan: 3,
                font: "bold 17px sans-serif",
                stroke: "#fff",
                editable: true,
                margin: new go.Margin(0, 0, 3, 0)
            }, new go.Binding("text", "text").makeTwoWay()),

            $(go.Panel, "Vertical",
              $(go.Shape, "LineH", {
                stroke: "white",
                strokeWidth: 3,
                height: 12,
                alignment: go.Spot.Center,
                margin: new go.Margin(20, 0, 0, 0)
            })
            ),
    
            // Panel para los tiempos
            $(go.Panel, "Horizontal",
                {
                    row: 1,
                    columnSpan: 3,
                    alignment: go.Spot.Center,
                    margin: new go.Margin(3, 0, 0, 0),
                },
                //tiempos tempranos
                $(go.TextBlock, {
                    font: "bold 15px sans-serif",
                    stroke: "#fff",
                    alignment: go.Spot.Left
                }, new go.Binding("text", "early", t => t?.toString() || "")),
    
                $(go.Shape, "LineV", {
                    stroke: "white",
                    strokeWidth: 3,
                    height: 25,
                    alignment: go.Spot.Center,
                    margin: new go.Margin(0, -15, 0, -19)
                }),
                //tiempos tardios
                $(go.TextBlock, {
                    font: "bold 15px sans-serif",
                    stroke: "#fff",
                    alignment: go.Spot.Right
                }, new go.Binding("text", "late", t => t?.toString() || ""))
            )
        )
    );
      

      myDiagram.linkTemplate = $(
        go.Link,
        {
            curve: go.Link.Bezier,
            curviness: 40,
            relinkableFrom: true,
            relinkableTo: true,
        },
        $(go.Shape, 
            { strokeWidth: 2 }, 
            new go.Binding("stroke", "strokeColor") // Binding para el color
        ),
        $(go.Shape, 
            { toArrow: "Standard" }, 
            new go.Binding("fill", "strokeColor") // Binding para el color de la flecha
        ),
        $(go.TextBlock, {
          segmentOffset: new go.Point(0, -10),
          editable: false,
          font: "bold 12px sans-serif",
          stroke: "black",
          background: "white",
          cursor: "pointer",
          click: async (e, obj) => { // Manejador de clic para mostrar SweetAlert
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
        }, new go.Binding("text", "label").makeTwoWay()),
        $(go.TextBlock, {  // Holgura
            segmentOffset: new go.Point(0, 30),  // Posición más abajo
            font: "bold 20px sans-serif",  // Texto más grande
            stroke: "#63406d",
            background: "rgba(255,255,255,0.7)",
            }, new go.Binding("text", "slack", s => `h = ${s ?? ""}`))
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
        const valorArista = await obtenerValorArista();
        if (valorArista !== null) {
          myDiagram.model.setDataProperty(link.data, "label", valorArista.toString());
          myDiagram.model.commitTransaction("Arista actualizada");
          const { adjacencyMatrix, nodeNames } = calculateAdjacencyMatrix(
            myDiagram.model.nodeDataArray,
            myDiagram.model.linkDataArray
          );
          setMatrix(adjacencyMatrix);
          setNodeNames(nodeNames);
        } else {
          myDiagram.remove(link);
        }
      });

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

      myDiagram.model = new go.GraphLinksModel([], [], {
        linkKeyProperty: "key",
        linkFromPortIdProperty: "fromPort",
        linkToPortIdProperty: "toPort",
        linkLabelProperty: "label",
        nodeKeyProperty: "key",
        nodeCategoryProperty: "category",
      });

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

  const topologicalSort = (nodes, links) => {
    const inDegree = new Map();
    const adjList = new Map();
  
    nodes.forEach(node => {
      inDegree.set(node.key, 0);
      adjList.set(node.key, []);
    });
  
    links.forEach(link => {
      const from = link.from;
      const to = link.to;
      adjList.get(from).push(to);
      inDegree.set(to, inDegree.get(to) + 1);
    });
  
    const queue = [];
    inDegree.forEach((degree, key) => {
      if (degree === 0) queue.push(key);
    });
  
    const order = [];
    while (queue.length > 0) {
      const u = queue.shift();
      order.push(u);
      adjList.get(u).forEach(v => {
        inDegree.set(v, inDegree.get(v) - 1);
        if (inDegree.get(v) === 0) queue.push(v);
      });
    }
  
    return { order, hasCycle: order.length !== nodes.length };
  };
  
  const calcularCaminoCritico = () => {
    if (!diagramInstance.current) return;
  
    const model = diagramInstance.current.model;
    const nodes = model.nodeDataArray;
    const links = model.linkDataArray;
  
    // Validar que todas las aristas tengan un valor numérico
    for (const link of links) {
      if (isNaN(parseFloat(link.label))) {
        Swal.fire("Error", "Todas las aristas deben tener un valor numérico.", "error");
        return;
      }
    }
  
    // Orden topológico y detección de ciclos
    const { order, hasCycle } = topologicalSort(nodes, links);
    if (hasCycle) {
      Swal.fire("Error", "El grafo contiene ciclos. No se puede calcular el camino crítico.", "error");
      return;
    }
  
    // Calcular tiempos más tempranos (ES)
    const es = new Map();
    nodes.forEach(node => es.set(node.key, 0));
    order.forEach(u => {
      links.filter(l => l.from === u).forEach(link => {
        const v = link.to;
        const duration = parseFloat(link.label);
        es.set(v, Math.max(es.get(v), es.get(u) + duration));
      });
    });
  
    // Calcular tiempos más tardíos (LF)
    const lf = new Map();
    const endNodes = nodes.filter(node => !links.some(l => l.from === node.key));
    const maxES = Math.max(...endNodes.map(n => es.get(n.key)));
    nodes.forEach(node => lf.set(node.key, maxES));
  
    const reverseOrder = [...order].reverse();
    reverseOrder.forEach(u => {
      links.filter(l => l.from === u).forEach(link => {
        const duration = parseFloat(link.label);
        lf.set(u, Math.min(lf.get(u), lf.get(link.to) - duration));
      });
    });
  
    // Calcular holguras y camino crítico
    const criticalLinks = [];
    const criticalNodes = new Set();
    links.forEach(link => {
      const slack = lf.get(link.to) - es.get(link.from) - parseFloat(link.label);
      if (slack === 0) {
        criticalLinks.push(link);
        criticalNodes.add(link.from);
        criticalNodes.add(link.to);
      }
    });

    // Actualizar tiempos en nodos
    model.startTransaction("update-times");
    nodes.forEach(node => {
      model.setDataProperty(node, "early", es.get(node.key));
      model.setDataProperty(node, "late", lf.get(node.key));
    });
    
    // Actualizar holguras en aristas
    model.linkDataArray.forEach(link => {
      const slack = lf.get(link.to) - es.get(link.from) - parseFloat(link.label);
      model.setDataProperty(link, "slack", slack);
    });
    model.commitTransaction("update-times");
  
    // Resaltar elementos en el diagrama
    model.startTransaction("highlight-critical-path");
    model.nodeDataArray.forEach(node => {
      model.setDataProperty(node, "color", criticalNodes.has(node.key) ? "#FF0000" : node.color);
    });
    model.linkDataArray.forEach(link => {
      model.setDataProperty(link, "strokeColor", criticalLinks.includes(link) ? "#FF0000" : "black");
    });
    model.commitTransaction("highlight-critical-path");
  
    // Mostrar holguras
    Swal.fire({
      title: "Camino Crítico",
      html: `
        <div>
          <h4>Holguras:</h4>
          ${links.map(link => {
            const slack = lf.get(link.to) - es.get(link.from) - parseFloat(link.label);
            return `<p>${link.from} → ${link.to}: ${slack}</p>`;
          }).join("")}
        </div>
      `,
      confirmButtonText: "Cerrar"
    });
  };

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

  return (
    <div className="contenedor">
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

          <button className="button frutiger-button cpm-button" onClick={calcularCaminoCritico}>
            <i className="fas fa-project-diagram"></i>Aplicar Algoritmo de Johnson
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
          <MatrizAdyacencia matrix={matrix} nodeNames={nodeNames} />
        </div>
        <div
          className="resize-handle"
          onMouseDown={() => setIsResizingRight(true)}
        ></div>
      </motion.div>
    </div>
  );
});

export default PizarraJohnson;