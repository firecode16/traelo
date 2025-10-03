import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FoodAndDrinkScreen from '../screens/mall/food/FoodAndDrinkScreen';
import FashionAndShoeScreen from '../screens/mall/fashion/FashionAndShoeScreen';
import TechnologyScreen from '../screens/mall/technology/TechnologyScreen';
import HardwareStoreScreen from '../screens/mall/hardware/HardwareStoreScreen';
import PharmacyScreen from '../screens/mall/pharmacy/PharmacyScreen';
import { COLOR } from '../constants/Color';

const sectorScreens = {
  food: FoodAndDrinkScreen,
  fashion: FashionAndShoeScreen,
  technology: TechnologyScreen,
  hardware: HardwareStoreScreen,
  pharmacy: PharmacyScreen,
};

const MallOrchestrator = ({ route, navigation }) => {
  const { sector } = route.params || {};

  // Obtener el componente correspondiente al sector
  const SectorScreen = sectorScreens[sector];

  if (!SectorScreen) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Sector no disponible</Text>
      </View>
    );
  }

  return <SectorScreen navigation={navigation} route={route} />;
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR.white,
  },
  fallbackText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: COLOR.gray,
  },
});

export default MallOrchestrator;
