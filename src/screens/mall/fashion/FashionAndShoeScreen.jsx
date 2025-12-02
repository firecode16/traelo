import React, { useEffect, useState, useRef, useCallback, use } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';

import { COLOR } from '../../../constants/Color';

const FashionAndShoeScreen = ({ navigation, route }) => {
  const { sector } = route.params || {};

  useEffect(() => {
    console.log('🚀 mounted - sector:', sector);
  }, [sector]);

  return (
    <View style={styles.container}>
      <StatusBar animated={true} style="light" />
      <Text style={styles.title}>👟👕 Moda & Calzado, proximamente...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.lightGray,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    lineHeight: 22,
  },
});
export default FashionAndShoeScreen;
