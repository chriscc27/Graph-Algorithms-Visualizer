import React from "react";
import "../styles/Header.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faProjectDiagram, faFileExport, faFileImport, faTrash, faBroom } from "@fortawesome/free-solid-svg-icons";
import Ayuda from "./Ayuda";
import { motion } from "framer-motion";

const Header = ({ 
  onViewChange, 
  currentView,
  onExportar,
  onLimpiar,
  onImportar,
  onEliminar 
}) => {
  const handleExportClick = (format) => {
    if (onExportar) onExportar(format);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          if (onImportar) onImportar(jsonData);
        } catch (error) {
          console.error("Error parsing JSON file:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="header">
      <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
        <motion.button
          className="btn-algoritmo"
          onClick={() => onViewChange('Home')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          style={{ marginRight: '20px' }}
        >
          <span>Home</span>
        </motion.button>
      </div>

      <div className="header-buttons">

        <motion.button 
          className={`btn-algoritmo ${currentView === 'PizarraJohnson' ? 'active' : ''}`}
          onClick={() => onViewChange('PizarraJohnson')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <FontAwesomeIcon icon={faProjectDiagram} className="btn-icon" />
          <span>Johnson</span>
        </motion.button>

        <motion.button 
          className={`btn-algoritmo ${currentView === 'PizarraAsignacion' ? 'active' : ''}`}
          onClick={() => onViewChange('PizarraAsignacion')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <FontAwesomeIcon icon={faProjectDiagram} className="btn-icon" />
          <span>Asignacion</span>
        </motion.button>

        <motion.button 
          className={`btn-algoritmo ${currentView === 'PizarraNorthwest' ? 'active' : ''}`}
          onClick={() => onViewChange('PizarraNorthwest')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <FontAwesomeIcon icon={faProjectDiagram} className="btn-icon" />
          <span>Northwest</span>
        </motion.button>
        
        <motion.button 
          className={`btn-algoritmo ${currentView === 'SortingVisualizer' ? 'active' : ''}`}
          onClick={() => onViewChange('SortingVisualizer')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <FontAwesomeIcon icon={faProjectDiagram} className="btn-icon" />
          <span>Ordenamiento</span>
        </motion.button>
        <motion.button 
          className={`btn-algoritmo ${currentView === 'PizarraArboles' ? 'active' : ''}`}
          onClick={() => onViewChange('PizarraArboles')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <FontAwesomeIcon icon={faProjectDiagram} className="btn-icon" />
          <span>Arboles</span>
        </motion.button>

        <motion.button 
          className={`btn-algoritmo ${currentView === 'PizarraDijkstra' ? 'active' : ''}`}
          onClick={() => onViewChange('PizarraDijkstra')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <FontAwesomeIcon icon={faProjectDiagram} className="btn-icon" />
          <span>Dijkstra</span>
        </motion.button>

        <motion.button 
          className={`btn-algoritmo ${currentView === 'PizarraKruskal' ? 'active' : ''}`}
          onClick={() => onViewChange('PizarraKruskal')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <FontAwesomeIcon icon={faProjectDiagram} className="btn-icon" />
          <span>Kruskal</span>
        </motion.button>

      </div>
    </header>
  );
};

export default Header;