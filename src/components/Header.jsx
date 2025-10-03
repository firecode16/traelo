import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR } from '../constants/Color';

export default function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>TRAELO</Text>
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.addressText}>
              Delivery to 1234 Valley Blvd.
            </Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar comida, moda, calzado, tecnologia..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLOR.green,
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  innerContainer: {
    maxWidth: 360,
    alignSelf: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoText: {
    fontFamily: 'Roboto-Medium',
    color: '#FFFFFF',
    fontSize: 23,
    marginBottom: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontFamily: 'Roboto-Regular',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingLeft: 44,
    paddingRight: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
