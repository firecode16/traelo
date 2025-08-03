import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const LogoTraeloHeaderTitle = () => (
  <View style={styles.container}>
    <Image
      source={require('../assets/images/logo_header_title.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#f97316',
  },
});

export default LogoTraeloHeaderTitle;
