import { useState } from "react";
import { FaEdit, FaTrash, FaPalette, FaSave } from "react-icons/fa";
import "../styles/Opciones.css"; // Importa el archivo de estilos


const Opciones = () => {
    const [color, setColor] = useState("#48c9b0");

    const cambiarColor = () => {
        const colores = ["#48c9b0", "#f39c12", "#9b59b6", "#e74c3c", "#1abc9c"];
        setColor(colores[Math.floor(Math.random() * colores.length)]);
    };
    const saveDiagram = (diagramInstance, diagramDivRef, onSave) => {
        if (!diagramInstance.current) return;
        const jsonData = diagramInstance.current.model.toJson();
        localStorage.setItem("diagramaGuardado", jsonData);
        Swal.fire({
            icon: "success",
            title: "Diagrama guardado",
            text: "El diagrama ha sido guardado exitosamente.",
        });
        if (onSave) {
            onSave(jsonData);
        }
    };
    return (
        <div className="opciones-container">
            <button className="opcion-btn opcion-editar">
                <FaEdit /> Editar
            </button>
            <button className="opcion-btn opcion-borrar">
                <FaTrash /> Borrar
            </button>
            <button
                className="opcion-btn opcion-cambiar"
                style={{ background: `linear-gradient(145deg, ${color}, #16a085)` }}
                onClick={cambiarColor}
            >
                <FaPalette /> Cambiar Color
            </button>
            <button className="opcion-btn opcion-guardar" onClick={() => saveDiagram(diagramInstance, diagramDivRef, onSave)}>
                <FaSave /> Guardar Diagrama
            </button>
        </div>
    );
};

export default Opciones;
