import React, { useState, useEffect, useRef } from "react";
import { FaTree, FaRedo, FaPlay, FaList, FaKeyboard, FaFileExport, FaFileImport } from "react-icons/fa";
import Tree from "react-d3-tree";
import Swal from "sweetalert2";
import "../styles/PizarraArboles.css";

// Configuración de audio
let audioContext;
let audioInitialized = false;

const initializeAudio = () => {
  if (audioInitialized) return;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioInitialized = true;
  } catch (e) {
    console.error("Web Audio API no soportada", e);
  }
};

const playTone = (frequency = 440, duration = 0.1) => {
  if (!audioInitialized) initializeAudio();
  if (!audioContext) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.error("Error al reproducir sonido:", error);
  }
};

// Clase BST Node
class BSTNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

// Clase BST
class BinarySearchTree {
  constructor() {
    this.root = null;
  }

  insert(value) {
    const newNode = new BSTNode(value);
    
    if (this.root === null) {
      this.root = newNode;
      return this;
    }
    
    let current = this.root;
    
    while (true) {
      if (value === current.value) return undefined; // No se permiten duplicados
      
      if (value < current.value) {
        if (current.left === null) {
          current.left = newNode;
          return this;
        }
        current = current.left;
      } else {
        if (current.right === null) {
          current.right = newNode;
          return this;
        }
        current = current.right;
      }
    }
  }

  toD3Tree(node = this.root, depth = 0, isLeft = null) {
    if (!node) return null;
  
    const children = [
      this.toD3Tree(node.left, depth + 1, true),
      this.toD3Tree(node.right, depth + 1, false)
    ].filter(child => child !== null);
  
    return {
      name: node.value.toString(),
      attributes: {
        id: node.value.toString(),
        value: node.value,
        depth: depth,
        isLeft: isLeft // Agregamos esta propiedad
      },
      children: children.sort((a, b) => a.attributes.value - b.attributes.value)
    };
  }

  // Métodos de recorrido que devuelven los nodos en orden de visita
  async preOrder(node = this.root, callback) {
    if (!node) return;
    await callback(node);
    await this.preOrder(node.left, callback);
    await this.preOrder(node.right, callback);
  }

  async inOrder(node = this.root, callback) {
    if (!node) return;
    await this.inOrder(node.left, callback);
    await callback(node);
    await this.inOrder(node.right, callback);
  }

  async postOrder(node = this.root, callback) {
    if (!node) return;
    await this.postOrder(node.left, callback);
    await this.postOrder(node.right, callback);
    await callback(node);
  }
}

const PizarraArboles = () => {
  const [array, setArray] = useState([]);
  const [treeData, setTreeData] = useState({});
  const [resultadoRecorrido, setResultadoRecorrido] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [bst, setBST] = useState(new BinarySearchTree());
  const treeContainerRef = useRef(null);

  // Colores para cada tipo de recorrido
  const TRAVERSAL_COLORS = {
    preOrder: "#FFD700", // Amarillo dorado
    inOrder: "#32CD32",  // Verde lima
    postOrder: "#00BFFF" // Azul cielo
  };

  // Función sleep con sonido
  const sleep = async (ms, frequency) => {
    if (frequency && audioEnabled) playTone(frequency);
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // Habilitar audio después de interacción del usuario
  const enableAudio = () => {
    initializeAudio();
    setAudioEnabled(true);
  };

  // Generar array aleatorio
  const generarArray = async () => {
    const { value: n } = await Swal.fire({
      title: 'Generar Array Aleatorio',
      input: 'number',
      inputLabel: 'Número de elementos (máx 100)',
      inputValue: 15,
      inputAttributes: {
        min: 1,
        max: 100,
        step: 1
      },
      showCancelButton: true,
      confirmButtonText: 'Generar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Debes ingresar un número';
        if (value < 1 || value > 100) return 'El número debe estar entre 1 y 100';
      }
    });

    if (n) {
      const nuevoArray = [];
      const uniqueValues = new Set();
      
      // Generar valores únicos para el BST
      while (uniqueValues.size < n) {
        const value = Math.floor(Math.random() * 100) + 1;
        uniqueValues.add(value);
      }
      
      setArray(Array.from(uniqueValues));
      setResultadoRecorrido("");
      setHighlightedNodes([]);
      setVisitedNodes([]);
      setTreeData({});
      mostrarArray(Array.from(uniqueValues));
    }
  };

  // Ingresar array manualmente
  const ingresarArrayManual = async () => {
    const { value: n } = await Swal.fire({
      title: 'Ingresar Array Manualmente',
      input: 'number',
      inputLabel: 'Número de elementos (máx 15)',
      inputValue: 9,
      inputAttributes: {
        min: 1,
        max: 15,
        step: 1
      },
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Debes ingresar un número';
        if (value < 1 || value > 15) return 'El número debe estar entre 1 y 15';
      }
    });

    if (n) {
      const nuevoArray = [];
      const uniqueValues = new Set();
      
      for (let i = 0; i < n; i++) {
        const { value } = await Swal.fire({
          title: `Ingrese el valor para el elemento ${i + 1}`,
          input: 'number',
          inputLabel: `Valor ${i + 1}/${n}`,
          showCancelButton: true,
          confirmButtonText: 'Siguiente',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => {
            if (!value && value !== 0) return 'Debes ingresar un número';
            if (uniqueValues.has(parseInt(value))) return 'Los valores deben ser únicos en un BST';
          }
        });

        if (value === undefined) return; // Usuario canceló
        
        const numValue = parseInt(value);
        uniqueValues.add(numValue);
        nuevoArray.push(numValue);
      }

      setArray(nuevoArray);
      setResultadoRecorrido("");
      setHighlightedNodes([]);
      setVisitedNodes([]);
      setTreeData({});
      mostrarArray(nuevoArray);
    }
  };

  // Mostrar array en un modal grande
  const mostrarArray = (arr) => {
    Swal.fire({
      title: 'Array Generado',
      html: `<div style="font-size: 24px; margin: 20px 0;">[${arr.join(", ")}]</div>`,
      confirmButtonText: 'OK'
    });
  };

  const limpiarTodo = () => {
    setArray([]);
    setTreeData({});
    setResultadoRecorrido("");
    setHighlightedNodes([]);
    setVisitedNodes([]);
    setBST(new BinarySearchTree());
  };

  const dibujarArbol = () => {
    if (!array.length) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No hay datos para dibujar el árbol',
      });
      return;
    }
    
    // Crear un nuevo BST e insertar todos los valores
    const newBST = new BinarySearchTree();
    array.forEach(val => newBST.insert(val));
    setBST(newBST);
    
    // Convertir BST a formato para visualización
    setTreeData(newBST.toD3Tree());
    setHighlightedNodes([]);
    setVisitedNodes([]);
  };

  // Función para animar nodos con sonido
  const animateNode = async (node, colorType) => {
    const nodeId = node.value.toString();
    const color = TRAVERSAL_COLORS[colorType];
    
    // Resaltar nodo actual con sonido
    setHighlightedNodes([nodeId]);
    if (audioEnabled) playTone(300 + (node.value * 10), 0.3);
    
    // Esperar antes de continuar
    await sleep(800);
    
    // Quitar resaltado pero marcar como visitado
    setHighlightedNodes([]);
    setVisitedNodes(prev => [...prev, {id: nodeId, color}]);
    
    // Agregar valor al resultado del recorrido
    setResultadoRecorrido(prev => {
      const currentValue = node.value;
      const prefix = prev.split(":")[0] + ": ";
      return prev === prefix 
        ? `${prefix}${currentValue}` 
        : `${prev} - ${currentValue}`;
    });
  };

  // Recorridos del árbol con sonidos
  const recorrerPreOrder = async () => {
    if (isAnimating || !bst.root) return;
    
    setIsAnimating(true);
    setResultadoRecorrido("Pre-Order: ");
    setVisitedNodes([]);
    
    await bst.preOrder(bst.root, async (node) => {
      await animateNode(node, "preOrder");
    });
    
    setIsAnimating(false);
    if (audioEnabled) playTone(800, 0.5);
  };

  const recorrerInOrder = async () => {
    if (isAnimating || !bst.root) return;
    
    setIsAnimating(true);
    setResultadoRecorrido("In-Order: ");
    setVisitedNodes([]);
    
    await bst.inOrder(bst.root, async (node) => {
      await animateNode(node, "inOrder");
    });
    
    setIsAnimating(false);
    if (audioEnabled) playTone(1000, 0.5);
  };

  const recorrerPostOrder = async () => {
    if (isAnimating || !bst.root) return;
    
    setIsAnimating(true);
    setResultadoRecorrido("Post-Order: ");
    setVisitedNodes([]);
    
    await bst.postOrder(bst.root, async (node) => {
      await animateNode(node, "postOrder");
    });
    
    setIsAnimating(false);
    if (audioEnabled) playTone(1200, 0.5);
  };

  // Exportar el árbol actual a JSON
// Exportar el árbol actual a JSON
const exportarArbol = async () => {
  if (!array.length || !Object.keys(treeData).length) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No hay árbol para exportar',
    });
    return;
  }

  const { value: fileName } = await Swal.fire({
    title: 'Exportar Árbol',
    input: 'text',
    inputLabel: 'Nombre del archivo',
    inputValue: ``,
    showCancelButton: true,
    confirmButtonText: 'Exportar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) return 'Debes ingresar un nombre para el archivo';
    }
  });

  if (!fileName) return; // Usuario canceló

  const dataToExport = {
    array: array,
    treeData: treeData,
    resultadoRecorrido: resultadoRecorrido,
    visitedNodes: visitedNodes
  };

  const dataStr = JSON.stringify(dataToExport, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `${fileName}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

  // Importar árbol desde JSON
  const importarArbol = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const data = JSON.parse(event.target.result);
          
          // Validar los datos importados
          if (!data.array || !Array.isArray(data.array)) {
            throw new Error('Formato de archivo inválido: falta el array');
          }
          
          setArray(data.array);
          if (data.treeData) setTreeData(data.treeData);
          if (data.resultadoRecorrido) setResultadoRecorrido(data.resultadoRecorrido);
          if (data.visitedNodes) setVisitedNodes(data.visitedNodes);
          
          // Reconstruir el BST
          const newBST = new BinarySearchTree();
          data.array.forEach(val => newBST.insert(val));
          setBST(newBST);
          
          Swal.fire({
            icon: 'success',
            title: 'Árbol importado correctamente',
            showConfirmButton: false,
            timer: 1500
          });
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error al importar',
            text: error.message
          });
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  // Estilos personalizados para los nodos (más grandes)
  const renderCustomNode = ({ nodeDatum, toggleNode }) => {
    const isHighlighted = highlightedNodes.includes(nodeDatum.attributes.id);
    const visitedNode = visitedNodes.find(n => n.id === nodeDatum.attributes.id);
    
    // Determinar rotación basada en si es nodo izquierdo o derecho
    const rotation = nodeDatum.attributes.isLeft !== null 
      ? nodeDatum.attributes.isLeft 
        ? "rotate(-10)" 
        : "rotate(10)"
      : "";
  
    const nodeStyle = {
      fill: visitedNode ? visitedNode.color : "#ADD8E6",
      stroke: isHighlighted ? "#FF0000" : "#000000",
      strokeWidth: isHighlighted ? "4px" : "2px",
      r: 25,
      filter: isHighlighted ? "url(#glow)" : "none",
      transition: "all 0.3s ease"
    };
  
    return (
      <g transform={rotation}>
        <circle style={nodeStyle} />
        <text
          fill="black"
          strokeWidth="0.5"
          x="0"
          y="5"
          textAnchor="middle"
          fontSize="16"
          fontWeight="bold"
        >
          {nodeDatum.name}
        </text>
      </g>
    );
  };

  // Centrar el árbol al dibujarlo
  useEffect(() => {
    if (treeContainerRef.current && Object.keys(treeData).length > 0) {
      const dimensions = treeContainerRef.current.getBoundingClientRect();
      setTranslate({
        x: dimensions.width / 2,
        y: 50
      });
    }
  }, [treeData]);

  return (
    <div className="pizarra-container">
      <div className="pizarra-sidebar">
        <h2><FaTree /> Árbol Binario de Búsqueda</h2>
        
        <div className="array-display">
          <h3>Array Actual:</h3>
          <div className="array-values">{array.join(", ") || "Vacío"}</div>
        </div>
        
        <div className="button-group">
          <button 
            onClick={() => {
              enableAudio();
              generarArray();
            }} 
            className="pizarra-btn generate"
          >
            <FaRedo /> Generar Aleatorio
          </button>
          <button 
            onClick={() => {
              enableAudio();
              ingresarArrayManual();
            }} 
            className="pizarra-btn manual"
          >
            <FaKeyboard /> Ingresar Manual
          </button>
          <button 
            onClick={() => {
              enableAudio();
              dibujarArbol();
            }} 
            disabled={!array.length} 
            className="pizarra-btn draw"
          >
            <FaTree /> Dibujar Árbol
          </button>
          <button onClick={limpiarTodo} className="pizarra-btn clear">
            <FaRedo /> Limpiar Todo
          </button>
        </div>
        
        <div className="import-export-group">
          <h3><FaFileImport /> Importar/Exportar:</h3>
          <button 
            onClick={() => {
              enableAudio();
              importarArbol();
            }} 
            className="pizarra-btn-import"
          >
            <FaFileImport /> Importar Árbol
          </button>
          <br />
          <br />
          <button 
            onClick={() => {
              enableAudio();
              exportarArbol();
            }} 
            disabled={!array.length || !Object.keys(treeData).length} 
            className="pizarra-btn-export"
          >
            <FaFileExport /> Exportar Árbol
          </button>
        </div>
        
        <div className="traversal-group">
          <h3><FaPlay /> Recorridos:</h3>
          <button 
            onClick={() => {
              enableAudio();
              recorrerPreOrder();
            }} 
            disabled={!array.length || isAnimating || !Object.keys(treeData).length} 
            className="pizarra-btn pre-order"
            style={{backgroundColor: TRAVERSAL_COLORS.preOrder}}
          >
            Pre-Order
          </button>
          <button 
            onClick={() => {
              enableAudio();
              recorrerInOrder();
            }} 
            disabled={!array.length || isAnimating || !Object.keys(treeData).length} 
            className="pizarra-btn in-order"
            style={{backgroundColor: TRAVERSAL_COLORS.inOrder}}
          >
            In-Order
          </button>
          <button 
            onClick={() => {
              enableAudio();
              recorrerPostOrder();
            }} 
            disabled={!array.length || isAnimating || !Object.keys(treeData).length} 
            className="pizarra-btn post-order"
            style={{backgroundColor: TRAVERSAL_COLORS.postOrder}}
          >
            Post-Order
          </button>
        </div>
      </div>
      
      <div 
        ref={treeContainerRef} 
        className="pizarra-diagram"
        style={{ width: "100%", height: "100%", minHeight: "500px" }}
      >
        {Object.keys(treeData).length > 0 && (
          <Tree
            data={treeData}
            orientation="vertical"
            translate={translate}
            renderCustomNodeElement={renderCustomNode}
            pathFunc={(linkData) => {
              const { source, target } = linkData;
              
              // Si es el nodo raíz, dibuja línea recta hacia abajo
              if (source.data.attributes.isLeft === null) {
                return `M${source.x},${source.y} L${target.x},${target.y}`;
              }
              
              // Para nodos izquierdos, curva más pronunciada a la izquierda
              if (target.data.attributes.isLeft) {
                const controlX = source.x - Math.abs(target.x - source.x) * 0.5;
                const controlY = source.y + (target.y - source.y) * 0.5;
                return `M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`;
              }
              
              // Para nodos derechos, curva más pronunciada a la derecha
              const controlX = source.x + Math.abs(target.x - source.x) * 0.5;
              const controlY = source.y + (target.y - source.y) * 0.5;
              return `M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`;
            }}
            collapsible={false}
            zoom={0.8}
            separation={{ siblings: 1.5, nonSiblings: 2 }}
            svgClassName="tree-svg"
            nodeSize={{ x: 150, y: 100 }} // Ajusta el espaciado entre nodos
          >
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </Tree>
        )}
      </div>
      
      <div className="pizarra-footer">
        <div className="traversal-result">
          <FaList /> <strong>Resultado del Recorrido:</strong>
          <div className="resultado-text">{resultadoRecorrido || "Seleccione un método de recorrido"}</div>
        </div>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color" style={{backgroundColor: TRAVERSAL_COLORS.preOrder}}></span>
            Pre-Order
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{backgroundColor: TRAVERSAL_COLORS.inOrder}}></span>
            In-Order
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{backgroundColor: TRAVERSAL_COLORS.postOrder}}></span>
            Post-Order
          </div>
        </div>
      </div>
    </div>
  );
};

export default PizarraArboles;