import React, { useRef, useState, useEffect } from "react";
import Header from "./components/Header";
import PizarraAsignacion from "./components/PizarraAsignacion";
import PizarraJohnson from "./components/PizarraJhonson"; // Corregir nombre
import PizarraNorthwest from "./components/PizarraNorthwest";
//import PizarraNorthwest from './components/TransportSolver/TransportSolver';
import Footer from "./components/Footer";
import SortingVisualizer from "./components/SortingVisualizer";
import Home from "./components/Home";
import Pizarra from "./components/Pizarra";
import PizarraArboles from './components/PizarraArboles';
import Workshop from "./components/Workshop";
import PizarraDijkstra from './components/PizarraDijkstra';
import PizarraKruskal from './components/PizarraKruskal';
import Program from "./components/Program"; // Importa el componente Program
import "./App.css";

const App = () => {
  const [showHome, setShowHome] = useState(true);
  const [currentView, setCurrentView] = useState('Home');
  
  // Referencias para todos los componentes
  const mainContentRef = useRef(null);
  const pizarraRef = useRef(null);
  const pizarraAsignacionRef = useRef(null);
  const pizarraJohnsonRef = useRef(null); // Corregir nombre
  const pizarraNorthwestRef = useRef(null);
  const sortingVisualizerRef = useRef(null);
  const pizarraArbolesRef = useRef(null); 
  const pizarraDijkstraRef = useRef(null); // Cambia esto si tienes una referencia diferente
  const pizarraKruskalRef = useRef(null); // Cambia esto si tienes una referencia diferente     
  const ProgramRef = useRef(null); // Cambia esto si tienes una referencia diferente
  // Nueva referencia para árboles

  const onViewChange = (view) => {
    setCurrentView(view);
  };

  const handleViewChange = (viewName) => {
    if (viewName === "Home") {
      setShowHome(true);
    } else {
      setShowHome(false);
      setCurrentView(viewName);
    }
    
    // Scroll al inicio
    window.scrollTo(0, 0);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
  };
  
  const handleStartExploring = () => {
    setShowHome(false);
    window.scrollTo(0, 0);
  };

  // Funciones comunes para todas las pizarras
  const handleExportar = (format) => {
    const ref = getCurrentRef();
    if (ref?.current?.saveDiagram) {
      ref.current.saveDiagram(format);
    }
  };

  const handleLimpiar = () => {
    const ref = getCurrentRef();
    if (ref?.current?.limpiarDiagrama) {
      ref.current.limpiarDiagrama();
    }
  };

  const handleImportar = (jsonData) => {
    const ref = getCurrentRef();
    if (ref?.current?.importarF) {
      ref.current.importarF(jsonData);
    }
  };

  const handleEliminar = () => {
    const ref = getCurrentRef();
    if (ref?.current?.eliminarNodoSeleccionado) {
      ref.current.eliminarNodoSeleccionado();
    }
  };

  const getCurrentRef = () => {
    switch(currentView) {
      case "Pizarra": return pizarraRef;
      case "PizarraAsignacion": return pizarraAsignacionRef;
      case "PizarraJohnson": return pizarraJohnsonRef;
      case "PizarraNorthwest": return pizarraNorthwestRef;
      case "SortingVisualizer": return sortingVisualizerRef;
      case "PizarraArboles": return pizarraArbolesRef;
      case "PizarraDijkstra": return pizarraRef; // Cambia esto si tienes una referencia diferente
      case "PizarraKruskal": return pizarraRef; // Cambia esto si tienes una referencia diferente
      case "Program": return ProgramRef; // No necesitas referencia para Program
      default: return null;
    }
  };

  useEffect(() => {
    if (!showHome) {
      window.scrollTo(0, 0);
      if (mainContentRef.current) {
        mainContentRef.current.scrollTo(0, 0);
      }
    }
  }, [currentView, showHome]);

  return (
    <div className="app-container">
      {showHome ? (
        <Home 
          onStartExploring={handleStartExploring}
          onViewChange={handleViewChange}
        />
      ) : currentView === "Workshop" ? (
        // Vista Workshop sin Header ni Footer
        <Workshop onViewChange={handleViewChange} />
      ) : (
        <>
          {/* Renderizar el Header solo si no estamos en Home, Workshop o Program */}
          {currentView !== "Program" && !showHome && currentView !== "Workshop" && (
            <Header
              onViewChange={handleViewChange}
              currentView={currentView}
              onExportar={handleExportar}
              onLimpiar={handleLimpiar}
              onImportar={handleImportar}
              onEliminar={handleEliminar}
            />
          )}
          <main className="main-content" ref={mainContentRef}>
            {currentView === "Pizarra" && <Pizarra ref={pizarraRef} />}
            {currentView === "PizarraAsignacion" && <PizarraAsignacion ref={pizarraAsignacionRef} />}
            {currentView === "PizarraJohnson" && <PizarraJohnson ref={pizarraJohnsonRef} />}
            {currentView === "PizarraNorthwest" && <PizarraNorthwest ref={pizarraNorthwestRef} />}
            {currentView === "SortingVisualizer" && <SortingVisualizer ref={sortingVisualizerRef} />}
            {currentView === "PizarraArboles" && <PizarraArboles ref={pizarraArbolesRef} />}
            {currentView === "PizarraDijkstra" && <PizarraDijkstra />}
            {currentView === "PizarraKruskal" && <PizarraKruskal />}
            {currentView === "Workshop" && <Workshop onViewChange={handleViewChange} />}
            {currentView === "Program" && <Program />}
          </main>
          <Footer />
        </>
      )}
    </div>
  );
};

export default App;