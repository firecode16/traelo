import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationService from '../services/LocationService';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation debe usarse dentro de LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Cargar ubicación guardada al iniciar
  useEffect(() => {
    loadSavedLocation();
  }, []);

  const loadSavedLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem('userLocation');
      if (savedLocation) {
        setUserLocation(JSON.parse(savedLocation));
      }
    } catch (error) {
      console.error('Error cargando ubicación guardada:', error);
    }
  };

  const saveLocation = async (location) => {
    try {
      await AsyncStorage.setItem('userLocation', JSON.stringify(location));
    } catch (error) {
      console.error('Error guardando ubicación:', error);
    }
  };

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setLocationError(null);

    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
      await saveLocation(location);
      return location;
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setLocationError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearLocation = async () => {
    setUserLocation(null);
    setLocationError(null);
    await AsyncStorage.removeItem('userLocation');
  };

  const value = {
    userLocation,
    isLoading,
    locationError,
    getCurrentLocation,
    clearLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
