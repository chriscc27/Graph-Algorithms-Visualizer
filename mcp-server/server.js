import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 1024,
  }
});

// Base de datos extendida de lugares turísticos
const touristPlaces = [
  { id: 1, name: "Plaza Murillo", lat: -16.4957, lon: -68.1335, type: "Plaza histórica", price: "Gratis", hours: "24 horas", description: "Plaza principal de La Paz, sede del gobierno boliviano. Rodeada de edificios coloniales y el Palacio Presidencial." },
  { id: 2, name: "Calle Jean", lat: -16.49249, lon: -68.1360778, type: "Calle comercial", price: "Gratis", hours: "9:00-22:00", description: "Zona comercial y gastronómica moderna con restaurants, cafés y tiendas." },
  { id: 3, name: "Mercado de las brujas", lat: -16.496170, lon: -68.138903, type: "Mercado tradicional", price: "Gratis entrada", hours: "8:00-19:00", description: "Mercado místico con remedios tradicionales, amuletos y productos ceremoniales aymaras." },
  { id: 4, name: "Calle Sagarnaga", lat: -16.498903, lon: -68.139882, type: "Calle turística", price: "Gratis", hours: "9:00-20:00", description: "Principal calle turística con artesanías, souvenirs típicos y textiles bolivianos." },
  { id: 5, name: "Mi teleférico (estación central)", lat: -16.4912576, lon: -68.1443202, type: "Transporte", price: "3 Bs", hours: "6:00-23:00", description: "Sistema de teleféricos urbano más extenso del mundo, excelente para vistas panorámicas." },
  { id: 6, name: "Valle de la luna", lat: -16.567094, lon: -68.093279, type: "Atracción natural", price: "15 Bs", hours: "8:00-17:00", description: "Formaciones rocosas únicas de arcilla que parecen un paisaje lunar." },
  { id: 7, name: "Parque Nacional Mallasa", lat: -16.573002, lon: -68.083308, type: "Parque natural", price: "10 Bs", hours: "8:00-18:00", description: "Área natural protegida con senderos ecológicos y vista panorámica de La Paz." },
  { id: 8, name: "Muela del diablo", lat: -16.56134019408571, lon: -68.05684814850876, type: "Montaña", price: "Gratis", hours: "6:00-18:00", description: "Formación rocosa icónica visible desde toda La Paz, ideal para senderismo." },
  { id: 9, name: "Cholitas Wrestling", lat: -16.502003489907196, lon: -68.16223138533154, type: "Espectáculo cultural", price: "80-150 Bs", hours: "Domingos 16:00", description: "Espectáculo único de lucha libre protagonizado por mujeres indígenas en polleras." },
  { id: 10, name: "Mirador Killi Killi", lat: -16.4944421144532, lon: -68.12758610869903, type: "Mirador", price: "Gratis", hours: "24 horas", description: "El mejor mirador de La Paz con vista panorámica de 360° de la ciudad y nevados." },
  { id: 11, name: "Iglesia San Francisco", lat: -16.496150005635762, lon: -68.13683730353266, type: "Iglesia histórica", price: "Gratis", hours: "6:00-20:00", description: "Impresionante iglesia colonial con fachada barroca tallada en piedra." },
  { id: 12, name: "Museo Nacional de arte", lat: -16.49585689103923, lon: -68.13414280239664, type: "Museo", price: "20 Bs", hours: "9:00-17:00", description: "Importante colección de arte boliviano desde la época colonial hasta contemporáneo." },
  { id: 13, name: "Cementerio General", lat: -16.495668719900753, lon: -68.15173139278046, type: "Cementerio histórico", price: "5 Bs", hours: "8:00-17:00", description: "Cementerio más antiguo de La Paz con mausoleos históricos y arquitectura funeraria única." },
  { id: 14, name: "Laguna de Cota Cota", lat: -16.54119683193453, lon: -68.06484887364464, type: "Laguna", price: "5 Bs", hours: "8:00-18:00", description: "Pequeña laguna en zona sur con actividades recreativas y vista al Illimani." },
  { id: 15, name: "Valle de las animas", lat: -16.52908546832394, lon: -68.02715060544136, type: "Formación natural", price: "10 Bs", hours: "8:00-17:00", description: "Impresionantes formaciones rocosas erosionadas que forman 'chimeneas de hadas'." },
  { id: 16, name: "Parque Urbano Central", lat: -16.503708595323655, lon: -68.12610910965569, type: "Parque urbano", price: "Gratis", hours: "6:00-22:00", description: "Parque central para recreación familiar con áreas verdes y juegos infantiles." },
  { id: 17, name: "Monticulo", lat: -16.51323827470809, lon: -68.12729110285417, type: "Mirador", price: "Gratis", hours: "24 horas", description: "Pequeño cerro con vista panorámica de la zona sur de La Paz." },
  { id: 18, name: "Bioparque Municipal Vesty Pakos Sofro", lat: -16.57236217342234, lon: -68.08321762474866, type: "Zoológico", price: "15 Bs", hours: "9:00-17:00", description: "Zoológico municipal con fauna boliviana y especies en recuperación." },
  { id: 19, name: "Parque de las cebras", lat: -16.519657579672216, lon: -68.1321680877114, type: "Parque temático", price: "Gratis", hours: "6:00-20:00", description: "Parque dedicado a las famosas cebras paceñas que ayudan en el tráfico." },
  { id: 20, name: "Teatro municipal Alberto Saavedra Perez", lat: -16.493577, lon: -68.134695, type: "Teatro", price: "Variable", hours: "Según función", description: "Principal teatro de La Paz con espectáculos de danza, música y obras teatrales." }
];

// Herramientas MCP disponibles
const tools = {
  searchPlaces: {
    name: "search_places",
    description: "Busca lugares turísticos según criterios específicos como tipo, precio o ubicación",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Consulta de búsqueda (nombre, descripción)" },
        type: { type: "string", description: "Tipo de lugar (museo, parque, plaza, iglesia, etc.)" },
        priceRange: { type: "string", description: "Rango de precio (gratis, económico, medio, caro)" },
        location: { type: "string", description: "Zona específica de La Paz" }
      }
    }
  },
  getPlaceDetails: {
    name: "get_place_details", 
    description: "Obtiene información detallada de un lugar turístico específico",
    parameters: {
      type: "object",
      properties: {
        placeId: { type: "number", description: "ID del lugar" },
        placeName: { type: "string", description: "Nombre del lugar" }
      }
    }
  },
  calculateRoute: {
    name: "calculate_route",
    description: "Calcula la ruta óptima entre múltiples lugares usando algoritmos de grafos",
    parameters: {
      type: "object",
      properties: {
        places: { type: "array", items: { type: "number" }, description: "IDs de los lugares a visitar" },
        startPoint: { type: "number", description: "ID del lugar de inicio (opcional)" }
      }
    }
  },
  getRecommendations: {
    name: "get_recommendations",
    description: "Genera recomendaciones personalizadas según intereses, presupuesto y tiempo",
    parameters: {
      type: "object",
      properties: {
        interests: { type: "array", items: { type: "string" }, description: "Intereses (historia, naturaleza, cultura, arte, etc.)" },
        budget: { type: "string", description: "Presupuesto disponible (bajo, medio, alto)" },
        timeAvailable: { type: "string", description: "Tiempo disponible (2 horas, medio día, día completo)" },
        groupType: { type: "string", description: "Tipo de grupo (solo, pareja, familia, amigos)" }
      }
    }
  },
  getWeatherInfo: {
    name: "get_weather_info",
    description: "Proporciona información del clima en La Paz para planificar visitas",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "Fecha para consultar el clima (opcional)" }
      }
    }
  },
  getCulturalEvents: {
    name: "get_cultural_events",
    description: "Obtiene información sobre eventos culturales y festivales en La Paz",
    parameters: {
      type: "object",
      properties: {
        month: { type: "string", description: "Mes de interés" },
        eventType: { type: "string", description: "Tipo de evento (festival, concierto, exposición, etc.)" }
      }
    }
  }
};

// Implementación de funciones de herramientas
function searchPlaces(params) {
  const { query, type, priceRange, location } = params;
  let results = [...touristPlaces];
  
  if (query) {
    const searchTerm = query.toLowerCase();
    results = results.filter(place => 
      place.name.toLowerCase().includes(searchTerm) ||
      place.description.toLowerCase().includes(searchTerm) ||
      place.type.toLowerCase().includes(searchTerm)
    );
  }
  
  if (type) {
    results = results.filter(place => 
      place.type.toLowerCase().includes(type.toLowerCase())
    );
  }
  
  if (priceRange) {
    if (priceRange.toLowerCase().includes('gratis') || priceRange.toLowerCase().includes('free')) {
      results = results.filter(place => place.price.toLowerCase().includes('gratis'));
    } else if (priceRange.toLowerCase().includes('económico') || priceRange.toLowerCase().includes('barato')) {
      results = results.filter(place => {
        const price = place.price.toLowerCase();
        return !price.includes('gratis') && (price.includes('bs') && parseInt(price) <= 10);
      });
    }
  }
  
  return {
    success: true,
    places: results,
    count: results.length,
    message: `Se encontraron ${results.length} lugares que coinciden con tu búsqueda.`
  };
}

function getPlaceDetails(params) {
  const { placeId, placeName } = params;
  let place;
  
  if (placeId) {
    place = touristPlaces.find(p => p.id === placeId);
  } else if (placeName) {
    place = touristPlaces.find(p => 
      p.name.toLowerCase().includes(placeName.toLowerCase())
    );
  }
  
  if (!place) {
    return { success: false, message: "Lugar no encontrado" };
  }
  
  // Encontrar lugares cercanos
  const nearbyPlaces = touristPlaces.filter(p => 
    p.id !== place.id && 
    Math.abs(p.lat - place.lat) < 0.02 && 
    Math.abs(p.lon - place.lon) < 0.02
  ).slice(0, 3);
  
  return {
    success: true,
    place: place,
    nearbyPlaces: nearbyPlaces,
    tips: generatePlaceTips(place)
  };
}

function calculateRoute(params) {
  const { places, startPoint } = params;
  const selectedPlaces = touristPlaces.filter(p => places.includes(p.id));
  
  if (selectedPlaces.length < 2) {
    return { success: false, message: "Se necesitan al menos 2 lugares para calcular una ruta" };
  }
  
  // Implementar algoritmo de ruta más corta (TSP aproximado)
  let route = [];
  
  if (startPoint) {
    const start = selectedPlaces.find(p => p.id === startPoint);
    if (start) {
      route = [start];
      selectedPlaces.splice(selectedPlaces.indexOf(start), 1);
    }
  }
  
  if (route.length === 0) {
    route = [selectedPlaces[0]];
    selectedPlaces.splice(0, 1);
  }
  
  let remaining = [...selectedPlaces];
  
  while (remaining.length > 0) {
    const current = route[route.length - 1];
    let nearest = remaining[0];
    let minDistance = haversineDistance(current.lat, current.lon, nearest.lat, nearest.lon);
    
    remaining.forEach(place => {
      const distance = haversineDistance(current.lat, current.lon, place.lat, place.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = place;
      }
    });
    
    route.push(nearest);
    remaining = remaining.filter(p => p.id !== nearest.id);
  }
  
  const totalDistance = route.reduce((total, place, index) => {
    if (index === 0) return 0;
    const prev = route[index - 1];
    return total + haversineDistance(prev.lat, prev.lon, place.lat, place.lon);
  }, 0);
  
  const estimatedTime = Math.ceil(totalDistance * 8 + route.length * 30); // 8 min/km + 30 min por lugar
  
  return {
    success: true,
    route: route,
    totalDistance: totalDistance.toFixed(2),
    estimatedTime: `${Math.floor(estimatedTime / 60)}h ${estimatedTime % 60}min`,
    suggestions: generateRouteSuggestions(route)
  };
}

function getRecommendations(params) {
  const { interests, budget, timeAvailable, groupType } = params;
  let recommended = [...touristPlaces];
  let score = {};
  
  // Inicializar puntuaciones
  recommended.forEach(place => {
    score[place.id] = 0;
  });
  
  // Puntuación por intereses
  if (interests && interests.length > 0) {
    recommended.forEach(place => {
      interests.forEach(interest => {
        const interestLower = interest.toLowerCase();
        if (place.type.toLowerCase().includes(interestLower) ||
            place.description.toLowerCase().includes(interestLower)) {
          score[place.id] += 2;
        }
        
        // Puntuaciones específicas
        if (interestLower.includes('historia') && 
            (place.type.includes('histórica') || place.type.includes('Iglesia') || place.name.includes('Plaza'))) {
          score[place.id] += 3;
        }
        if (interestLower.includes('naturaleza') && 
            (place.type.includes('natural') || place.type.includes('Parque') || place.type.includes('Laguna'))) {
          score[place.id] += 3;
        }
        if (interestLower.includes('cultura') && 
            (place.type.includes('Mercado') || place.type.includes('Teatro') || place.type.includes('cultural'))) {
          score[place.id] += 3;
        }
      });
    });
  }
  
  // Filtrar por presupuesto
  if (budget) {
    if (budget.toLowerCase().includes('bajo') || budget.toLowerCase().includes('gratis')) {
      recommended = recommended.filter(place => place.price.toLowerCase().includes('gratis'));
    }
  }
  
  // Limitar por tiempo disponible
  const maxPlaces = timeAvailable && timeAvailable.includes('2 horas') ? 2 : 
                   timeAvailable && timeAvailable.includes('medio') ? 4 : 
                   timeAvailable && timeAvailable.includes('día') ? 8 : 5;
  
  // Ordenar por puntuación y limitar
  recommended.sort((a, b) => (score[b.id] || 0) - (score[a.id] || 0));
  recommended = recommended.slice(0, maxPlaces);
  
  return {
    success: true,
    recommendations: recommended,
    count: recommended.length,
    suggestion: generatePersonalizedSuggestion(interests, budget, timeAvailable, groupType),
    estimatedBudget: calculateEstimatedBudget(recommended)
  };
}

function getWeatherInfo(params) {
  // Información general del clima en La Paz
  return {
    success: true,
    weather: {
      general: "La Paz tiene clima de montaña con temperaturas frescas todo el año",
      temperature: "10°C - 20°C durante el día, 0°C - 10°C por la noche",
      season: "Época seca (mayo-octubre) ideal para turismo",
      recommendations: [
        "Lleva ropa abrigada para la noche",
        "Protector solar por la altitud (3500m)",
        "Hidratación constante por la altura",
        "Evita actividades intensas los primeros días"
      ],
      bestMonths: ["Mayo", "Junio", "Julio", "Agosto", "Septiembre"]
    }
  };
}

function getCulturalEvents(params) {
  const { month, eventType } = params;
  
  const events = {
    "enero": ["Festival de Alasitas (24 enero)", "Año Nuevo Aymara"],
    "febrero": ["Carnaval de La Paz", "Festival de la Virgen de Candelaria"],
    "marzo": ["Equinoccio de Otoño", "Festival de Música Barroca"],
    "abril": ["Semana Santa", "Festival de Teatro"],
    "mayo": ["Día del Trabajo", "Festival del Gran Poder (variable)"],
    "junio": ["Inti Raymi (21 junio)", "Festival de San Juan (24 junio)"],
    "julio": ["Festival de Invierno", "Fiestas Julias"],
    "agosto": ["Festival Folklórico", "Día de la Pachamama"],
    "septiembre": ["Festival de Primavera", "Día de la Independencia"],
    "octubre": ["Festival de las Ñatitas", "Día de los Muertos preparativos"],
    "noviembre": ["Día de los Muertos (1-2 nov)", "Festival de Música Andina"],
    "diciembre": ["Navidad Andina", "Festival de Fin de Año"]
  };
  
  const monthEvents = month ? events[month.toLowerCase()] || [] : Object.values(events).flat();
  
  return {
    success: true,
    events: monthEvents,
    month: month || "todo el año",
    recommendations: "Los festivales bolivianos son únicos, con música, danza y tradiciones ancestrales"
  };
}

// Funciones auxiliares
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function generatePlaceTips(place) {
  const tips = [];
  
  if (place.type.includes('Mirador')) {
    tips.push("Mejor vista al amanecer o atardecer");
    tips.push("Lleva cámara para fotos panorámicas");
  }
  
  if (place.price.includes('Gratis')) {
    tips.push("Entrada gratuita, ideal para presupuestos ajustados");
  }
  
  if (place.type.includes('Mercado')) {
    tips.push("Perfecto para comprar souvenirs auténticos");
    tips.push("Regateo es parte de la experiencia");
  }
  
  if (place.name.includes('Valle') || place.type.includes('natural')) {
    tips.push("Lleva agua y protector solar");
    tips.push("Calzado cómodo para caminar");
  }
  
  return tips;
}

function generateRouteSuggestions(route) {
  const suggestions = [];
  
  if (route.length > 5) {
    suggestions.push("Considera dividir la ruta en dos días para disfrutar mejor cada lugar");
  }
  
  if (route.some(p => p.type.includes('natural'))) {
    suggestions.push("Incluye tiempo extra para lugares naturales, son perfectos para relajarse");
  }
  
  if (route.some(p => p.type.includes('Mercado'))) {
    suggestions.push("Los mercados son mejores por la mañana cuando hay más variedad");
  }
  
  suggestions.push("Usa el teleférico para moverte rápidamente entre zonas");
  
  return suggestions;
}

function generatePersonalizedSuggestion(interests, budget, timeAvailable, groupType) {
  let suggestion = "Basado en tus preferencias, te recomiendo ";
  
  if (interests && interests.includes('historia')) {
    suggestion += "comenzar por el centro histórico con Plaza Murillo e Iglesia San Francisco. ";
  }
  
  if (interests && interests.includes('naturaleza')) {
    suggestion += "incluir Valle de la Luna y Mirador Killi Killi para vistas espectaculares. ";
  }
  
  if (groupType === 'familia') {
    suggestion += "El Bioparque y Parque Urbano Central son perfectos para niños. ";
  }
  
  if (budget && budget.includes('bajo')) {
    suggestion += "Hay muchas opciones gratuitas como miradores y plazas. ";
  }
  
  return suggestion + "¡Disfruta tu visita a La Paz!";
}

function calculateEstimatedBudget(places) {
  const totalCost = places.reduce((total, place) => {
    if (place.price.includes('Gratis')) return total;
    const match = place.price.match(/(\d+)/);
    return total + (match ? parseInt(match[1]) : 0);
  }, 0);
  
  return {
    entrances: `${totalCost} Bs`,
    transport: "15-30 Bs (teleférico y taxis)",
    food: "50-100 Bs por persona",
    total: `${totalCost + 80} - ${totalCost + 130} Bs aproximadamente`
  };
}

// Detectar qué herramientas usar basado en el mensaje
function detectToolNeeds(message) {
  const tools = [];
  const msg = message.toLowerCase();
  
  // Búsqueda de lugares
  if (msg.includes('buscar') || msg.includes('encuentr') || msg.includes('lugares') || 
      msg.includes('dónde') || msg.includes('qué ver') || msg.includes('visitar')) {
    
    let searchParams = { query: message };
    
    // Detectar tipo específico
    if (msg.includes('museo')) searchParams.type = 'museo';
    if (msg.includes('parque')) searchParams.type = 'parque';
    if (msg.includes('iglesia')) searchParams.type = 'iglesia';
    if (msg.includes('mirador')) searchParams.type = 'mirador';
    if (msg.includes('mercado')) searchParams.type = 'mercado';
    
    // Detectar presupuesto
    if (msg.includes('gratis') || msg.includes('sin costo') || msg.includes('gratuito')) {
      searchParams.priceRange = 'gratis';
    }
    
    tools.push({ tool: 'search_places', params: searchParams });
  }
  
  // Información detallada de un lugar
  if (msg.includes('información') || msg.includes('detalles') || msg.includes('cuéntame sobre')) {
    const mentionedPlace = touristPlaces.find(place => 
      msg.includes(place.name.toLowerCase())
    );
    if (mentionedPlace) {
      tools.push({ tool: 'get_place_details', params: { placeId: mentionedPlace.id } });
    }
  }
  
  // Cálculo de rutas
  if (msg.includes('ruta') || msg.includes('recorrido') || msg.includes('cómo llegar') || 
      msg.includes('itinerario') || msg.includes('orden')) {
    const mentionedPlaces = touristPlaces.filter(place => 
      msg.includes(place.name.toLowerCase())
    );
    if (mentionedPlaces.length >= 2) {
      tools.push({ 
        tool: 'calculate_route', 
        params: { places: mentionedPlaces.map(p => p.id) }
      });
    }
  }
  
  // Recomendaciones
  if (msg.includes('recomienda') || msg.includes('sugieres') || msg.includes('qué visitar') ||
      msg.includes('plan') || msg.includes('itinerario') || msg.includes('día')) {
    
    const interests = [];
    const timePatterns = ['2 horas', 'medio día', 'día completo', 'una mañana', 'una tarde'];
    
    // Detectar intereses
    if (msg.includes('historia') || msg.includes('histórico') || msg.includes('colonial')) interests.push('historia');
    if (msg.includes('naturaleza') || msg.includes('parque') || msg.includes('aire libre')) interests.push('naturaleza');
    if (msg.includes('cultura') || msg.includes('tradición') || msg.includes('folklore')) interests.push('cultura');
    if (msg.includes('arte') || msg.includes('museo')) interests.push('arte');
    if (msg.includes('religión') || msg.includes('iglesia')) interests.push('religión');
    
    // Detectar tiempo disponible
    let timeAvailable = 'día completo';
    for (const pattern of timePatterns) {
      if (msg.includes(pattern)) {
        timeAvailable = pattern;
        break;
      }
    }
    
    // Detectar presupuesto
    let budget = 'medio';
    if (msg.includes('barato') || msg.includes('económico') || msg.includes('poco dinero')) budget = 'bajo';
    if (msg.includes('sin límite') || msg.includes('cualquier precio')) budget = 'alto';
    
    // Detectar tipo de grupo
    let groupType = 'general';
    if (msg.includes('familia') || msg.includes('niños')) groupType = 'familia';
    if (msg.includes('pareja') || msg.includes('romántico')) groupType = 'pareja';
    if (msg.includes('solo') || msg.includes('solitario')) groupType = 'solo';
    if (msg.includes('amigos') || msg.includes('grupo')) groupType = 'amigos';
    
    tools.push({ 
      tool: 'get_recommendations', 
      params: { interests, budget, timeAvailable, groupType }
    });
  }
  
  // Información del clima
  if (msg.includes('clima') || msg.includes('tiempo') || msg.includes('temperatura') ||
      msg.includes('lluvia') || msg.includes('frío')) {
    tools.push({ tool: 'get_weather_info', params: {} });
  }
  
  // Eventos culturales
  if (msg.includes('evento') || msg.includes('festival') || msg.includes('fiesta') ||
      msg.includes('celebración') || msg.includes('cultura')) {
    let month = null;
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    for (const m of months) {
      if (msg.includes(m)) {
        month = m;
        break;
      }
    }
    
    tools.push({ tool: 'get_cultural_events', params: { month } });
  }
  
  return tools;
}

// Ejecutar herramienta específica
function executeTool(toolName, params) {
  switch (toolName) {
    case 'search_places':
      return searchPlaces(params);
    case 'get_place_details':
      return getPlaceDetails(params);
    case 'calculate_route':
      return calculateRoute(params);
    case 'get_recommendations':
      return getRecommendations(params);
    case 'get_weather_info':
      return getWeatherInfo(params);
    case 'get_cultural_events':
      return getCulturalEvents(params);
    default:
      return { success: false, message: 'Herramienta no encontrada' };
  }
}

// Endpoint principal de chat con Gemini + MCP
app.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    console.log('🤖 Procesando mensaje:', message);
    
    // Detectar si necesita usar herramientas
    const needsTools = detectToolNeeds(message);
    console.log('🔧 Herramientas detectadas:', needsTools.map(t => t.tool));
    
    let toolResults = {};
    let toolsUsed = [];
    
    // Ejecutar herramientas necesarias
    if (needsTools.length > 0) {
      for (const toolCall of needsTools) {
        console.log(`🛠️ Ejecutando ${toolCall.tool} con parámetros:`, toolCall.params);
        const toolResult = executeTool(toolCall.tool, toolCall.params);
        toolResults[toolCall.tool] = toolResult;
        toolsUsed.push(toolCall.tool);
        console.log(`✅ Resultado de ${toolCall.tool}:`, toolResult.success ? 'Éxito' : 'Error');
      }
    }
    
    // Crear prompt para Gemini con contexto de herramientas
    const systemPrompt = `Eres un asistente turístico especializado en La Paz, Bolivia. Eres amigable, conocedor y entusiasta.

INFORMACIÓN DE CONTEXTO:
- La Paz está a 3500m de altitud, clima fresco todo el año
- Es la capital administrativa de Bolivia
- Rica en cultura aymara y colonial
- Famosa por sus teleféricos, mercados y vistas panorámicas

TU PERSONALIDAD:
- Entusiasta y conocedor de La Paz
- Amigable y servicial
- Das recomendaciones prácticas
- Incluyes datos culturales interesantes
- Hablas con calidez boliviana

HERRAMIENTAS DISPONIBLES:
${Object.values(tools).map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

${toolsUsed.length > 0 ? `RESULTADOS DE HERRAMIENTAS UTILIZADAS:
${toolsUsed.map(tool => `${tool}: ${JSON.stringify(toolResults[tool], null, 2)}`).join('\n\n')}` : ''}

INSTRUCCIONES:
1. Usa la información de las herramientas para dar respuestas precisas y útiles
2. Si hay resultados de herramientas, úsalos para responder específicamente
3. Incluye detalles prácticos como precios, horarios y ubicaciones cuando sea relevante
4. Da consejos útiles sobre la visita a La Paz
5. Sé conversacional y amigable
6. Si no se usaron herramientas, responde con tu conocimiento general sobre La Paz

Mensaje del usuario: ${message}

Responde de manera natural y útil, usando la información de las herramientas si están disponibles:`;

    // Generar respuesta con Gemini
    const result = await model.generateContent(systemPrompt);
    const aiResponse = result.response.text();
    
    console.log('✅ Respuesta generada por Gemini');
    
    res.json({
      success: true,
      response: aiResponse,
      toolsUsed: toolsUsed,
      toolResults: needsTools.length > 0 ? toolResults : undefined
    });
    
  } catch (error) {
    console.error('❌ Error en chat:', error);
    res.status(500).json({
      success: false,
      error: 'Error procesando solicitud',
      details: error.message
    });
  }
});

// Endpoints adicionales
app.get('/places', (req, res) => {
  res.json({ success: true, places: touristPlaces });
});

app.get('/tools', (req, res) => {
  res.json({ success: true, tools: Object.values(tools) });
});

app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'Server running', 
    timestamp: new Date().toISOString(),
    places: touristPlaces.length,
    tools: Object.keys(tools).length
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('🚀 MCP Tourism Server corriendo en puerto', PORT);
  console.log('🤖 Gemini AI integrado con', touristPlaces.length, 'lugares turísticos');
  console.log('🛠️ Herramientas MCP disponibles:', Object.keys(tools).length);
  console.log('📍 Listo para asistir turistas en La Paz, Bolivia!');
});

export default app;
