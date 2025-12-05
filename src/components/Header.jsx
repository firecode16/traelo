import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR } from '../constants/Color';
import LocationService from '../services/LocationService';
import debounce from 'lodash/debounce';

const APP_STORE_LINK = Platform.OS === 'ios' ? 'https://apps.apple.com/app/id=com.traelo.app' : 'https://play.google.com/store/apps/details?id=com.traelo.app';

export default function Header({ navigation, onSearchChange, onSearchClear, searchQuery = '' }) {
  const [address, setAddress] = useState('Obteniendo ubicación...');
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Usamos useRef para mantener la referencia al debounce
  const debouncedSearchRef = useRef(
    debounce((query) => {
      onSearchChange(query);
    }, 300)
  );

  // Sincronizar localSearchQuery con searchQuery prop
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Limpiar el debounce al desmontar
  useEffect(() => {
    return () => {
      debouncedSearchRef.current.cancel();
    };
  }, []);

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
    debouncedSearchRef.current(text);
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

  const handleShare = async () => {
    try {
      const shareOptions = {
        message: `📍 Estoy usando TRAELO para encontrar negocios cerca de: ${address}\n\n📲 Descarga la app: ${APP_STORE_LINK}\n\n#TRAELO #CentroComercial #ComprasLocales`,
        title: '¡Mira esta app!',
        url: APP_STORE_LINK,
        subject: 'Compartir TRAELO App', // Para email
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Compartido con:', result.activityType);
        } else {
          console.log('Compartido exitosamente');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Compartir cancelado');
      }
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Fila superior con logo y botón de compartir */}
        <View style={styles.topRow}>
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

          {/* Botón de compartir */}
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={22} color="#FFFFFF" />
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
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#6B7280" />
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
    fontSize: 28,
    marginBottom: 6,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  addressText: {
    fontFamily: 'Roboto-Regular',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    flexShrink: 1,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginLeft: 12,
    marginTop: 4,
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
    paddingRight: 52,
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
    transform: [{ translateY: -12 }],
    zIndex: 2,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
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
