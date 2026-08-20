import React, { useState } from "react";
import "../styles/Ayuda.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

// Importa las imágenes
import crearNodo from "../assets/crear-nodo.png";
import crearArista from "../assets/crear-arista.png";
import editarNodo from "../assets/editar-nodo.png";
import eliminarNodo from "../assets/eliminar-nodo.png";
import guardarDiagrama from "../assets/guardar-diagrama.png";
import moverNodo from "../assets/mover-nodo.png";

const Ayuda = () => {
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const toggleAyuda = () => {
    setMostrarAyuda(!mostrarAyuda);
  };

  return (
    <div className="ayuda-container">
      <motion.button 
        className="btn-algoritmo"
        onClick={toggleAyuda}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <FontAwesomeIcon icon={faQuestionCircle} className="btn-icon" />
        <span>Ayuda</span>
      </motion.button>

      {mostrarAyuda && (
        <div className="ventana-ayuda">
          <h2>Guía de Usuario</h2>
          <ul>
            <li className="instruccion">
              <img src={crearNodo} alt="Crear Nodo" className="imagen-instruccion" />
              <div>
                <strong>Crear Nodo:</strong> Haz doble clic en cualquier área vacía del pizarrón para crear un nuevo nodo.
              </div>
            </li>
            <li className="instruccion">
              <img src={crearArista} alt="Crear Arista" className="imagen-instruccion" />
              <div>
                <strong>Crear Arista:</strong> Arrastra desde el extremo de un nodo a otro para crear una arista.
              </div>
            </li>
            <li className="instruccion">
              <img src={moverNodo} alt="Mover Nodo" className="imagen-instruccion" />
              <div>
                <strong>Mover Nodo:</strong> Manten presionado el click izquierdo y arrastra un nodo para moverlo a una nueva posición en el pizarrón.
              </div>
            </li>
            <li className="instruccion">
              <img src={editarNodo} alt="Editar Nodo" className="imagen-instruccion" />
              <div>
                <strong>Editar Nodo:</strong> Haz doble clic encima del nombre de un nodo para editar su texto.
              </div>
            </li>
            <li className="instruccion">
              <img src={eliminarNodo} alt="Eliminar Nodo" className="imagen-instruccion" />
              <div>
                <strong>Eliminar Nodo/Enlace:</strong> Selecciona un nodo o enlace y presiona la tecla "Supr" o "Delete".
              </div>
            </li>
            <li className="instruccion">
              <img src={guardarDiagrama} alt="Guardar Diagrama" className="imagen-instruccion" />
              <div>
                <strong>Guardar Diagrama:</strong> Utiliza el botón "Guardar Diagrama" para exportar tu trabajo.
              </div>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Ayuda;