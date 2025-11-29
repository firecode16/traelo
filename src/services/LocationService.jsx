import * as Location from 'expo-location';

class LocationService {
  static async getCurrentLocation() {
    try {
      console.log('📍 Solicitando permisos de ubicación...');

      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Permiso de ubicación denegado');
      }

      console.log('✅ Permisos concedidos, obteniendo ubicación...');

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      throw error;
    }
  }

  /**
   * 🎯 Aproximación para movimiento
   * No necesita la precisión del backend, solo detectar "¿me moví significativamente?"
   */
  static calculateSimpleDistance(lat1, lon1, lat2, lon2) {
    // Aproximación rápida y eficiente para móviles
    // Suficientemente precisa para detección de movimiento
    const latDiff = Math.abs(lat1 - lat2);
    const lonDiff = Math.abs(lon1 - lon2);

    // Aproximación optimizada para México
    const kmPerLat = 111.0;
    const kmPerLon = 111.0 * Math.cos(((lat1 + lat2) * Math.PI) / 360); // Promedio

    const distanceLat = latDiff * kmPerLat;
    const distanceLon = lonDiff * kmPerLon;

    return Math.sqrt(distanceLat * distanceLat + distanceLon * distanceLon);
  }

  /**
   * 🎯 Verificacion de movimiento
   */
  static hasSignificantLocationChange(oldLocation, newLocation, thresholdKm = 2) {
    if (!oldLocation || !newLocation) return true;

    const distance = this.calculateSimpleDistance(
      oldLocation.latitude,
      oldLocation.longitude,
      newLocation.latitude,
      newLocation.longitude,
    );

    console.log(`📏 Distancia movida: ${distance.toFixed(2)} km, Umbral: ${thresholdKm} km`,);
    return distance > thresholdKm;
  }

  /**
   * 🎯 Validación de ubicación
   */
  static isValidLocation(latitude, longitude) {
    return (
      latitude !== null &&
      longitude !== null &&
      !(latitude === 0 && longitude === 0) && // Evitar "Null Island"
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180
    );
  }

  /**
   * 🎯 Obtener dirección aproximada para UX
   */
  static async getApproximateAddress(latitude, longitude) {
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address?.[0]) {
        const addr = address[0];

        return {
          city: addr.city,
          region: addr.region,
          formatted: [addr.city, addr.region].filter(Boolean).join(', '),
        };
      }

      return null;
    } catch (error) {
      console.log('⚠️ No se pudo obtener dirección...');
      return null;
    }
  }
}

export default LocationService;
