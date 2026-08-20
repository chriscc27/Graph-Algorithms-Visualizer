import { motion, AnimatePresence } from "framer-motion";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import { useCallback, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import "../styles/Workshop.css";
import { FaMapMarkedAlt, FaRoute, FaUserClock, FaLaptopCode, FaMapMarkerAlt, FaInfoCircle, FaCheckCircle, FaPencilRuler } from "react-icons/fa";

const images = {
  hero: "/src/assets/workshop/map.jpg",
  map: "/src/assets/workshop/map.jpg",
  turismo1: "/src/assets/workshop/turismo1.jpg",
  turismo2: "/src/assets/workshop/turismo2.jpg",
  turismo3: "/src/assets/workshop/turismo3.jpg",
};

const carouselSlides = [
  {
    img: "/src/assets/workshop/carousel1.jpg",
    title: "Vive La Paz de forma inteligente",
    desc: "Rutas personalizadas, información relevante y una experiencia digital de primer nivel."
  },
  {
    img: "/src/assets/workshop/carousel2.jpg",
    title: "Optimiza tu tiempo de viaje",
    desc: "Descubre los mejores lugares y maximiza cada minuto en la ciudad maravilla."
  },
  {
    img: "/src/assets/workshop/carousel3.jpg",
    title: "Tecnología y turismo unidos",
    desc: "Nuestra plataforma utiliza algoritmos avanzados para sugerir recorridos únicos."
  }
];

const benefits = [
  {
    icon: <FaRoute size={28} color="#5dbcff" />,
    title: "Rutas Personalizadas",
    desc: "Optimiza tu recorrido según tus intereses y tiempo disponible."
  },
  {
    icon: <FaMapMarkedAlt size={28} color="#5dbcff" />,
    title: "Explora con Inteligencia",
    desc: "Descubre los puntos turísticos más emblemáticos de La Paz con información relevante y actualizada."
  },
  {
    icon: <FaUserClock size={28} color="#5dbcff" />,
    title: "Ahorra Tiempo",
    desc: "Planifica tu visita y maximiza cada minuto en la ciudad maravilla."
  }
];

const infoCards = [
  {
    title: "¿Por qué QhatuMap?",
    icon: <FaInfoCircle size={24} color="#5dbcff" />,
    content: "La Paz es un destino vibrante, pero la falta de herramientas digitales centralizadas dificulta la experiencia del visitante. QhatuMap integra tecnología, rutas óptimas y una interfaz amigable para turistas y locales.",
    image: images.turismo1
  },
  {
    title: "Nuestra Solución",
    icon: <FaCheckCircle size={24} color="#5dbcff" />,
    content: "Ofrecemos una plataforma web que utiliza algoritmos avanzados para sugerir recorridos personalizados, mostrar información relevante y facilitar la exploración de la ciudad de manera eficiente y segura.",
    image: images.turismo2
  },
  {
    title: "Visión",
    icon: <FaPencilRuler size={24} color="#5dbcff" />,
    content: "Convertirnos en la referencia digital del turismo paceño, conectando cultura, tecnología y experiencias únicas para cada usuario.",
    image: images.turismo3
  }
];

const techStack = [
  { icon: <FaRoute />, name: "Dijkstra", desc: "Rutas óptimas entre puntos turísticos" },
  { icon: <FaMapMarkedAlt />, name: "Geo-localización", desc: "Ubicación precisa de lugares de interés" },
  { icon: <FaLaptopCode />, name: "React", desc: "Interfaz moderna y responsiva" }
];

const introAccordionData = [
  {
    key: 'intro',
    title: 'Introducción',
    icon: <FaInfoCircle size={32} color="#5dbcff" />,
    image: images.turismo1,
    content: `Actualmente, el turismo en la ciudad de La Paz se ve limitado por la falta de herramientas digitales centralizadas que ofrezcan información clara, actualizada y útil sobre los principales atractivos turísticos, rutas recomendadas y eventos culturales. Esta carencia obliga a los visitantes a buscar datos en diversas fuentes, muchas veces incompletas o desactualizadas, lo que dificulta la planificación de una experiencia turística eficiente y satisfactoria.`
  },
  {
    key: 'problema',
    title: 'Problema Central',
    icon: <FaMapMarkerAlt size={32} color="#5dbcff" />,
    image: images.turismo2,
    content: `La ciudad de La Paz carece de una guía turística virtual confiable debido a la escasa inversión en turismo digital y la débil articulación entre guías locales y tecnología. Un estudio de la UMSA muestra que las iniciativas digitales no reciben el respaldo necesario para sostenerse, mientras que desde Unifranz se destaca que los guías enfrentan dificultades para adaptarse a herramientas tecnológicas por falta de formación. Aunque existen esfuerzos como campañas de promoción turística y tours virtuales, estos son limitados y no cubren la necesidad de una plataforma integral actualizada para los visitantes.`
  },
  {
    key: 'objetivoGeneral',
    title: 'Objetivo General',
    icon: <FaCheckCircle size={28} color="#5dbcff" />,
    image: images.turismo3,
    content: `Proponer una página web de turismo centrado en la ciudad de La Paz para optimizar rutas y tiempo en la visita de lugares turisticos.`
  },
  {
    key: 'objetivosEspecificos',
    title: 'Objetivos Específicos',
    icon: <FaPencilRuler size={28} color="#5dbcff" />,
    image: images.turismo1,
    content: (
      <ol className="workshop-objetivos-list">
        <li>Identificar los principales puntos turísticos de la ciudad maravilla de La Paz, para facilitar la planificación de recorridos turísticos informados y atractivos.</li>
        <li>Implementar el algoritmo de kruskal para calcular rutas óptimas entre los sitios turísticos según distancia o tiempo, para optimizar la experiencia del visitante al reducir tiempos de traslado.</li>
        <li>Diseñar una interfaz interactiva que permita a los usuarios personalizar sus recorridos según intereses y tiempo disponible, para brindar una experiencia más personalizada y eficiente.</li>
        <li>Probar y validar la efectividad de la plataforma mediante pruebas con usuarios reales y retroalimentación continua, para garantizar su funcionalidad, usabilidad y satisfacción del usuario final.</li>
      </ol>

    )
  }
];

function AccordionAnimated({ data }) {
  const [open, setOpen] = useState(data[0].key);
  return (
    <div className="workshop-accordion-animated">
      {data.map((item) => (
        <motion.div
          key={item.key}
          className={`workshop-accordion-item${open === item.key ? ' open' : ''}`}
          initial={false}
          animate={{ boxShadow: open === item.key ? '0 8px 32px rgba(49,131,155,0.18)' : '0 2px 8px rgba(49,131,155,0.08)' }}
          transition={{ duration: 0.3 }}
        >
          <button className="workshop-accordion-header" onClick={() => setOpen(open === item.key ? null : item.key)}>
            <span className="workshop-accordion-icon">{item.icon}</span>
            <span className="workshop-accordion-title">{item.title}</span>
            <span className="workshop-accordion-arrow">{open === item.key ? '▲' : '▼'}</span>
          </button>
          <AnimatePresence initial={false}>
            {open === item.key && (
              <motion.div
                className="workshop-accordion-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <div className="workshop-accordion-inner">
                  <img src={item.image} alt={item.title} className="workshop-accordion-img" />
                  <div className="workshop-accordion-text">{item.content}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

const Workshop = ({ onViewChange }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const particlesInit = useCallback(async (engine) => await loadFull(engine), []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      onViewChange("Home");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    }, 800);
  };
  const handleProgram = () => {
    setIsExiting(true);
    setTimeout(() => {
      onViewChange("Program");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    }, 800);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, when: "beforeChildren" } },
    exit: { opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }
  };
  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 12 } }
  };

  return (
    <div className="workshop-container">
      <AnimatePresence>
        {isExiting && (
          <motion.div className="page-transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} />
        )}
      </AnimatePresence>
      <Particles
        id="tsparticles-workshop"
        init={particlesInit}
        options={{
          background: { color: "#0a192f" },
          particles: {
            number: { value: 50 },
            color: { value: ["#5dbcff", "#ffffff", "#31839b"] },
            opacity: { value: 0.5 },
            size: { value: 3 },
            move: { enable: true, speed: 1.2, random: true },
            links: { enable: true, color: "#5dbcff", opacity: 0.4, distance: 150, width: 1 }
          },
          interactivity: {
            events: { onHover: { enable: true, mode: "grab" }, onClick: { enable: true, mode: "push" } },
            modes: { grab: { distance: 180, links: { opacity: 0.8 } }, push: { quantity: 4 } }
          }
        }}
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}
      />
      <motion.div className="workshop-content-wrapper wide-layout" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
        {/* HERO MINIMALISTA */}
        <section className="workshop-hero minimal">
          <div className="hero-background" style={{ backgroundImage: `linear-gradient(rgba(10,25,47,0.7),rgba(10,25,47,0.9)), url(${images.hero})`, transform: `translateY(${scrollY * 0.4}px)` }} />
          <motion.div className="hero-content minimal" variants={itemVariants}>
            <motion.h1 className="hero-title minimal" variants={itemVariants} transition={{ delay: 0.2 }}>
              QhatuMap <span className="hero-title-accent">La Paz</span>
            </motion.h1>
            <motion.p className="hero-subtitle minimal" variants={itemVariants} transition={{ delay: 0.4 }}>
              La nueva forma de descubrir la ciudad maravilla.
            </motion.p>
            <motion.button className="cta-main" whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.97 }} onClick={handleProgram}>
              Empezar mi recorrido
            </motion.button>
          </motion.div>
        </section>
        {/* CARRUSEL INTEGRADO */}
        <section className="workshop-carousel-section compact">
          <Swiper
            modules={[Autoplay, Pagination, EffectFade]}
            effect="fade"
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop={true}
            className="workshop-carousel"
          >
            {carouselSlides.map((slide, idx) => (
              <SwiperSlide key={idx}>
                <div className="carousel-image-wrapper compact">
                  <img src={slide.img} alt={slide.title} className="carousel-image compact" />
                  <div className="carousel-overlay">
                    <h3 className="carousel-title">{slide.title}</h3>
                    <p className="carousel-desc">{slide.desc}</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
        {/* SECCIÓN INTRODUCCIÓN, PROBLEMA Y OBJETIVOS (ANIMADA) */}
        <section className="workshop-intro-section">
          <AccordionAnimated data={introAccordionData} />
        </section>
        {/* BENEFICIOS EN CARDS */}
        <section className="workshop-benefits cards">
          <div className="benefits-grid cards">
            {benefits.map((b, i) => (
              <div className="benefit-item card" key={i}>
                <div className="benefit-icon">{b.icon}</div>
                <h4>{b.title}</h4>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
        {/* SECCIÓN DE INFORMACIÓN SIDE-BY-SIDE */}
        <section className="info-section-sidebyside">
          {infoCards.map((card, idx) => (
            <div className={`info-row ${idx % 2 === 0 ? "row-normal" : "row-reverse"}`} key={idx}>
              <div className="info-image-col">
                <img src={card.image} alt={card.title} className="info-image" />
              </div>
              <div className="info-text-col">
                <div className="info-icon">{card.icon}</div>
                <h3 className="info-title">{card.title}</h3>
                <p className="info-desc">{card.content}</p>
              </div>
            </div>
          ))}
        </section>
        {/* TECNOLOGÍAS */}
        <section className="technologies-section modern">
          <h2 className="section-title">Tecnologías Utilizadas</h2>
          <div className="tech-grid modern">
            {techStack.map((t, i) => (
              <div className="tech-item modern" key={i}>
                <div className="tech-icon modern">{t.icon}</div>
                <h3>{t.name}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </section>
        {/* CIERRE */}
        <section className="workshop-closing">
          <motion.h2 className="closing-title" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            ¿Listo para explorar La Paz como nunca antes?
          </motion.h2>
          <motion.p className="closing-text" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.2 }}>
            Únete a la revolución digital del turismo paceño. QhatuMap es tu aliado para descubrir, aprender y disfrutar cada rincón de la ciudad. ¡Empieza tu aventura ahora!
          </motion.p>
        </section>
        {/* BOTONES DE NAVEGACIÓN */}
        <div className="workshop-buttons-container">
          <motion.button className="workshop-return-button back-btn" onClick={handleBack} variants={itemVariants} whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(93, 188, 255, 0.4)" }} whileTap={{ scale: 0.95 }}>
            <motion.span animate={{ x: [-5, 0, -5] }} transition={{ duration: 1.5, repeat: Infinity }}>←</motion.span>
            Volver al Inicio
          </motion.button>
          <motion.button className="workshop-return-button next-btn" onClick={handleProgram} variants={itemVariants} whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(93, 188, 255, 0.4)" }} whileTap={{ scale: 0.95 }}>
            Ir al programa
            <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Workshop;