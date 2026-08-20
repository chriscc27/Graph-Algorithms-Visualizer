import JSZip from "jszip";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Swal from "sweetalert2";

export const exportAsPng = async (diagramDivRef) => {
  const { value: fileName } = await Swal.fire({
    title: 'Guardar como PNG',
    input: 'text',
    inputLabel: 'Nombre del archivo',
    inputValue: 'diagrama',
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Debe ingresar un nombre para el archivo';
      }
    },
  });

  if (fileName) {
    const canvas = await html2canvas(diagramDivRef.current, {
      backgroundColor: null,
      scale: 2,
    });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `${fileName}.png`;
    link.click();
  }
};

export const exportAsPdf = async (diagramDivRef) => {
  const { value: fileName } = await Swal.fire({
    title: 'Guardar como PDF',
    input: 'text',
    inputLabel: 'Nombre del archivo',
    inputValue: 'diagrama',
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Debe ingresar un nombre para el archivo';
      }
    },
  });

  if (fileName) {
    const canvas = await html2canvas(diagramDivRef.current, {
      backgroundColor: null,
      scale: 3,
    });
    const image = canvas.toDataURL("image/png");
    const pdfWidth = canvas.width / 3.5;
    const pdfHeight = canvas.height / 3.5;
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
      unit: "px",
      format: [pdfWidth, pdfHeight],
    });
    pdf.addImage(image, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
  }
};

export const exportAsJson = async (diagramModelJson) => {
  // Mostrar un cuadro de diálogo para que el usuario ingrese el nombre del archivo
  const { value: nombreArchivo } = await Swal.fire({
    title: 'Guardar como JSON',
    input: 'text',
    inputLabel: 'Nombre del archivo',
    inputValue: 'diagrama', // Valor predeterminado
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Debes ingresar un nombre para el archivo';
      }
    },
  });

  // Si el usuario cancela, no hacemos nada
  if (!nombreArchivo) {
    return;
  }

  // Asegurarnos de que el archivo tenga la extensión .json
  const nombreFinal = nombreArchivo.endsWith(".json") ? nombreArchivo : `${nombreArchivo}.json`;

  // Creamos un Blob con los datos del diagrama
  const blob = new Blob([diagramModelJson], { type: "application/json" });

  // Guardamos el archivo con el nombre proporcionado por el usuario
  saveAs(blob, nombreFinal);

  // Mostrar un mensaje de éxito
  Swal.fire({
    icon: 'success',
    title: 'Guardado correctamente',
    text: `El archivo "${nombreFinal}" se ha guardado correctamente.`,
  });
};

export const saveDiagramAsZip = async (diagramDivRef, diagramModelJson) => {
  const { value: fileName } = await Swal.fire({
    title: 'Guardar como ZIP',
    input: 'text',
    inputLabel: 'Nombre del archivo',
    inputValue: 'diagrama_comprimido',
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Debe ingresar un nombre para el archivo';
      }
    },
  });

  if (fileName) {
    const canvas = await html2canvas(diagramDivRef.current, {
      backgroundColor: null,
      scale: 3,
    });
    const screenshot = canvas.toDataURL("image/png");
    const zip = new JSZip();
    zip.file("diagram.png", screenshot.split(",")[1], { base64: true });
    const pdf = new jsPDF();
    pdf.addImage(screenshot, "PNG", 10, 10, 190, 100);
    const pdfBlob = pdf.output("blob");
    zip.file("diagram.pdf", pdfBlob);
    zip.file("diagram.json", diagramModelJson);
    const content = await zip.generateAsync({ type: "blob" });
    const nombreFinal = fileName.endsWith(".zip") ? fileName : `${fileName}.zip`;
    saveAs(content, nombreFinal);
  }
};

export const calculateAdjacencyMatrix = (nodes, links) => {
  const adjacencyMatrix = nodes.map(() => Array(nodes.length).fill(0));
  links.forEach((link) => {
    const fromNodeIndex = nodes.findIndex((node) => node.key === link.from);
    const toNodeIndex = nodes.findIndex((node) => node.key === link.to);
    if (fromNodeIndex !== -1 && toNodeIndex !== -1) {
      adjacencyMatrix[fromNodeIndex][toNodeIndex] = link.label || 0;
    }
  });
  const nodeNames = nodes.map((node) => node.text || `Nodo ${node.key}`);
  return { adjacencyMatrix, nodeNames };
};

export const obtenerValorArista = async () => {
  const { value: text } = await Swal.fire({
    title: "Ingrese el valor de la arista",
    input: "text",
    inputAttributes: {
      pattern: "[0-9]*",
      inputmode: "numeric",
    },
    showCancelButton: true,
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    inputValidator: (value) => {
      if (!value) {
        return "Debe ingresar un valor numérico";
      }
      if (isNaN(value)) {
        return "El valor debe ser un número";
      }
    },
  });
  return text ? parseInt(text, 10) : null;
};