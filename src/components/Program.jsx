import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import polyline from "@mapbox/polyline";

// Configuración de iconos
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

class UnionFind {
  constructor(elements) {
    this.parent = {};
    elements.forEach(e => (this.parent[e] = e));
  }
  find(element) {
    while (this.parent[element] !== element) {
      this.parent[element] = this.parent[this.parent[element]];
      element = this.parent[element];
    }
    return element;
  }
  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent[rootB] = rootA;
  }
}

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Modal para ver imágenes grandes, sin animación de transición
const ImageModal = ({ images, idx, onClose }) => {
  const [current, setCurrent] = useState(idx);

  useEffect(() => {
    setCurrent(idx);
  }, [idx, images]);

  const goTo = (i) => setCurrent(i);

  const prev = (e) => {
    e.stopPropagation();
    setCurrent(i => (i - 1 + images.length) % images.length);
  };

  const next = (e) => {
    e.stopPropagation();
    setCurrent(i => (i + 1) % images.length);
  };

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(10,25,47,0.93)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          background: "#0a192f",
          borderRadius: 18,
          boxShadow: "0 4px 32px rgba(49,131,155,0.25)",
          padding: 28,
          minWidth: 340,
          maxWidth: "92vw",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Botón de cerrar ABSOLUTO al borde superior derecho del MODAL, con margen */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "rgba(30,40,60,0.85)",
            border: "none",
            borderRadius: "50%",
            width: 38,
            height: 38,
            color: "#fff",
            fontSize: 26,
            cursor: "pointer",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(49,131,155,0.18)",
            transition: "background 0.2s"
          }}
          aria-label="Cerrar"
        >×</button>
        <div style={{ position: "relative", width: "60vw", maxWidth: 650, height: "50vh", maxHeight: 440, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src={images[current]}
            alt="foto grande"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 14,
              boxShadow: "0 2px 16px rgba(49,131,155,0.18)"
            }}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(30,40,60,0.85)",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 28,
                  cursor: "pointer",
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(49,131,155,0.18)",
                  transition: "background 0.2s"
                }}
                aria-label="Anterior"
              >‹</button>
              <button
                onClick={next}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(30,40,60,0.85)",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 28,
                  cursor: "pointer",
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(49,131,155,0.18)",
                  transition: "background 0.2s"
                }}
                aria-label="Siguiente"
              >›</button>
            </>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 18 }}>
          {images.map((_, i) => (
            <span
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: current === i ? 20 : 12,
                height: current === i ? 20 : 12,
                borderRadius: "50%",
                background: current === i ? "linear-gradient(90deg,#5dbcff,#31839b)" : "#b0b9c6",
                border: current === i ? "2.5px solid #5dbcff" : "1.5px solid #b0b9c6",
                boxShadow: current === i ? "0 0 10px #5dbcff" : "none",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Carrusel sin animación de transición de imágenes
const Carousel = ({ images, interval = 2200, showSeeMore = true }) => {
  const [idx, setIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const timeout = setTimeout(() => {
      setIdx(i => (i + 1) % images.length);
    }, interval);
    return () => clearTimeout(timeout);
  }, [idx, images, interval]);

  if (!images || images.length === 0) return null;

  const goTo = (i) => setIdx(i);

  const prev = (e) => {
    e.stopPropagation();
    setIdx(i => (i - 1 + images.length) % images.length);
  };

  const next = (e) => {
    e.stopPropagation();
    setIdx(i => (i + 1) % images.length);
  };

  return (
    <div
      style={{
        margin: "14px 0 0 0",
        width: "100%",
        textAlign: "center",
        position: "relative",
        minHeight: 110,
        maxWidth: 220,
        marginLeft: "auto",
        marginRight: "auto",
        borderRadius: 12,
        overflow: "hidden",
        background: "#0a192f",
        boxShadow: "0 2px 12px rgba(49,131,155,0.13)"
      }}
    >
      <img
        src={images[idx]}
        alt="foto sitio"
        style={{
          width: "100%",
          height: "110px",
          objectFit: "cover",
          borderRadius: 12,
          border: "2px solid #5dbcff"
        }}
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            style={{
              position: "absolute",
              top: "50%",
              left: 6,
              transform: "translateY(-50%)",
              background: "rgba(30,40,60,0.85)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              color: "#fff",
              fontWeight: "bold",
              fontSize: 18,
              cursor: "pointer",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(49,131,155,0.13)",
              transition: "background 0.2s"
            }}
            aria-label="Anterior"
          >‹</button>
          <button
            onClick={next}
            style={{
              position: "absolute",
              top: "50%",
              right: 6,
              transform: "translateY(-50%)",
              background: "rgba(30,40,60,0.85)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              color: "#fff",
              fontWeight: "bold",
              fontSize: 18,
              cursor: "pointer",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(49,131,155,0.13)",
              transition: "background 0.2s"
            }}
            aria-label="Siguiente"
          >›</button>
        </>
      )}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 8,
        marginTop: 7,
        marginBottom: 7,
        position: "relative"
      }}>
        {images.map((_, i) => (
          <span
            key={i}
            onClick={e => { e.stopPropagation(); goTo(i); }}
            style={{
              width: idx === i ? 14 : 9,
              height: idx === i ? 14 : 9,
              borderRadius: "50%",
              background: idx === i ? "linear-gradient(90deg,#5dbcff,#31839b)" : "#b0b9c6",
              border: idx === i ? "2px solid #5dbcff" : "1px solid #b0b9c6",
              boxShadow: idx === i ? "0 0 7px #5dbcff" : "none",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          />
        ))}
      </div>
      {showSeeMore && (
        <button
          onClick={() => setModalOpen(true)}
          style={{
            margin: "0 auto 10px auto",
            display: "block",
            background: "linear-gradient(90deg,#5dbcff,#31839b)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "6px 22px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(49,131,155,0.13)",
            letterSpacing: "0.5px",
            transition: "background 0.2s"
          }}
        >
          Ver más
        </button>
      )}
      {modalOpen && (
        <ImageModal images={images} idx={idx} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
};

const touristPlacesData = [
  {
    id: 1,
    name: "Plaza Murillo",
    lat: -16.4957,
    lon: -68.1335,
    type: "Plaza Historica",
    hours: "Abierto 24h",
    price: "Gratis",
    description: "Plaza principal de La Paz, sede del gobierno boliviano. Rodeada de edificios coloniales y el Palacio Presidencial.",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/b/b8/Palacio_Quemado_y_Plaza_Murillo_%282%29.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Noon%2C_Plaza_Murillo%2C_La_Paz%2C_Bolivia_%2814689720998%29.jpg/960px-Noon%2C_Plaza_Murillo%2C_La_Paz%2C_Bolivia_%2814689720998%29.jpg",
      "https://scontent.flpb3-2.fna.fbcdn.net/v/t1.6435-9/92952821_647964672708457_5595003323259289600_n.jpg?stp=dst-jpg_s720x720_tt6&_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_ohc=G1juZg0MHyAQ7kNvwEtNH5i&_nc_oc=AdlLCmNcu2H00NH-JzaGGJYJrCGlLSr6qU_kZM4RRra_02oFbhdpu-zNWaYCHcvyIhY&_nc_zt=23&_nc_ht=scontent.flpb3-2.fna&_nc_gid=ULg6HrlNPdIKkly3_c0iLA&oh=00_AfKX5lyC9Z0El9hOEztUEAK4118iVNbKdEQI8yx3R-r6Tg&oe=685B31F8"
    ]
  },
  {
    id: 2,
    name: "Calle Jean",
    lat: -16.49249,
    lon: -68.1360778,
    type: "Calle Colonial",
    hours: "Abierto 24h",
    price: "Gratis",
    description: "calle colonial en el centro de La Paz, famosa por sus casas coloridas, museos y ambiente bohemio. Es ideal para pasear, conocer la historia paceña y disfrutar de su arquitectura tradicional.",
    images: [
      "https://lp-cms-production.imgix.net/2020-11/b2d578bd09916bf36a729124bc44c4b3-calle-jaen-museums.jpg",
      "https://media01.stockfood.com/largepreviews/NDI4NTQ2NDE4/13824078-Calle-Apolinar-JAEN-La-Paz-Bolivia.jpg",
      "https://s1.wklcdn.com/image_469/14073311/151280749/95178457Master.jpg"
    ]
  },
  {
    id: 3,
    name: "Mercado de las brujas",
    lat: -16.496170,
    lon: -68.138903,
    type: "Mercado Tradicional",
    hours: "06:00-23:00",
    price: "Gratis",
    description: "Mercado místico con remedios tradicionales, amuletos y productos ceremoniales aymaras.",
    images: [
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/32/e5/20/mercado-de-las-brujas.jpg?w=1200&h=-1&s=1",
      "https://viajerosxbolivia.com/wp-content/uploads/Mercado-de-las-Brujas.png",
      "https://previews.123rf.com/images/markpittimages/markpittimages1910/markpittimages191000128/132892589-la-paz-bolivia-27-de-agosto-bolivia-mercado-de-brujas-de-la-paz-en-el-centro-hist%C3%B3rico-por-la-ma%C3%B1ana.jpg"
    ]
  },
  {
    id: 4,
    name: "Calle Sagarnaga",
    lat: -16.498903,
    lon: -68.139882,
    type: "Calle turística",
    hours: "Abierto 24h",
    price: "Gratis",
    description: "Principal calle turística con artesanías, souvenirs típicos y textiles bolivianos.",
    images: [
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/4d/45/ee/20160429-124004-largejpg.jpg?w=900&h=-1&s=1",
      "https://delapatagoniaalmundo.com/wp-content/uploads/2022/11/DSC06793.jpg",
      "https://delapatagoniaalmundo.com/wp-content/uploads/2022/11/DSC06795.jpg"
    ]
  },
  {
    id: 5,
    name: "Mi teleferico (estacion central)",
    lat: -16.4912576,
    lon: -68.1443202,
    type: "Transporte turístico",
    hours: "6:00-23:00",
    price: "Bs 3 por tramo",
    description: "Sistema de teleféricos urbano más extenso del mundo, excelente para vistas panorámicas.",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Estaci%C3%B3n_Central_de_Mi_Telef%C3%A9rico_L%C3%ADnea_Roja_en_la_ciudad_de_La_Paz_-_Bolivia_en_el_a%C3%B1o_2019.jpg/2560px-Estaci%C3%B3n_Central_de_Mi_Telef%C3%A9rico_L%C3%ADnea_Roja_en_la_ciudad_de_La_Paz_-_Bolivia_en_el_a%C3%B1o_2019.jpg",
      "https://larazon.bo/wp-content/uploads/2024/11/LINEA-ROJA-ARCHIVO-LA-RAZON.jpg",
      "https://vision360-s3.cdn.net.ar/s3i233/2024/09/vision360/images/01/14/24/1142439_cc1826cee8647411230182296d66f9e57b6dc47f8d0580ffa3fe9b4061d515cd/lg.webp"
    ]
  },
  {
    id: 6,
    name: "Valle de la luna",
    lat: -16.567094,
    lon: -68.093279,
    type: "Atracción natural",
    hours: "9:00-17:00",
    price: "Bs 15",
    description: "Paisaje surrealista de formaciones rocosas erosionadas, ideal para caminatas y fotos por su parecido a la superficie de la Luna.",
    images: [
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/5d/11/7f/vale.jpg?w=900&h=500&s=1",
      "https://visitsouthamerica.co/wp-content/uploads/2023/01/the-valley-of-the-moon-bolivia-1024x765.jpeg",
      "https://www.laregion.bo/wp-content/uploads/2017/06/Noticias02.jpg"
    ]
  },
  {
    id: 7,
    name: "Parque Nacional Mallasa",
    lat: -16.573002,
    lon: -68.083308,
    type: "Parque nacional",
    hours: "8:00-18:00",
    price: "Bs 5",
    description: "Área natural protegida con senderos, miradores y espacios para picnic.",
    images: [
      "https://www.ibolivia.org/wp-content/uploads/2019/07/parque-nacional-mallasa.jpg",
      "https://www.boliviaentusmanos.com/turismo/imagenes/mallasa1.jpg",
      "https://www.pub.eldiario.net/noticias/2012/2012_10/nt121005/f_2012-10-05_56.jpg"
    ]
  },
  {
    id: 8,
    name: "Muela del diablo",
    lat: -16.56134019408571,
    lon: -68.05684814850876,
    type: "Formación rocosa",
    hours: "Abierto 24h",
    price: "Gratis",
    description: "Imponente formación rocosa, popular para trekking y escalada.",
    images: [
      "https://scontent.flpb3-2.fna.fbcdn.net/v/t39.30808-6/474461151_9035176779904714_1498590434111094872_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_ohc=RNj4tvUyn6EQ7kNvwFE9PgF&_nc_oc=AdmvUDmYUAY6OQrq_NY4iuNulGQ5avYgOaLOOqZFgtFWfoI9tahHDcRtJtgGAgUwwCQ&_nc_zt=23&_nc_ht=scontent.flpb3-2.fna&_nc_gid=ymD_by9VQkSemdLFgtNrTQ&oh=00_AfL5iSDZCux3pIbCeM8nGKW0xOAdHg1CV8H3ojIZ4-MmuA&oe=6839BF0A",
      "https://thirtysmthtraveller.wordpress.com/wp-content/uploads/2018/06/dsc_0706-1.jpg",
      "https://pro2-bar-s3-cdn-cf2.myportfolio.com/3da5b746-8173-4cd6-b978-7ff64f94d077/38c4cb80-0d2f-48b6-a97a-58f593ce21fe_rw_1920.jpg?h=f20f1b6eb8baed2e78897c96a1691e64"
    ]
  },
  {
    id: 9,
    name: "Cholitas Wrestling",
    lat: -16.502003489907196,
    lon: -68.16223138533154,
    type: "Espectáculo cultural",
    hours: "Domingos 16:00-18:00",
    price: "Bs 50-150",
    description: "Lucha libre protagonizada por mujeres originarias con el traje tipico de cholita, un show único y divertido.",
    images: [
      "https://www.worldtravelguide.net/wp-content/uploads/2021/01/shu-Bolivia-Cholitas_389315776-EDITORIAL-1440x823-1.jpg",
      "https://www.lostiempos.com/sites/default/files/styles/noticia_home_apertura_2/public/galerias/20179/_dsc0321.jpg?itok=TDQ6zMca",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/5f/e0/a4/show-jueves.jpg?w=1200&h=-1&s=1"
    ]
  },
  {
    id: 10,
    name: "Mirador Killi Killi",
    lat: -16.4944421144532,
    lon: -68.12758610869903,
    type: "Mirador",
    hours: "Abierto 24h",
    price: "Gratis",
    description: "Uno de los mejores miradores de La Paz, con vistas panorámicas de la ciudad y el Illimani.",
    images: [
      "https://i.ytimg.com/vi/Inyaest26QQ/maxresdefault.jpg",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/09/28/85/04/mirador-killi-killi.jpg?w=1200&h=-1&s=1",
      "https://scontent.flpb3-2.fna.fbcdn.net/v/t1.6435-9/210950130_10158059445862617_7033389717607487866_n.jpg?stp=dst-jpg_s720x720_tt6&_nc_cat=100&ccb=1-7&_nc_sid=536f4a&_nc_ohc=ryHV4caCrVoQ7kNvwG9ncgm&_nc_oc=Adn2oA9M6rKf7m4Lb_5sSTTnS2PXEtY3euM9oLjp-jzfg88jaBBieI1MgY-xsUJCzTM&_nc_zt=23&_nc_ht=scontent.flpb3-2.fna&_nc_gid=5tafCyRLmAlcuSDZKnALLA&oh=00_AfKfY5gE62Qq2sZjMkycIl264Xej2gQNQILRfpo37cZFgg&oe=685B3FD6"
    ]
  },
  {
    id: 11,
    name: "Iglesia San Francisco",
    lat: -16.496150005635762,
    lon: -68.13683730353266,
    type: "Iglesia histórica",
    hours: "8:00-19:00",
    price: "Gratis",
    description: "Templo colonial de estilo barroco mestizo, uno de los más importantes de Bolivia.",
    images: [
      "https://us.images.westend61.de/0001238287pw/basilica-de-san-francisco-vista-elevada-la-paz-bolivia-sudamerica-RHPLF03782.jpg",
      "https://boliviatravelsite.com/Images/Attractionphotos/la-paz-san-francisco-002.jpg",
      "https://viajerosxbolivia.com/wp-content/uploads/Iglesia-de-San-Francisco.png"
    ]
  },
  {
    id: 12,
    name: "Museo Nacional de arte",
    lat: -16.49585689103923,
    lon: -68.13414280239664,
    type: "Museo",
    hours: "9:30-19:00",
    price: "Bs 20",
    description: "Museo con colecciones de arte colonial, moderno y contemporáneo boliviano.",
    images: [
      "https://a.travel-assets.com/findyours-php/viewfinder/images/res70/65000/65257-National-Museum-Of-Art.jpg",
      "https://www.boliviaentusmanos.com/turismo/imagenes/museo-nacional-de-arte-2.jpg",
      "https://scontent.flpb3-1.fna.fbcdn.net/v/t1.6435-9/94114195_142257857346770_3248132754914672640_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=3a1ebe&_nc_ohc=s2a6RGmd8iEQ7kNvwER2OM_&_nc_oc=AdlWcmM2xSjr4Nox9D1SWhZLt624XqVh0iIh86klAMIx_Qn0Y8lCrjo6yaxLgYE6WU4&_nc_zt=23&_nc_ht=scontent.flpb3-1.fna&_nc_gid=7nwhFc7JKXKmOhAvHCkicw&oh=00_AfJUn0UNgpet4W1DiG2Fgzmw6i5e9f8Mj8y3Eg2E2OGmLw&oe=685B5E78"
    ]
  },
  {
    id: 13,
    name: "Cementerio General",
    lat: -16.495668719900753,
    lon: -68.15173139278046,
    type: "Cementerio histórico",
    hours: "8:00-18:00",
    price: "Gratis",
    description: "Cementerio monumental con mausoleos y arte funerario, parte de la historia paceña.",
    images: [
      "https://live.staticflickr.com/815/41419971382_78e65217c0_b.jpg",
      "https://www.lostiempos.com/sites/default/files/styles/noticia_home_apertura_2/public/galerias/201710/000_tq0hu.jpg?itok=1yG0lVPL&c=46f9b5ea85c89c277a50b151dfcca36d",
      "https://erbol.com.bo/sites/default/files/cementerio-la-paz-jul.jpg"
    ]
  },
  {
    id: 14,
    name: "Laguna de Cota Cota",
    lat: -16.54119683193453,
    lon: -68.06484887364464,
    type: "Laguna",
    hours: "8:00-18:00",
    price: "Gratis",
    description: "Laguna urbana ideal para paseos familiares, deportes y observación de aves.",
    images: [
      "https://scontent.flpb3-2.fna.fbcdn.net/v/t39.30808-6/481499008_3981160985472416_7453702542325397688_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=127cfc&_nc_ohc=yvz5bWshBCYQ7kNvwFzCPnu&_nc_oc=Adk8H_aMX1IBPmw_hPshBvm46yjm1rHQ4yNfhZdEqnfrTaPODjSNzq44v27ku0ysfYI&_nc_zt=23&_nc_ht=scontent.flpb3-2.fna&_nc_gid=c7Jm__ehkY0JUXLWtrSBbA&oh=00_AfJDFrLTEOY0piia9ywsrBsm__Zo3oQespRu12hUo85BYw&oe=6839AEBA",
      "https://upload.wikimedia.org/wikipedia/commons/5/50/Parque_de_la_Laguna_de_Cota_Cota.jpg",
      "https://scontent.flpb3-1.fna.fbcdn.net/v/t39.30808-6/475823946_3955641808024334_312790313445768281_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_ohc=PQVRAFO3myoQ7kNvwErMkjR&_nc_oc=AdnIDjMOt1kDMuVnrkBjx3hGUwgayyW7s0lljIBiRdvFAToOqdot2x5sRLW0N-lFJqA&_nc_zt=23&_nc_ht=scontent.flpb3-1.fna&_nc_gid=uazVSPlEEvbe9w1sFl2PIQ&oh=00_AfK5nerOylFvuLZEzct5ou1baYGM3XXTmUhr_5UCJ5jiww&oe=6839A873"
    ]
  },
  {
    id: 15,
    name: "Valle de las animas",
    lat: -16.52908546832394,
    lon: -68.02715060544136,
    type: "Formación natural",
    hours: "Abierto 24h",
    price: "Gratis",
    description: "Valle de formaciones rocosas impresionantes, ideal para caminatas y fotografía.",
    images: [
      "https://i0.wp.com/lambontherhodes.com/wp-content/uploads/2023/03/dsc03994.jpg?resize=3000%2C2000&ssl=1",
      "https://www.huillcaexpedition.com/images/blog/valle-de-las-animas-la-paz-1748038658.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/62/Valle_de_las_%C3%A1nimas_La_Paz_Bolivia_%283%29.jpg"
    ]
  },
  {
    id: 16,
    name: "Parque Urbano Central",
    lat: -16.503708595323655,
    lon: -68.12610910965569,
    type: "Parque urbano",
    hours: "9:00-22:00",
    price: "Gratis",
    description: "Gran parque en el centro de La Paz, con áreas verdes, juegos y eventos culturales.",
    images: [
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0e/78/1a/69/mais-panoramicas-com.jpg?w=1200&h=1200&s=1",
      "https://undiaunaarquitecta3.wordpress.com/wp-content/uploads/2017/10/2004-parque-urbano-central-5-manuel-alazraki-2012.jpg",
      "https://scontent.flpb3-2.fna.fbcdn.net/v/t39.30808-6/486387531_9740698212635621_2612209313805277657_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_ohc=P92SGVJScPkQ7kNvwFMQ3FC&_nc_oc=AdmGZVOA7zLLLt_ooFN9_X34PaTAjAJJj1occWRitrtrBOsVSluQvGNGvU-26hw-18A&_nc_zt=23&_nc_ht=scontent.flpb3-2.fna&_nc_gid=4tTk2dzzqrQW6k8InyO42Q&oh=00_AfIurotrEUHVa2N9TvpfUh9tawge_GKS-1pNe3wHSq-ynQ&oe=6839C0F8"
    ]
  },
  {
    id: 17,
    name: "Monticulo",
    lat: -16.51323827470809,
    lon: -68.12729110285417,
    type: "Mirador",
    hours: "24 Horas",
    price: "Gratis",
    description: "Mirador con vistas espectaculares y una pequeña capilla, lugar romántico y tranquilo.",
    images: [
      "https://storage.alboom.ninja/sites/7046/albuns/809882/claudia-afnan-0708.jpg?t=1617653190",
      "https://scontent.flpb3-2.fna.fbcdn.net/v/t1.6435-9/120252500_752259835330786_8998129200368275220_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=wHajjIlna1UQ7kNvwEnSEA2&_nc_oc=AdnWAcqfFddsKdvhlZ-UgwKktFhhjyFve7jJ2Id3K-xqoIep4YThzKnvAWk3xJJcC4U&_nc_zt=23&_nc_ht=scontent.flpb3-2.fna&_nc_gid=Ob1VL1f4xtjzV-3avO3qCg&oh=00_AfK3_bis4v2asInxJeQT0UHoZYu8mssb4SewcZ_cD-2m0A&oe=685B57E6",
      "https://i0.wp.com/amun.bo/wp-content/uploads/2022/06/WhatsApp-Image-2022-06-07-at-5.55.44-PM.jpeg?fit=1600%2C900&ssl=1"
    ]
  },
  {
    id: 18,
    name: "Bioparque Municipal Vesty Pakos Sofro",
    lat: -16.57236217342234,
    lon: -68.08321762474866,
    type: "Bioparque",
    hours: "9:00-17:00",
    price: "Bs 10",
    description: "Parque zoológico y de conservación con fauna nativa y actividades educativas.",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/6/61/Puerta_1_BMVP.jpg",
      "https://anabolivia.org/wp-content/uploads/2024/09/1000024984-750x563.jpg",
      "https://oxigeno.bo/sites/default/files/field/image/zoo_lp.jpg"
    ]
  },
  {
    id: 19,
    name: "Parque de las cebras",
    lat: -16.519657579672216,
    lon: -68.1321680877114,
    type: "Parque temático",
    hours: "6:00-20:00",
    price: "Gratis",
    description: "Parque dedicado a las famosas cebras paceñas que ayudan en el tráfico.",
    images: [
      "https://lapaz.bo/wp-content/uploads/2023/06/cebras.jpg",
      "https://asolysombra.bo/wp-content/uploads/2023/06/parque.jpg",
      "https://scontent.flpb3-1.fna.fbcdn.net/v/t39.30808-6/464182365_27272614359048749_4052499744486790322_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_ohc=Q_FRGHyZ88UQ7kNvwEUpV_v&_nc_oc=AdkPjYL-eNLNvEc4vqr9cf_ssc9yo6VR_DbCmGhpsAJHfH8GcmnOeJP04IP3V2KWFuM&_nc_zt=23&_nc_ht=scontent.flpb3-1.fna&_nc_gid=HgIymu2lQ2_Cs9k2n2BWyw&oh=00_AfILv7wJD3z_BbzDP4kx3vvoE1gNd3WJaGW6zR44FYsLvQ&oe=6839CFBC"
    ]
  },
  {
    id: 20,
    name: "Teatro municipal Alberto Saavedra Perez",
    lat: -16.493577,
    lon: -68.134695,
    type: "Teatro histórico",
    hours: "10:00-21:00",
    price: "Según evento",
    description: "Teatro emblemático de La Paz, sede de obras, conciertos y eventos culturales.",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/7/70/Teatro_Municipal_Alberto_Saavedra_P%C3%A9rez%2C_Genaro_Sanjin%C3%A9s_esq._Indaburo.jpg",
      "https://erbol.com.bo/sites/default/files/teatro.jpg",
      "https://perspectivatemporal.org/sites/default/files/2024-08-media-image/teatro-municipal-lp.jpg"
    ]
  }
];

const Program = () => {
  const [map, setMap] = useState(null);
  const [touristPlaces, setTouristPlaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados del chat con IA
  const [chat, setChat] = useState([
    {
      sender: "ia",
      text: "¡Hola! 🏔️ Soy tu asistente turístico inteligente de La Paz, Bolivia. Puedo ayudarte a:\n\n🔍 Buscar lugares turísticos\n🗺️ Calcular rutas optimizadas\n💡 Darte recomendaciones personalizadas\n🌤️ Informarte sobre el clima\n🎭 Contarte sobre eventos culturales\n\n¿Qué te gustaría saber sobre La Paz?",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Referencia para scroll automático del chat
  const chatEndRef = useRef(null);

  const defaultIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const selectedIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  const routeIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  // Cargar lugares
  useEffect(() => {
    setTouristPlaces(touristPlacesData);
  }, []);

  // Scroll automático del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Inicializar el mapa y los marcadores
  useEffect(() => {
    if (touristPlaces.length === 0) return;

    let mapInstance = map;
    if (!mapInstance && document.getElementById("map")) {
      mapInstance = L.map("map", { zoomControl: false }).setView([-16.4897, -68.1193], 13);
      setMap(mapInstance);

      L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance);

      L.control.zoom({ position: "bottomright" }).addTo(mapInstance);
    }

    // Limpiar marcadores anteriores
    markers.forEach(marker => {
      if (mapInstance && mapInstance.hasLayer(marker)) mapInstance.removeLayer(marker);
    });

    const newMarkers = [];
    touristPlaces.forEach((place) => {
      const marker = L.marker([place.lat, place.lon], { icon: defaultIcon })
        .addTo(mapInstance)
        .on("click", () => handlePlaceSelect(place, marker));

      // --- POPUP SIN BOTÓN DE CERRAR Y QUE SE MANTENGA ABIERTO CON HOVER ---
      let popupOpen = false;
      let closeTimeout = null;

      // Renderiza el popup sin botón de cerrar
      marker.bindPopup(() => {
        const container = document.createElement("div");
        import("react-dom/client").then(({ createRoot }) => {
          createRoot(container).render(
            <div
              style={{
                maxWidth: 220,
                minWidth: 180,
                padding: "8px 0 0 0",
                margin: 0,
                fontSize: 13,
                boxSizing: "border-box",
                textAlign: "center"
              }}
              onMouseEnter={() => {
                popupOpen = true;
                if (closeTimeout) clearTimeout(closeTimeout);
              }}
              onMouseLeave={() => {
                popupOpen = false;
                closeTimeout = setTimeout(() => {
                  if (!popupOpen) marker.closePopup();
                }, 200);
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#5dbcff", fontWeight: 800 }}>{place.name}</h4>
              {place.type && <p style={{ margin: "4px 0", fontSize: 12 }}><strong>Tipo:</strong> {place.type}</p>}
              {place.hours && <p style={{ margin: "4px 0", fontSize: 12 }}><strong>Horario:</strong> {place.hours}</p>}
              {place.price && <p style={{ margin: "4px 0", fontSize: 12 }}><strong>Precio:</strong> {place.price}</p>}
              {place.description && <p style={{ margin: "4px 0", color: "#8892b0", fontSize: 12 }}>{place.description}</p>}
              <Carousel images={place.images} interval={1500} showSeeMore={true} />
            </div>
          );
        });
        return container;
      }, { closeButton: false }); // <-- SIN BOTÓN DE CERRAR

      // Mantener abierto el popup mientras el mouse esté sobre el marker o el popup
      marker.on("mouseover", () => {
        marker.openPopup();
        popupOpen = true;
        if (closeTimeout) clearTimeout(closeTimeout);
      });
      marker.on("mouseout", () => {
        popupOpen = false;
        closeTimeout = setTimeout(() => {
          if (!popupOpen) marker.closePopup();
        }, 200);
      });

      // También mantener abierto si el mouse está sobre el popup
      marker.on("popupopen", (e) => {
        const popupEl = e.popup.getElement();
        if (popupEl) {
          popupEl.addEventListener("mouseenter", () => {
            popupOpen = true;
            if (closeTimeout) clearTimeout(closeTimeout);
          });
          popupEl.addEventListener("mouseleave", () => {
            popupOpen = false;
            closeTimeout = setTimeout(() => {
              if (!popupOpen) marker.closePopup();
            }, 200);
          });
        }
      });

      newMarkers.push(marker);
    });
    setMarkers(newMarkers);

    return () => {
      if (mapInstance) mapInstance.remove();
    };
    // eslint-disable-next-line
  }, [touristPlaces]);

  // Selección de lugares
  const handlePlaceSelect = (place, marker) => {
    setSelectedPlaces(prev => {
      const exists = prev.find(p => p.id === place.id);
      if (exists) {
        marker.setIcon(defaultIcon);
        return prev.filter(p => p.id !== place.id);
      } else {
        marker.setIcon(selectedIcon);
        return [...prev, place];
      }
    });
  };

  // Calcular ruta óptima (MST + rutas reales)
  const calculateOptimalRoute = async () => {
    if (selectedPlaces.length < 2) {
      alert("¡Selecciona al menos 2 lugares!");
      return;
    }

    setLoading(true);
    try {
      // Generar todas las aristas posibles
      const edges = [];
      for (let i = 0; i < selectedPlaces.length; i++) {
        for (let j = i + 1; j < selectedPlaces.length; j++) {
          const p1 = selectedPlaces[i];
          const p2 = selectedPlaces[j];
          edges.push({
            from: p1.id,
            to: p2.id,
            distance: haversineDistance(p1.lat, p1.lon, p2.lat, p2.lon),
            p1,
            p2
          });
        }
      }

      // Ordenar y aplicar Kruskal
      edges.sort((a, b) => a.distance - b.distance);
      const uf = new UnionFind(selectedPlaces.map(p => p.id));
      const mstEdges = [];

      for (const edge of edges) {
        if (uf.find(edge.from) !== uf.find(edge.to)) {
          uf.union(edge.from, edge.to);
          mstEdges.push(edge);
          if (mstEdges.length === selectedPlaces.length - 1) break;
        }
      }

      // Limpiar rutas anteriores
      map.eachLayer(layer => {
        if (layer instanceof L.Polyline) map.removeLayer(layer);
      });

      // Obtener rutas reales
      let totalDistance = 0;
      let failed = false;

      for (const edge of mstEdges) {
        try {
          const response = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            {
              coordinates: [
                [edge.p1.lon, edge.p1.lat],
                [edge.p2.lon, edge.p2.lat]
              ]
            },
            {
              headers: {
                Authorization: "5b3ce3597851110001cf62482ff7cc7958e345ba8e8b5d00a0627fad",
                "Content-Type": "application/json"
              }
            }
          );

          const route = response.data.routes[0];
          totalDistance += route.summary.distance / 1000;

          // Decodificar correctamente la polilínea
          const decoded = polyline.decode(route.geometry);
          L.polyline(decoded, {
            color: "#5dbcff",
            weight: 5,
            opacity: 0.92,
            dashArray: "8 8"
          }).addTo(map);

        } catch (error) {
          failed = true;
        }
      }

      setRoutes([{ distance: totalDistance.toFixed(2) }]);
      // Cambia el color de los marcadores seleccionados a verde
      markers.forEach(marker => {
        const markerLatLng = marker.getLatLng();
        const isSelected = selectedPlaces.some(
          p => Math.abs(p.lat - markerLatLng.lat) < 1e-6 && Math.abs(p.lon - markerLatLng.lng) < 1e-6
        );
        marker.setIcon(isSelected ? routeIcon : defaultIcon);
      });

      if (failed) {
        alert("¡Algunas rutas no se pudieron calcular! Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Chat con Gemini + MCP
  const sendMessage = async () => {
    if (!userMessage.trim() || sending) return;

    const newMessage = userMessage.trim();
    setUserMessage("");
    setSending(true);

    setChat(prev => [...prev, { sender: "user", text: newMessage, timestamp: new Date().toLocaleTimeString() }]);

    try {
      const response = await axios.post('http://localhost:3001/chat', {
        message: newMessage,
        conversationHistory: chat
      });

      if (response.data.success) {
        setChat(prev => [...prev, {
          sender: "ia",
          text: response.data.response,
          toolsUsed: response.data.toolsUsed,
          timestamp: new Date().toLocaleTimeString()
        }]);
        if (response.data.toolsUsed?.includes('search_places')) {
          setTouristPlaces(touristPlacesData);
        }
      } else {
        setChat(prev => [...prev, {
          sender: "ia",
          text: "Lo siento, hubo un error procesando tu solicitud. ¿Puedes intentar de nuevo?",
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (error) {
      setChat(prev => [...prev, {
        sender: "ia",
        text: "Parece que hay un problema de conexión con el servidor MCP. ¿Puedes verificar que esté corriendo en el puerto 3001?",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setSending(false);
    }
  };

  // Responsive: mostrar chat abajo en móvil
  const isMobile = window.innerWidth < 900;

  return (
    <div className="tourist-dark-bg">
      <div className="tourist-dark-container">
        <header className="tourist-dark-header">
          <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="logo" className="tourist-dark-logo" />
          <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 18 }}>
            <div>
              <h1 style={{ marginBottom: 0 }}>QhatuMap</h1>
              <span>La Paz, Bolivia</span>
            </div>
          </div>
          <button
            className="home-btn"
            style={{
              marginLeft: "auto",
              background: "linear-gradient(90deg,#5dbcff,#31839b)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 26px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 6px rgba(49,131,155,0.13)",
              letterSpacing: "0.5px",
              transition: "background 0.2s"
            }}
            onClick={() => window.location.href = "/"}
          >
            Home
          </button>
        </header>
        <main className={`tourist-dark-main ${isMobile ? "mobile" : ""}`}>
          <section className="tourist-dark-map-section">
            <div id="map" className="tourist-dark-map"></div>
          </section>
          <aside className="tourist-dark-chat-section">
            <div className="chat-dark-header">
              <h3>🤖 Asistente Turístico IA</h3>
              <span>Powered by Gemini + MCP Tools</span>
            </div>
            <div className="chat-dark-messages">
              {chat.map((msg, index) => (
                <div key={index} className={`chat-dark-bubble ${msg.sender}`}>
                  <div>
                    {msg.text}
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div className="chat-dark-tools">
                        🔧 Herramientas usadas: {msg.toolsUsed.join(', ')}
                      </div>
                    )}
                  </div>
                  {msg.timestamp && (
                    <div className="chat-dark-timestamp">{msg.timestamp}</div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="chat-dark-bubble ia">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="spinner-small"></div>
                    Procesando con IA...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-dark-input-panel">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Pregúntame sobre lugares, rutas, recomendaciones..."
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !userMessage.trim()}
              >
                {sending ? <span className="spinner-btn"></span> : "📤"}
              </button>
            </div>
            <div className="chat-dark-suggestions">
              {["¿Qué lugares visitar?", "Ruta para un día", "Lugares gratuitos", "Museos en La Paz"].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setUserMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </aside>
        </main>
        <footer className="tourist-dark-footer">
          <div className="footer-dark-top">
            <h2>
              <span className="footer-dark-count">{selectedPlaces.length}</span> Lugares seleccionados
            </h2>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="footer-dark-btn"
                style={{ padding: "10px 18px", fontSize: 15 }}
                onClick={() => {
                  setSelectedPlaces(touristPlaces);
                  // Cambia iconos de todos los marcadores a selectedIcon
                  markers.forEach(marker => marker.setIcon(selectedIcon));
                }}
                disabled={touristPlaces.length === 0 || selectedPlaces.length === touristPlaces.length}
              >
                Seleccionar todos los puntos turísticos
              </button>
              <button
                className="footer-dark-btn"
                style={{ padding: "10px 18px", fontSize: 15, background: "#234e50" }}
                onClick={() => {
                  setSelectedPlaces([]);
                  // Cambia iconos de todos los marcadores a defaultIcon
                  markers.forEach(marker => marker.setIcon(defaultIcon));
                }}
                disabled={selectedPlaces.length === 0}
              >
                Deseleccionar destinos
              </button>
              <button
                onClick={calculateOptimalRoute}
                className="footer-dark-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    Calculando...
                    <span className="spinner"></span>
                  </>
                ) : (
                  "✨ Calcular Ruta Óptima"
                )}
              </button>
            </div>
          </div>
          {selectedPlaces.length > 0 && (
            <ul className="footer-dark-list">
              {selectedPlaces.map(place => (
                <li key={place.id}>
                  <span className="footer-dark-dot"></span>
                  <span>{place.name}</span>
                </li>
              ))}
            </ul>
          )}
          {routes.length > 0 && (
            <div className="footer-dark-result">
              <h3>
                🚗 Distancia total del recorrido: <span>{routes[0].distance} km</span>
              </h3>
            </div>
          )}
        </footer>
      </div>
      <style>{`
        .leaflet-popup-content {
          margin: 8px 0 0 0 !important;
          padding: 0 !important;
          width: 220px !important;
          min-width: 180px !important;
          max-width: 260px !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          margin-bottom: -8px !important;
        }
        .tourist-dark-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #020c1b 0%, #0a192f 100%);
          padding: 0;
        }
        .tourist-dark-container {
          max-width: 1800px;
          margin: 0 auto;
          padding: 24px 24px 0 24px;
        }
        .tourist-dark-header {
          display: flex;
          align-items: center;
          gap: 28px;
          background: rgba(17,34,64,0.92);
          border-radius: 18px;
          box-shadow: 0 2px 18px rgba(49,131,155,0.10);
          padding: 28px 60px;
          margin-bottom: 32px;
          border: none;
        }
        .tourist-dark-logo {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          background: #10203a;
          border: 2px solid #234e50;
        }
        .tourist-dark-header h1 {
          margin: 0;
          font-size: 2.6rem;
          color: #5dbcff;
          font-weight: 900;
          letter-spacing: 1.5px;
        }
        .tourist-dark-header span {
          font-size: 1.25rem;
          color: #a8b2d1;
          opacity: 0.85;
        }
        .tourist-dark-main {
          display: grid;
          grid-template-columns: 1fr 500px;
          gap: 38px;
          height: 80vh;
          max-height: 80vh;
        }
        .tourist-dark-main.mobile {
          display: flex;
          flex-direction: column;
          height: auto;
        }
        .tourist-dark-map-section {
          height: 100%;
          overflow: hidden;
        }
        .tourist-dark-map {
          height: 100%;
          width: 100%;
          border-radius: 18px;
          box-shadow: 0 2px 18px rgba(49,131,155,0.13);
          border: none;
        }
        .tourist-dark-chat-section {
          display: flex;
          flex-direction: column;
          background: rgba(17,34,64,0.93);
          border-radius: 18px;
          box-shadow: 0 2px 18px rgba(49,131,155,0.10);
          height: 100%;
          max-height: 100%;
          overflow: hidden;
        }
        .chat-dark-header {
          padding: 24px 32px 14px 32px;
          border-bottom: 1px solid #234e50;
          background: linear-gradient(90deg, #234e50 70%, #31839b 100%);
          color: #fff;
          border-radius: 18px 18px 0 0;
        }
        .chat-dark-header h3 {
          margin: 0 0 2px 0;
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .chat-dark-header span {
          font-size: 1.08rem;
          opacity: 0.93;
        }
        .chat-dark-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px 24px 12px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-height: 0;
          max-height: calc(80vh - 190px);
          background: transparent;
        }
        .chat-dark-bubble {
          max-width: 90%;
          padding: 16px 22px;
          border-radius: 18px 18px 6px 18px;
          font-size: 16px;
          line-height: 1.5;
          box-shadow: 0 1px 6px rgba(49,131,155,0.09);
          white-space: pre-wrap;
          background: #10203a;
          color: #ccd6f6;
          position: relative;
          border: 1.5px solid rgba(49,131,155,0.10);
        }
        .chat-dark-bubble.user {
          align-self: flex-end;
          background: linear-gradient(90deg, #31839b 70%, #234e50 100%);
          color: #fff;
          border-radius: 18px 18px 6px 18px;
          border: none;
        }
        .chat-dark-bubble.ia {
          align-self: flex-start;
          background: #10203a;
          color: #ccd6f6;
          border-radius: 18px 18px 18px 6px;
        }
        .chat-dark-tools {
          margin-top: 8px;
          font-size: 12px;
          opacity: 0.7;
          font-style: italic;
          color: #5dbcff;
        }
        .chat-dark-timestamp {
          font-size: 11px;
          color: #8892b0;
          text-align: right;
          margin-top: 4px;
        }
        .chat-dark-input-panel {
          display: flex;
          gap: 12px;
          padding: 22px 24px 12px 24px;
          border-top: 1px solid #234e50;
          background: #0a192f;
          border-radius: 0 0 0 0;
        }
        .chat-dark-input-panel input {
          flex: 1;
          padding: 14px;
          border: 1.5px solid #234e50;
          border-radius: 20px;
          font-size: 16px;
          outline: none;
          background: #10203a;
          color: #ccd6f6;
          transition: border 0.2s;
        }
        .chat-dark-input-panel input:focus {
          border: 1.5px solid #5dbcff;
        }
        .chat-dark-input-panel button {
          padding: 14px 22px;
          background: linear-gradient(90deg, #31839b 70%, #234e50 100%);
          color: #fff;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 17px;
          min-width: 54px;
          font-weight: 600;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-dark-input-panel button:disabled {
          background: #234e50;
          cursor: not-allowed;
        }
        .chat-dark-suggestions {
          margin: 10px 0 0 0;
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          padding: 0 24px 16px 24px;
        }
        .chat-dark-suggestions button {
          padding: 6px 14px;
          font-size: 13px;
          background: #0a192f;
          border: 1px solid #234e50;
          border-radius: 12px;
          cursor: pointer;
          color: #5dbcff;
          transition: background 0.2s;
        }
        .chat-dark-suggestions button:hover {
          background: #234e50;
        }
        .tourist-dark-footer {
          margin-top: 38px;
          padding: 38px 60px;
          background: rgba(17,34,64,0.93);
          border-radius: 18px;
          box-shadow: 0 2px 18px rgba(49,131,155,0.10);
          border: none;
        }
        .footer-dark-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
        }
        .footer-dark-count {
          color: #5dbcff;
          font-size: 1.7rem;
          font-weight: 700;
          margin-right: 10px;
        }
        .footer-dark-btn {
          padding: 15px 32px;
          background: linear-gradient(90deg, #31839b 60%, #234e50 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 2px 8px rgba(49,131,155,0.10);
          transition: background 0.2s;
        }
        .footer-dark-btn:disabled {
          background: #234e50;
          cursor: not-allowed;
        }
        .footer-dark-list {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 14px;
          padding: 0;
          list-style: none;
        }
        .footer-dark-list li {
          padding: 15px 18px;
          background: #10203a;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(49,131,155,0.08);
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 16px;
          font-weight: 500;
          color: #ccd6f6;
        }
        .footer-dark-dot {
          width: 14px;
          height: 14px;
          background: linear-gradient(90deg, #31839b 60%, #5dbcff 100%);
          border-radius: 50%;
          display: inline-block;
        }
        .footer-dark-result {
          margin-top: 34px;
          padding: 24px;
          background: #234e50;
          border-radius: 10px;
          text-align: center;
        }
        .footer-dark-result h3 {
          color: #5dbcff;
          margin: 0;
          font-size: 1.35rem;
        }
        .footer-dark-result span {
          font-weight: 700;
        }
        .spinner {
          width: 22px;
          height: 22px;
          border: 3px solid rgba(255,255,255,0.18);
          border-top-color: #5dbcff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        .spinner-btn {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(0,0,0,0.1);
          border-top-color: #5dbcff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        .spinner-small {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(0,0,0,0.1);
          border-top-color: #5dbcff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 1200px) {
          .tourist-dark-container {
            max-width: 98vw;
            padding: 10px 2vw 0 2vw;
          }
          .tourist-dark-header {
            padding: 18px 10vw;
          }
          .tourist-dark-footer {
            padding: 18px 10vw;
          }
          .tourist-dark-main {
            grid-template-columns: 1fr 400px;
            gap: 18px;
          }
        }
        @media (max-width: 900px) {
          .tourist-dark-main {
            display: flex;
            flex-direction: column;
            height: auto;
            gap: 18px;
          }
          .tourist-dark-map-section, .tourist-dark-chat-section {
            height: 350px;
            min-height: 320px;
            max-height: 400px;
          }
          .tourist-dark-footer {
            padding: 18px 8px;
          }
        }
        @media (max-width: 600px) {
          .tourist-dark-header {
            flex-direction: column;
            gap: 8px;
            padding: 10px 8px;
          }
          .tourist-dark-header h1 {
            font-size: 1.3rem;
          }
          .tourist-dark-main {
            gap: 10px;
          }
          .tourist-dark-footer {
            padding: 10px 2px;
          }
        }
        .leaflet-popup-close-button {
          top: 10px !important;
          right: 12px !important;
          width: 32px !important;
          height: 32px !important;
          font-size: 26px !important;
          background: rgba(30,40,60,0.85) !important;
          color: #fff !important;
          border-radius: 50% !important;
          box-shadow: 0 2px 8px rgba(49,131,155,0.13) !important;
          line-height: 32px !important;
          text-align: center !important;
          opacity: 1 !important;
          border: none !important;
          transition: background 0.2s;
        }
        .leaflet-popup-close-button:hover {
          background: #31839b !important;
          color: #fff !important;
        }
      `}</style>
    </div>
  );
};

export default Program;