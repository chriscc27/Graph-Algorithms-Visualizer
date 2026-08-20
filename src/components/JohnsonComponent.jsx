import React, { useEffect, useRef } from "react";
import * as go from "gojs";
import Swal from "sweetalert2";
import "../styles/Pizarra.css";

// Priority Queue para Dijkstra
class PriorityQueue {
  constructor() {
    this.elements = [];
  }

  enqueue(element, priority) {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.elements.shift();
  }

  isEmpty() {
    return this.elements.length === 0;
  }
}

const bellmanFord = (nodes, edges, sourceKey) => {
  const distances = {};
  nodes.forEach(node => distances[node.key] = Infinity);
  distances[sourceKey] = 0;

  for (let i = 0; i < nodes.length - 1; i++) {
    edges.forEach(({ from, to, text }) => {
      const weight = parseInt(text) || 0;
      if (distances[from] + weight < distances[to]) {
        distances[to] = distances[from] + weight;
      }
    });
  }

  edges.forEach(({ from, to, text }) => {
    const weight = parseInt(text) || 0;
    if (distances[from] + weight < distances[to]) {
      throw new Error("¡Ciclo negativo detectado!");
    }
  });

  return distances;
};

const dijkstra = (edges, startNode) => {
  const distances = {};
  const visited = new Set();
  const pq = new PriorityQueue();

  edges.forEach(({ from, to }) => {
    distances[from] = distances[from] || Infinity;
    distances[to] = distances[to] || Infinity;
  });
  distances[startNode] = 0;
  pq.enqueue(startNode, 0);

  while (!pq.isEmpty()) {
    const { element: u, priority: currentDist } = pq.dequeue();
    if (visited.has(u)) continue;
    visited.add(u);

    edges
      .filter(edge => edge.from === u)
      .forEach(({ to, text }) => {
        const weight = parseInt(text) || 0;
        const newDist = currentDist + weight;
        if (newDist < distances[to]) {
          distances[to] = newDist;
          pq.enqueue(to, newDist);
        }
      });
  }

  return distances;
};

const JohnsonComponent = ({ graphData, returnToPizarra }) => {
  const diagramDivRef = useRef(null);
  const diagramInstance = useRef(null);

  useEffect(() => {

    if (!graphData || !graphData.nodeDataArray || !graphData.linkDataArray) {
        Swal.fire({
        icon: "error",
        title: "Datos inválidos",
        text: "El grafo está vacío o no se cargó correctamente.",
        });
        returnToPizarra();
        return;
    }
    if (!graphData || !graphData.nodeDataArray) return;

    const $ = go.GraphObject.make;
    const myDiagram = $(go.Diagram, diagramDivRef.current, {
      "undoManager.isEnabled": false,
    });

    // Plantilla igual que Pizarra
    myDiagram.nodeTemplate = $(
      go.Node,
      "Auto",
      $(go.Shape, "Ellipse", {
        width: 60,
        height: 60,
        strokeWidth: 2,
        fill: "#4CAF50",
      }, new go.Binding("fill", "color")),
      $(go.TextBlock, {
        font: "bold 14px sans-serif",
        stroke: "white",
        margin: 8,
      }, new go.Binding("text", "text"))
    );

    myDiagram.linkTemplate = $(
      go.Link,
      $(go.Shape, { strokeWidth: 2, stroke: "#2196F3" }),
      $(go.Shape, { toArrow: "Standard", fill: "#2196F3" }),
      $(go.TextBlock, 
        { segmentOffset: new go.Point(0, -10) },
        new go.Binding("text", "text")
      )
    );

    try {
      // Paso 1: Añadir nodo ficticio
      const q = { key: "q", text: "q", color: "#666" };
      const nodes = [...graphData.nodeDataArray, q];
      const edges = [
        ...graphData.linkDataArray,
        ...graphData.nodeDataArray.map(n => ({
          from: "q",
          to: n.key,
          text: "0",
          color: "#999"
        }))
      ];

      // Paso 2: Bellman-Ford
      const h = bellmanFord(nodes, edges, "q");

      // Paso 3: Re-pesar aristas
      const reweightedEdges = graphData.linkDataArray.map(edge => ({
        ...edge,
        text: (parseInt(edge.text) + h[edge.from] - h[edge.to]).toString(),
      }));

      // Paso 4: Dijkstra para cada nodo
      const allPaths = {};
      graphData.nodeDataArray.forEach(node => {
        allPaths[node.key] = dijkstra(reweightedEdges, node.key);
      });

      // Actualizar modelo
      myDiagram.model = new go.GraphLinksModel({
        nodeDataArray: graphData.nodeDataArray.map(n => ({
          ...n,
          text: `${n.text} (h=${h[n.key]})`,
          color: "#4CAF50"
        })),
        linkDataArray: reweightedEdges,
      });

      diagramInstance.current = myDiagram;

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error en Johnson",
        text: error.message,
      });
      returnToPizarra();
    }

    return () => {
      if (myDiagram) myDiagram.div = null;
    };
  }, [graphData]);

  return (
    <div className="contenedor">
      <button className="btn-regresar" onClick={returnToPizarra}>
        ← Volver a Pizarra
      </button>
      <div className="pizarra" ref={diagramDivRef}></div>
    </div>
  );
};

export default JohnsonComponent;