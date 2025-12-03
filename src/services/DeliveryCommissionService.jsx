/**
 * Servicio para cálculo de comisiones de entrega basadas en ubicación
 * Maneja cálculos de distancia, validación de cobertura y ajuste de comisiones
 */

// Constantes de configuración
export const MAX_DISTANCE_KM = 5.0; // Radio máximo de cobertura en kilómetros

const MIN_COMMISSION = 10; // Comisión mínima en pesos
const DISTANCE_THRESHOLDS = {
  VERY_CLOSE: 0.5, // 0-0.5 km (misma zona exacta)
  CLOSE: 5, // 0.5-5 km (zona cercana)
  MEDIUM: 10, // 5-10 km (zona media)
  FAR: 15, // 10-15 km (zona lejana)
  VERY_FAR: 20, // 15-20 km (zona extrema)
};

/**
 * Calcula la distancia entre dos coordenadas usando la fórmula Haversine
 * @param {number} lat1 - Latitud punto 1
 * @param {number} lon1 - Longitud punto 1
 * @param {number} lat2 - Latitud punto 2
 * @param {number} lon2 - Longitud punto 2
 * @returns {number} Distancia en kilómetros
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distancia en km
};

/**
 * Extrae coordenadas de diferentes formatos posibles
 * @param {any} coordinates - Coordenadas en formato variable
 * @returns {Object|null} Coordenadas normalizadas {latitude, longitude}
 */
const extractCoordinates = (coordinates) => {
  if (!coordinates) return null;

  // Formato 1: Objeto directo {latitude, longitude}
  if (typeof coordinates === 'object' && coordinates.latitude && coordinates.longitude) {
    return {
      latitude: parseFloat(coordinates.latitude),
      longitude: parseFloat(coordinates.longitude),
    };
  }

  // Formato 2: Array de números [lat, lon]
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    if (typeof coordinates[0] === 'number') {
      return {
        latitude: parseFloat(coordinates[0]),
        longitude: parseFloat(coordinates[1]),
      };
    }

    // Formato 3: Array de objetos [{latitude, longitude}]
    if (typeof coordinates[0] === 'object' && coordinates[0].latitude && coordinates[0].longitude) {
      return {
        latitude: parseFloat(coordinates[0].latitude),
        longitude: parseFloat(coordinates[0].longitude),
      };
    }
  }

  // Formato 4: String con formato "lat,lon"
  if (typeof coordinates === 'string') {
    const parts = coordinates.split(',').map((coord) => parseFloat(coord.trim()));
    
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return {
        latitude: parts[0],
        longitude: parts[1],
      };
    }
  }

  return null;
};

/**
 * Encuentra la zona de comisión más cercana al usuario
 * @param {Object} userCoords - Coordenadas del usuario {latitude, longitude}
 * @param {Array} zoneCommissions - Array de zonas de comisión del negocio
 * @returns {Object|null} Objeto con zona más cercana y distancia
 */
const findNearestZone = (userCoords, zoneCommissions) => {
  if (!zoneCommissions || !Array.isArray(zoneCommissions) || zoneCommissions.length === 0) {
    return null;
  }

  let nearestZone = null;
  let minDistance = Infinity;
  let nearestIndex = -1;

  zoneCommissions.forEach((zone, index) => {
    // Saltar zonas inactivas
    if (zone.active === false) return;

    const zoneCoords = extractCoordinates(zone.coordinates);
    if (!zoneCoords) return;

    const distance = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      zoneCoords.latitude,
      zoneCoords.longitude,
    );

    // Solo considerar si es la más cercana
    if (distance < minDistance) {
      minDistance = distance;
      nearestZone = {
        ...zone,
        zoneCoords,
        distance,
      };
      nearestIndex = index;
    }
  });

  return nearestZone
    ? {
        zone: nearestZone,
        distance: minDistance,
        index: nearestIndex,
      }
    : null;
};

/**
 * Determina el factor de ajuste basado en la distancia y sector
 * @param {number} distance - Distancia en km
 * @param {string} sector - Sector del negocio
 * @returns {number} Factor de ajuste (0-1)
 */
const getAdjustmentFactor = (distance, sector) => {
  let baseFactor = 1.0;

  // Ajuste por distancia
  if (distance <= DISTANCE_THRESHOLDS.VERY_CLOSE) {
    baseFactor = 1.0; // 100% de la comisión base
  } else if (distance <= DISTANCE_THRESHOLDS.CLOSE) {
    baseFactor = 0.9; // 90% de la comisión base
  } else if (distance <= DISTANCE_THRESHOLDS.MEDIUM) {
    baseFactor = 0.75; // 75% de la comisión base
  } else if (distance <= DISTANCE_THRESHOLDS.FAR) {
    baseFactor = 0.6; // 60% de la comisión base
  } else if (distance <= DISTANCE_THRESHOLDS.VERY_FAR) {
    baseFactor = 0.45; // 45% de la comisión base
  } else {
    baseFactor = 0.3; // 30% de la comisión base (para casos extremos dentro del límite)
  }

  // Ajuste por sector
  let sectorMultiplier = 1.0;
  switch (sector?.toLowerCase()) {
    case 'food':
      sectorMultiplier = 0.8; // Comisiones más bajas para comida
      break;
    case 'fashion':
      sectorMultiplier = 0.9; // Ligeramente más bajo para moda
      break;
    case 'technology':
      sectorMultiplier = 1.1; // Más alto para tecnología
      break;
    case 'hardware':
      sectorMultiplier = 1.0; // Estándar para ferretería
      break;
    case 'pharmacy':
      sectorMultiplier = 0.85; // Moderado para farmacia
      break;
    default:
      sectorMultiplier = 1.0;
  }

  return baseFactor * sectorMultiplier;
};

/**
 * Ajusta la comisión base según la distancia y sector
 * @param {number} baseCommission - Comisión base de la zona
 * @param {number} distance - Distancia en km
 * @param {string} sector - Sector del negocio
 * @returns {number} Comisión ajustada
 */
const calculateAdjustedCommission = (baseCommission, distance, sector) => {
  if (baseCommission <= 0) return 0;

  const adjustmentFactor = getAdjustmentFactor(distance, sector);
  let adjustedCommission = baseCommission * adjustmentFactor;

  // Asegurar comisión mínima
  adjustedCommission = Math.max(MIN_COMMISSION, adjustedCommission);

  // No superar la comisión base
  adjustedCommission = Math.min(baseCommission, adjustedCommission);

  // Redondear a múltiplos de 5 para precios comerciales
  adjustedCommission = Math.round(adjustedCommission / 5) * 5;

  return Math.max(MIN_COMMISSION, adjustedCommission);
};

/**
 * Obtiene un mensaje descriptivo basado en la distancia
 * @param {number} distance - Distancia en km
 * @returns {string} Mensaje descriptivo
 */
const getDistanceMessage = (distance) => {
  if (distance <= DISTANCE_THRESHOLDS.VERY_CLOSE) {
    return 'Envío en zona exacta';
  } else if (distance <= DISTANCE_THRESHOLDS.CLOSE) {
    return 'Envío en zona cercana';
  } else if (distance <= DISTANCE_THRESHOLDS.MEDIUM) {
    return 'Envío en zona media';
  } else if (distance <= DISTANCE_THRESHOLDS.FAR) {
    return 'Envío en zona lejana';
  } else if (distance <= DISTANCE_THRESHOLDS.VERY_FAR) {
    return 'Envío en zona extrema';
  } else {
    return 'Envío a distancia especial';
  }
};

/**
 * Calcula la comisión de entrega basada en la ubicación del usuario
 * @param {Object} userCoords - Coordenadas del usuario {latitude, longitude}
 * @param {Object} business - Objeto del negocio con zoneCommissions
 * @param {string} deliveryMethod - Método de entrega ('A domicilio' o 'Para recoger')
 * @param {string} sector - Sector del negocio
 * @returns {Object} Objeto con datos de comisión
 */
export const calculateDeliveryCommission = (userCoords, business, deliveryMethod, sector) => {
  if (!userCoords || !userCoords.latitude || !userCoords.longitude) {
    return {
      commission: 0,
      isFree: false,
      message: '📍 Ubicación no seleccionada',
      zone: null,
      distance: null,
      isValid: false,
      errorCode: 'NO_LOCATION',
    };
  }

  if (deliveryMethod !== 'A domicilio') {
    return {
      commission: 0,
      isFree: true,
      message: '🛍️ Recogida en tienda',
      zone: null,
      distance: null,
      isValid: true,
      errorCode: null,
    };
  }

  if (!business || !business.zoneCommissions || !Array.isArray(business.zoneCommissions)) {
    return {
      commission: 0,
      isFree: true,
      message: '📋 Sin comisiones configuradas',
      zone: null,
      distance: null,
      isValid: true,
      errorCode: 'NO_COMMISSIONS',
    };
  }

  // Buscar zona más cercana
  const nearest = findNearestZone(userCoords, business.zoneCommissions);

  if (!nearest) {
    return {
      commission: 0,
      isFree: false,
      message: `🚫 Fuera de zona de cobertura\n(No se encontraron zonas cercanas)`,
      zone: null,
      distance: null,
      isValid: false,
      errorCode: 'NO_ZONES_FOUND',
    };
  }

  const { zone, distance } = nearest;

  // Validación de distancia máxima
  if (distance > MAX_DISTANCE_KM) {
    return {
      commission: 0,
      isFree: false,
      message: `🚫 Fuera de zona de cobertura\n(${distance.toFixed(1)} km > ${MAX_DISTANCE_KM} km permitidos)`,
      zone: null,
      distance: distance,
      isValid: false,
      errorCode: 'EXCEEDS_MAX_DISTANCE',
    };
  }

  // CASO 1: Envío gratis configurado
  if (zone.selectedOption === 'free') {
    return {
      commission: 0,
      isFree: true,
      message: '🎉 ¡Envío Gratis!',
      zone: zone,
      distance: distance,
      isValid: true,
      errorCode: null,
    };
  }

  const baseCommission = zone.commissionAmount || 0;

  // CASO 2: Comisión base es 0
  if (baseCommission === 0) {
    return {
      commission: 0,
      isFree: true,
      message: '🎉 ¡Envío Gratis!',
      zone: zone,
      distance: distance,
      isValid: true,
      errorCode: null,
    };
  }

  // CASO 3: Usuario en la misma zona exacta
  if (distance <= DISTANCE_THRESHOLDS.VERY_CLOSE) {
    return {
      commission: baseCommission,
      isFree: false,
      message: `📦 ${getDistanceMessage(distance)}\nComisión base aplicada`,
      zone: zone,
      distance: distance,
      isValid: true,
      errorCode: null,
    };
  }

  // CASO 4: Cálculo de comisión ajustada
  const adjustedCommission = calculateAdjustedCommission(baseCommission, distance, sector);
  const distanceMessage = getDistanceMessage(distance);

  return {
    commission: adjustedCommission,
    isFree: adjustedCommission === 0,
    message: `📦 ${distanceMessage}\nComisión ajustada por distancia`,
    zone: zone,
    distance: distance,
    isValid: true,
    errorCode: null,
  };
};

/**
 * Valida si la ubicación está dentro de la cobertura del negocio
 * @param {Object} userCoords - Coordenadas del usuario
 * @param {Object} business - Objeto del negocio
 * @returns {Object} Resultado de validación
 */
export const validateDeliveryCoverage = (userCoords, business) => {
  if (!userCoords || !userCoords.latitude || !userCoords.longitude) {
    return {
      isValid: false,
      message: 'Ubicación no especificada',
      distance: null,
      errorCode: 'NO_LOCATION',
      type: 'error',
    };
  }

  if (!business || !business.zoneCommissions || !Array.isArray(business.zoneCommissions)) {
    return {
      isValid: true,
      message: 'Negocio sin zonas de comisión configuradas',
      distance: null,
      errorCode: 'NO_COMMISSIONS',
      type: 'info',
    };
  }

  // Buscar zona más cercana
  const nearest = findNearestZone(userCoords, business.zoneCommissions);

  if (!nearest) {
    return {
      isValid: false,
      message: 'No se encontraron zonas de cobertura cercanas',
      distance: null,
      errorCode: 'NO_ZONES_FOUND',
      type: 'error',
    };
  }

  const { distance, zone } = nearest;

  // Verificar si está dentro del radio máximo
  if (distance > MAX_DISTANCE_KM) {
    return {
      isValid: false,
      message: `Fuera del área de cobertura\n(${distance.toFixed(1)} km de distancia)`,
      distance: distance,
      nearestZone: zone,
      errorCode: 'EXCEEDS_MAX_DISTANCE',
      type: 'error',
      details: `Radio máximo: ${MAX_DISTANCE_KM} km\nDistancia actual: ${distance.toFixed(1)} km`,
    };
  }

  // Determinar tipo de mensaje basado en la distancia
  let messageType = 'success';
  let messagePrefix = '✅';

  if (distance > 15) {
    messageType = 'warning';
    messagePrefix = '⚠️';
  } else if (distance > 10) {
    messageType = 'info';
    messagePrefix = 'ℹ️';
  }

  return {
    isValid: true,
    message: `${messagePrefix} Dentro del área de cobertura\n(${distance.toFixed(1)} km de distancia)`,
    distance: distance,
    nearestZone: zone,
    errorCode: null,
    type: messageType,
    details: `Distancia: ${distance.toFixed(1)} km\nRadio permitido: ${MAX_DISTANCE_KM} km`,
  };
};

/**
 * Calcula los totales del pedido incluyendo comisión
 * @param {Array} cartItems - Array de items del carrito
 * @param {Object} commissionData - Datos de comisión
 * @returns {Object} Totales calculados
 */
export const calculateOrderTotals = (cartItems, commissionData) => {
  // Calcular subtotal
  const subtotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);

  // Obtener comisión
  const commission = commissionData?.commission || 0;
  const total = subtotal + commission;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    commission: parseFloat(commission.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    isFreeDelivery: commissionData?.isFree || false,
    isValid: commissionData?.isValid !== false,
    commissionData: commissionData,
  };
};

/**
 * Obtiene información detallada sobre la comisión para mostrar al usuario
 * @param {Object} commissionData - Datos de comisión
 * @returns {Object} Información formateada para UI
 */
export const getCommissionInfo = (commissionData) => {
  if (!commissionData) {
    return {
      title: 'Comisión de envío',
      description: 'Selecciona una ubicación para calcular la comisión',
      amount: 0,
      isFree: false,
      isValid: false,
      icon: 'location-outline',
      color: '#666',
    };
  }

  if (!commissionData.isValid) {
    return {
      title: 'Fuera de cobertura',
      description: commissionData.message || 'Ubicación no válida',
      amount: 0,
      isFree: false,
      isValid: false,
      icon: 'close-circle',
      color: '#f44336',
    };
  }

  if (commissionData.isFree) {
    return {
      title: '🎉 ¡Envío Gratis!',
      description: 'No hay costo de envío para esta ubicación',
      amount: 0,
      isFree: true,
      isValid: true,
      icon: 'gift',
      color: '#4caf50',
    };
  }

  const distanceText = commissionData.distance ? ` (${commissionData.distance.toFixed(1)} km)` : '';

  return {
    title: 'Comisión de envío',
    description: `${commissionData.message || 'Costo de entrega'}${distanceText}`,
    amount: commissionData.commission,
    isFree: false,
    isValid: true,
    icon: 'rocket',
    color: '#ff9800',
  };
};

/**
 * Verifica si un punto está dentro de un polígono (para zonas complejas)
 * @param {Object} point - Punto a verificar {latitude, longitude}
 * @param {Array} polygon - Array de puntos del polígono
 * @returns {boolean} True si el punto está dentro del polígono
 */
export const isPointInPolygon = (point, polygon) => {
  if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
    return false;
  }

  const x = point.longitude;
  const y = point.latitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude || polygon[i].lng;
    const yi = polygon[i].latitude || polygon[i].lat;
    const xj = polygon[j].longitude || polygon[j].lng;
    const yj = polygon[j].latitude || polygon[j].lat;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

const DeliveryCommissionService = {
  calculateDistance,
  calculateDeliveryCommission,
  validateDeliveryCoverage,
  calculateOrderTotals,
  getCommissionInfo,
  isPointInPolygon,
  MAX_DISTANCE_KM,
  DISTANCE_THRESHOLDS,
  MIN_COMMISSION,
};

export default DeliveryCommissionService;
