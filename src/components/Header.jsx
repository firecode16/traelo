import React, { useState, useEffect, useCallback } from 'react';
import { 
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR } from '../constants/Color';
import LocationService from '../services/LocationService';
import debounce from 'lodash/debounce';

export default function Header({ navigation, onSearchChange, onSearchClear, searchQuery = '' }) {
  const [address, setAddress] = useState('Obteniendo ubicación...');
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Debounced search para evitar demasiados re-renders
  const debouncedSearch = useCallback(
    debounce((query) => {
      onSearchChange(query);
    }, 300),
    [onSearchChange]
  );

  // Sincronizar localSearchQuery con searchQuery prop
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setIsLocationLoading(true);
      console.log('📍 Obteniendo ubicación actual...');
      
      const location = await LocationService.getCurrentLocation();
      
      const addressInfo = await LocationService.getApproximateAddress(
        location.latitude,
        location.longitude
      );
      
      if (addressInfo) {
        setAddress(addressInfo.formatted || 'Ubicación obtenida');
      } else {
        setAddress('Ubicación actual');
      }
      
      console.log('✅ Ubicación obtenida:', addressInfo?.formatted);
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      setAddress('Permisos de ubicación requeridos');
      
      setModalMessage('Necesitamos permisos de ubicación para mostrar negocios cercanos');
      setModalVisible(true);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setLocalSearchQuery(text);
    debouncedSearch(text);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    onSearchClear();
    Keyboard.dismiss();
  };

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    onSearchChange(localSearchQuery);
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>TRAELO</Text>
          <TouchableOpacity
            style={styles.addressContainer}
            onPress={getCurrentLocation}
            activeOpacity={0.7}
          >
            {isLocationLoading ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.9)" />
            ) : (
              <Ionicons
                name="location-outline"
                size={16}
                color="rgba(255,255,255,0.9)"
              />
            )}
            <Text style={styles.addressText} numberOfLines={1}>
              {isLocationLoading ? 'Obteniendo ubicación...' : address}
            </Text>
            <Ionicons
              name="refresh-outline"
              size={14}
              color="rgba(255,255,255,0.7)"
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#9CA3AF"
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Buscar comida, moda, tecnologia..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={localSearchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
              blurOnSubmit={true}
            />
            
            {localSearchQuery.length > 0 && (
              <TouchableOpacity
                onPress={handleClearSearch}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Modal para mensajes de ubicación */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="location-outline" size={32} color="#EF4444" />
              <Text style={styles.modalTitle}>Ubicación requerida</Text>
            </View>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLOR.green,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  innerContainer: {
    maxWidth: 360,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoText: {
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
    fontSize: 28,
    marginBottom: 6,
    textAlign: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  addressText: {
    fontFamily: 'Roboto-Regular',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    flexShrink: 1,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 10,
  },
  searchInputWrapper: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 2,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingLeft: 52,
    paddingRight: 44,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Roboto-Regular',
    color: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-SemiBold',
    marginLeft: 12,
    color: '#111827',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    marginBottom: 24,
    color: '#6B7280',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#00CC86',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontFamily: 'Roboto-SemiBold',
    fontSize: 16,
  },
});
