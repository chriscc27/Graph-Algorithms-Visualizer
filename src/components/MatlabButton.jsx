import React from "react";
import { motion } from "framer-motion";

const MatlabButton = () => {
  const openMatlabOnline = () => {
    // Abre MATLAB Online en una nueva pestaña
    window.open("https://matlab.mathworks.com/", "_blank", "noopener,noreferrer");
  };

  return (
    <motion.button
      className="cta-button matlab-online"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={openMatlabOnline}
      style={{ 
        backgroundColor: '#0076a3',
        marginTop: '15px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <span className="button-text">Explorar Algoritmos de MATLAB</span>
      <div className="matlab-logo-effect"></div>
    </motion.button>
  );
};

export default MatlabButton;