import '../styles/Footer.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";

const Footer = () => {
    return (
        <footer className="footer">
        <div className="footer-content">
            <p className="footer-text">© 2025 - Grafos - Héroes de Senkata</p>
            <a className="footer-direccition" href="https://maps.app.goo.gl/quz8MFzEXGf7SJdu5" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="icono-ubicacion" /> 
            Dirección
            </a>
        </div>
        </footer>
    );
};

export default Footer;
