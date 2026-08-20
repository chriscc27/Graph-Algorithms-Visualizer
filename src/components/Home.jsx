import React, { useRef, useState } from "react"; // Añade useState aquí
import { motion, AnimatePresence } from "framer-motion"; // Asegúrate de importar AnimatePresence
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from 'swiper/modules';
import MatlabButton from "./MatlabButton";
import "swiper/css";
import "../styles/Home.css";

import grafosImg from "../assets/grafos.png";
import johnsonImg from "../assets/johnson.png";
import asignacionImg from "../assets/asignacion.png";
import northwestImg from "../assets/northwest.png";
import ordenamientoImg from "../assets/ordenamiento.png";

import christianImg from "../assets/christian.png";
import leonardoImg from "../assets/leonardo.png";
import alanImg from "../assets/alan.png";
import marvinImg from "../assets/marvin.png";
import carlosImg from "../assets/carlos.png";
import senkataAudio from "../assets/senkata.mp3";
import guerraAudio from "../assets/guerra.mp3";
import githubLogo from "../assets/github.png";
import linkedinLogo from "../assets/linkedin.png";
import twitterLogo from "../assets/twitter.png";
import mapPinIcon from "../assets/map-pin.png";
import phoneIcon from "../assets/phone.png";
import Arboles from "../assets/Arboles.png";
const teamMembers = [
  { 
    name: "Christian Coronel", 
    img: christianImg, 
    role: "Héroe 7",
    email: "christian.coronel@ucb.edu.bo" 
  },
  { 
    name: "Leonardo Delgado", 
    img: leonardoImg, 
    role: "Héroe 0.37",
    email: "leonardo.delgado@ucb.edu.bo" 
  },
  { 
    name: "Alan Flores", 
    img: alanImg, 
    role: "Héroe 17",
    email: "alan.flores.c@ucb.edu.bo" 
  },
  { 
    name: "Marvin Mollo", 
    img: marvinImg, 
    role: "Leder",
    email: "marvin.mollo@ucb.edu.bo" 
  },
  { 
    name: "Carlos Pacoricona", 
    img: carlosImg, 
    role: "Héroe 69",
    email: "carlos.pacoricona@ucb.edu.bo" 
  },
];

const algorithms = [
    { 
        name: "Grafos", 
        description: "Representación visual de nodos y aristas.", 
        img: grafosImg,
        view: "Pizarra" // Asegúrate de que este valor sea correcto
    },
    { 
        name: "Johnson", 
        description: "Caminos más cortos entre nodos.", 
        img: johnsonImg,
        view: "PizarraJohnson" // Este valor debe coincidir con el nombre de la vista
    },
    { 
        name: "Asignación", 
        description: "Optimización en problemas de asignación.", 
        img: asignacionImg,
        view: "PizarraAsignacion" // Este valor debe coincidir con el nombre de la vista
    },
    { 
        name: "NorthWest", 
        description: "Método de transporte para costos.", 
        img: northwestImg,
        view: "Pizarra"
    },
    { 
        name: "Ordenamiento", 
        description: "Shell Sort, Merge Sort, Insertion y Selection", 
        img: ordenamientoImg,
        view: "SortingVisualizer"
    },
    { 
        name: "Árboles Binarios", 
        description: "Recorridos Pre-order, In-order y Post-order.", 
        img: Arboles, // Puedes cambiar esta imagen por una específica para árboles
        view: "PizarraArboles"
    },
];

const Home = ({ onStartExploring, onViewChange }) => {
  const swiperRef = useRef(null);
  const audioRef = useRef(null);
  const guerraAudioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTransition, setShowTransition] = useState(false); // Nuevo estado para la transición

  const handleAlgorithmClick = (viewName) => {
    onStartExploring(); // Oculta el Home
    onViewChange(viewName); // Cambia a la vista correspondiente
  };

  const handleExploreClick = () => {
    setShowTransition(true); // Mostrar la animación de transición

    if (audioRef.current) {
        audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(e => console.error("Error al reproducir audio:", e));
    }

    setTimeout(() => {
        setShowTransition(false); // Ocultar la animación después de 3 segundos
        onStartExploring(); // Ocultar el Home
        onViewChange("Pizarra"); // Cambiar a la vista de algoritmos
    }, 3000); // Duración de la animación (3 segundos)
  };

  const handleMouseEnter = () => {
    if (audioRef.current) {
      if (!isPlaying) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.error("Error al reproducir audio:", e));
      }
    }
  };

  const handleMouseLeave = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="home-container">
      <audio 
        ref={audioRef} 
        src={senkataAudio} 
        preload="auto" 
        onEnded={() => setIsPlaying(false)}
      />

      <audio 
        ref={guerraAudioRef} 
        src={guerraAudio} 
        preload="auto"
      />

      {/* Animación de transición */}
      <AnimatePresence>
        {showTransition && (
          <motion.div
            className="transition-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="transition-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 1,
                delay: 0.3
              }}
            >
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Preparando la experiencia...
              </motion.h2>
              
              <motion.div 
                className="loading-bar"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, delay: 0.8 }}
              />
              
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Los Héroes de Senkata están listos
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <motion.section 
        className="hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="hero-content"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Explora la magia de los algoritmos <br/> con los Héroes de Senkata
          </motion.h1>

          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Visualiza y experimenta algoritmos de optimización de manera interactiva
          </motion.p>

          <motion.button 
            className="cta-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExploreClick}
          >
            Explorar Algoritmos
          </motion.button>
          <br />
          <MatlabButton />
        </motion.div>
      </motion.section>

      {/* Workshop Button */}
      <motion.div 
        className="workshop-button-container"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.button
          className="workshop-button"
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 0 25px rgba(255,130,0,0.4)"
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewChange("Workshop")}
        >
          <span className="button-text">WORKSHOP</span>
          <div className="button-gradient"></div>
        </motion.button>
      </motion.div>

      {/* Sobre Nosotros */}
      <motion.section 
        className="about-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <h2>Sobre Nosotros</h2>
        <p className="section-description">Somos un equipo apasionado por el desarrollo y queremos hacer que el aprendizaje de algoritmos sea visual, interactivo y entretenido.</p>
        <div className="team">
          {teamMembers.map((member, index) => (
            <motion.div 
              key={index}
              className="team-card"
              whileHover={{ 
                y: -10,
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)"
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}            
              >
              <div className="team-image-container">
              <motion.img 
                  src={member.img} 
                  alt={member.name}
                  className="team-image"
                  whileHover={{ scale: 1.03 }}
                />
                <img src={member.img} alt={member.name} className="team-image" />
              </div>
              <div className="team-info">
                <h3 className="team-name">{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <a 
                  href={`mailto:${member.email}`} 
                  className="team-email"
                  onClick={(e) => e.stopPropagation()} // Evita que el clic se propague al contenedor
                >
                  {member.email}
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Galería de Algoritmos */}
      <motion.section 
        className="algorithms-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2>Galería de Algoritmos</h2>
        
        <div 
          className="swiper-container-wrapper"
          
          onMouseEnter={() => swiperRef.current?.autoplay?.stop()}
          onMouseLeave={() => swiperRef.current?.autoplay?.start()}
        >
          <Swiper 
            modules={[Autoplay]}
            spaceBetween={30} 
            slidesPerView={3}
            autoplay={{
              delay: 1000,
              disableOnInteraction: false,
            }}
            loop={true}
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            breakpoints={{
              320: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 }
            }}
            centeredSlides={true}
          >
            {algorithms.map((algo, index) => (
              <SwiperSlide key={index}>
                <motion.div 
                  className="algorithm-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="algorithm-icon-container">
                    <img 
                      src={algo.img} 
                      alt={algo.name} 
                      className="algorithm-icon"
                      loading="lazy"
                    />
                  </div>
                  <div className="algorithm-content">
                    <h3>{algo.name}</h3>
                    <p>{algo.description}</p>
                    <div className="view-button-container">
                      <motion.button 
                        className="view-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAlgorithmClick(algo.view)}
                      >
                        Ver Algoritmo
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </motion.section>

      {/* Contacto */}
      <motion.section 
        className="contact-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="contact-content">
          <div className="footer-grid">
            {/* Columna 1: Información de contacto */}
            <div className="footer-column">
              <h3 className="footer-title">
                <img src={mapPinIcon} alt="Ubicación" className="section-icon" />
                Ubicación
              </h3>
              <motion.a 
                href="https://maps.app.goo.gl/5yX5nmTt9heKXYPB8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="contact-link"
                whileHover={{ x: 5 }}
              >
                <div className="contact-item">
                  <span className="contact-text">Puente de Senkata</span>
                  <span className="link-arrow">→</span>
                </div>
              </motion.a>
              
              <h3 className="footer-title" style={{ marginTop: "1.5rem" }}>
                <img src={phoneIcon} alt="Contacto" className="section-icon" />
                Contacto
              </h3>
              <motion.a 
                href="https://wa.me/59170104646" 
                target="_blank" 
                rel="noopener noreferrer"
                className="contact-link"
                whileHover={{ x: 5 }}
              >
                <div className="contact-item">
                  <span className="contact-text">+591 70104646</span>
                  <span className="link-arrow">→</span>
                </div>
              </motion.a>
            </div>

            {/* Columna 2: Redes sociales */}
            <div className="footer-column">
              <h3 className="footer-title">Conecta con nosotros</h3>
              <div className="social-grid">
                <motion.a 
                  href="https://github.com/tu-usuario" 
                  className="social-card"
                  whileHover={{ y: -5 }}
                >
                  <img src={githubLogo} alt="GitHub" className="social-logo" />
                  <span className="social-name">GitHub</span>
                  <span className="social-handle">@heroes-senkata</span>
                </motion.a>
                
                <motion.a 
                  href="https://linkedin.com/company/tu-empresa" 
                  className="social-card"
                  whileHover={{ y: -5 }}
                >
                  <img src={linkedinLogo} alt="LinkedIn" className="social-logo" />
                  <span className="social-name">LinkedIn</span>
                  <span className="social-handle">Héroes de Senkata</span>
                </motion.a>
                
                <motion.a 
                  href="https://twitter.com/tu-usuario" 
                  className="social-card"
                  whileHover={{ y: -5 }}
                >
                  <img src={twitterLogo} alt="Twitter" className="social-logo" />
                  <span className="social-name">Twitter</span>
                  <span className="social-handle">@senkata_heroes</span>
                </motion.a>
              </div>
            </div>

            {/* Columna 3: Mapa interactivo */}
            <div className="footer-column">
              <h3 className="footer-title">Nuestra ubicación</h3>
              <motion.div 
                className="map-container"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <iframe
                  title="mapa-senkata"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3825.607054033924!2d-68.1937496857202!3d-16.504999088615536!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDMwJzE4LjAiUyA2OMKwMTEnMjkuNyJX!5e0!3m2!1ses!2sbo!4v1622583746788!5m2!1ses!2sbo"
                  className="map-iframe"
                  allowFullScreen
                  loading="lazy"
                />
              </motion.div>
              <div className="map-footer">
                <div className="map-schedule">
                  <span>🕒 Horario:</span>
                  <span>Lun-Vie: 8:00 - 18:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Línea divisoria */}
          <motion.div 
            className="footer-divider"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Créditos */}
          <div className="footer-credits">
            <motion.div 
              className="tech-stack"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
            >
              <span>Tecnologías utilizadas:</span>
              <div className="tech-icons">
                <img src="https://img.icons8.com/color/48/react-native.png" alt="React" />
              </div>
            </motion.div>
            <p>© 2025 Héroes de Senkata - Todos los derechos reservados</p>
            <p>Hecho con amor, YamilBot y un poco de Jack Daniel's debajo del puente de Senkata🤙🤙🤙</p>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;