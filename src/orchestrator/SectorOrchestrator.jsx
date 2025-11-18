import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLOR } from '../constants/Color';
import FoodMenu from '../screens/business/food/FoodMenu';
import FashionAndShoesCatalog from '../screens/business/fashion/FashionAndShoesCatalog';
import TechnologyCatalog from '../screens/business/technology/TechnologyCatalog';
import HardwareStoreCatalog from '../screens/business/hardware/HardwareStoreCatalog';

const sectorComponents = {
  food: FoodMenu,
  fashion: FashionAndShoesCatalog,
  technology: TechnologyCatalog,
  hardware: HardwareStoreCatalog,
};

const SectorOrchestrator = ({ route, navigation }) => {
  const { sector } = route.params || {};
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('SectorOrchestrator - route.params:', route.params);

    if (sector) {
      setLoading(false);
    } else {
      // Si no hay sector después de un tiempo, dejar de cargar
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sector, route.params]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLOR.green} />
        <Text style={styles.loadingText}>Cargando sector...</Text>
      </View>
    );
  }

  if (!sector || !sector.name) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          No se pudo cargar la información del sector
        </Text>
        <Text style={styles.fallbackSubtext}>
          Sector: {JSON.stringify(sector)}
        </Text>
      </View>
    );
  }

  const SectorComponent = sectorComponents[sector.name];

  if (!SectorComponent) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          Sector no disponible: {sector.name}
        </Text>
        <Text style={styles.fallbackSubtext}>
          Sectores disponibles: {Object.keys(sectorComponents).join(', ')}
        </Text>
      </View>
    );
  }

  return <SectorComponent navigation={navigation} route={route} />;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR.white,
    padding: 20,
  },
  fallbackText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  fallbackSubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SectorOrchestrator;
