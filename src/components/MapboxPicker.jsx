import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import MapboxGL from '@rnmapbox/maps';
import { MAP } from '../constants/ApiMaps';

MapboxGL.setAccessToken(MAP.MAPBOX_ACCESS_TOKEN);

const DEFAULT_ZOOM = 15;
const DEFAULT_LATITUDE = 19.4326;
const DEFAULT_LONGITUDE = -99.1332;

export default function MapboxPicker({ latitude, longitude, onLocationChange, }) {
  const [selectedCoords, setSelectedCoords] = useState({
    lat: latitude || DEFAULT_LATITUDE,
    lng: longitude || DEFAULT_LONGITUDE,
  });
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const cameraRef = useRef(null);
  const mapRef = useRef(null);
  const geocodeTimeoutRef = useRef(null);
  const lastCoordsRef = useRef(selectedCoords);
  const isUserInteractingRef = useRef(false);

  // Geocodificación inversa
  const reverseGeocodeMapbox = useCallback(
    async (lat, lng, updateOnLocationChange = true) => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAP.MAPBOX_ACCESS_TOKEN}&types=address,place,locality,neighborhood&language=es&limit=1`;

        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Token de Mapbox inválido o expirado');
          }
          throw new Error(`Error en geocodificación: ${response.status}`);
        }

        const data = await response.json();
        let displayName = 'Ubicación seleccionada';

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          displayName = feature.place_name || feature.text || displayName;
        }

        setAddress(displayName);
        if (updateOnLocationChange) {
          onLocationChange?.({ lat, lng, display_name: displayName });
        }
      } catch (error) {
        console.error('Error en geocodificación Mapbox:', error);
        let errorMessage = 'Error al obtener la dirección';

        if (error.message.includes('401')) {
          errorMessage = 'Problema de autenticación con Mapbox';
        }

        const fallbackName = `${errorMessage} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setAddress(fallbackName);
        if (updateOnLocationChange) {
          onLocationChange?.({ lat, lng, display_name: fallbackName });
        }
      }
    },
    [onLocationChange],
  );

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined && !isUserInteractingRef.current) {
      const newCoords = { lat: latitude, lng: longitude };
      const shouldUpdate = Math.abs(newCoords.lat - lastCoordsRef.current.lat) > 0.0001 || Math.abs(newCoords.lng - lastCoordsRef.current.lng) > 0.0001;

      if (shouldUpdate) {
        setSelectedCoords(newCoords);
        lastCoordsRef.current = newCoords;

        if (cameraRef.current && isMapReady) {
          cameraRef.current.flyTo([newCoords.lng, newCoords.lat], 500);
        }

        reverseGeocodeMapbox(newCoords.lat, newCoords.lng);
      }
    }
  }, [latitude, longitude, isMapReady, reverseGeocodeMapbox]);

  // Obtención de ubicación actual
  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permiso de ubicación denegado');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude: currentLat, longitude: currentLng } = loc.coords;
      const newCoords = { lat: currentLat, lng: currentLng };

      setSelectedCoords(newCoords);
      lastCoordsRef.current = newCoords;
      reverseGeocodeMapbox(currentLat, currentLng);

      if (cameraRef.current && isMapReady) {
        cameraRef.current.flyTo([currentLng, currentLat], 1000);
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    } finally {
      setLoading(false);
    }
  }, [isMapReady, reverseGeocodeMapbox]);

  // Inicialización del mapa
  const onMapLoaded = useCallback(() => {
    setIsMapReady(true);

    if (latitude === undefined || longitude === undefined) {
      getCurrentLocation();
    } else {
      reverseGeocodeMapbox(latitude, longitude);
    }
  }, [latitude, longitude, getCurrentLocation, reverseGeocodeMapbox]);

  const handleCameraChanged = useCallback((e) => {
    if (e.properties && e.properties.isUserInteraction) {
      isUserInteractingRef.current = true;
    }
  }, []);

  const handleMapIdle = useCallback(() => {
    if (mapRef.current && isMapReady) {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }

      geocodeTimeoutRef.current = setTimeout(async () => {
        try {
          const center = await mapRef.current.getCenter();
          if (center) {
            const [lng, lat] = center;
            const newCoords = { lat, lng };

            const shouldUpdate =
              Math.abs(newCoords.lat - lastCoordsRef.current.lat) > 0.0001 ||
              Math.abs(newCoords.lng - lastCoordsRef.current.lng) > 0.0001;

            if (shouldUpdate) {
              setSelectedCoords(newCoords);
              lastCoordsRef.current = newCoords;
              reverseGeocodeMapbox(lat, lng);
            }
          }
        } catch (error) {
          console.error('Error obteniendo centro del mapa:', error);
        }

        isUserInteractingRef.current = false;
      }, 400);
    }
  }, [isMapReady, reverseGeocodeMapbox]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL="mapbox://styles/mapbox/streets-v11"
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        logoEnabled={false}
        compassEnabled={false}
        attributionEnabled={false}
        localizeLabels={true}
        onDidFinishLoadingMap={onMapLoaded}
        onMapIdle={handleMapIdle}
        onCameraChanged={handleCameraChanged}
        surfaceView={true}
        renderMode={'continuous'}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={DEFAULT_ZOOM}
          centerCoordinate={[selectedCoords.lng, selectedCoords.lat]}
          animationMode="flyTo"
          animationDuration={800}
        />

        {/* Mostrar ubicación del usuario */}
        <MapboxGL.UserLocation
          visible={true}
          androidRenderMode={'normal'}
          showsUserHeadingIndicator={true}
        />
      </MapboxGL.MapView>

      {/* Marcador estático en el centro */}
      <View style={styles.staticMarkerOverlay}>
        <View style={styles.staticMarker}>
          <View style={styles.markerPulse} />
          <View style={styles.markerInner} />
        </View>
      </View>

      {/* Panel de información de dirección */}
      <View style={styles.addressContainer}>
        <Text style={styles.addressText} numberOfLines={2}>
          {address || 'Mueve el mapa para seleccionar una ubicación'}
        </Text>
        <Text style={styles.coordinatesText}>
          {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={getCurrentLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Mi ubicación</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    minHeight: 300,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  staticMarkerOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -48,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  staticMarker: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 204, 134, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 204, 134, 0.4)',
  },
  markerInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00CC86',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addressContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  addressText: {
    color: '#111827',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    marginBottom: 2,
  },
  coordinatesText: {
    color: '#6B7280',
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  button: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: '#00CC86',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 4,
  },
});
