import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Switch,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLOR } from '../constants/Color';
import { findNearbyZones } from '../services/BusinessService';
import { useLocation } from '../contexts/LocationContext';

const ZoneSelectionModal = ({ visible, onClose, onZoneSelect }) => {
  const {
    userLocation,
    currentZone,
    isAutoDetectionEnabled,
    toggleAutoDetection,
    getCurrentLocation,
  } = useLocation();

  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);

  useEffect(() => {
    if (visible) {
      loadZones();
    }
  }, [visible]);

  const loadZones = async (useGPS = false) => {
    setLoading(true);
    try {
      let nearbyZones = [];

      if (useGPS && userLocation) {
        setUsingCurrentLocation(true);
        nearbyZones = await findNearbyZones(userLocation.latitude, userLocation.longitude, 50);
      } else {
        setUsingCurrentLocation(false);
        // Cargar todas las zonas disponibles (radio grande)
        nearbyZones = await findNearbyZones(0, 0, 1000);
      }

      setZones(nearbyZones);
    } catch (error) {
      console.error('Error loading zones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadZones(usingCurrentLocation);
  };

  const handleUseCurrentLocation = async () => {
    try {
      await getCurrentLocation();
      loadZones(true);
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const handleZoneSelect = (zone) => {
    onZoneSelect(zone);
    onClose();
  };

  const renderZoneItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.zoneItem,
        currentZone?.zoneId === item.zoneId && styles.selectedZoneItem,
      ]}
      onPress={() => handleZoneSelect(item)}
    >
      <View style={styles.zoneInfo}>
        <Text style={styles.zoneName}>{item.zoneName}</Text>
        <Text style={styles.zoneAddress}>{item.address}</Text>
        <Text style={styles.zoneDetail}>
          📍 {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
        </Text>
      </View>
      {currentZone?.zoneId === item.zoneId && (
        <Ionicons name="checkmark-circle" size={24} color={COLOR.green} />
      )}
    </TouchableOpacity>
  );

  const HeaderSection = () => (
    <View style={styles.headerSection}>
      <View style={styles.autoDetectionRow}>
        <Text style={styles.autoDetectionText}>
          Detección automática por GPS
        </Text>
        <Switch
          value={isAutoDetectionEnabled}
          onValueChange={toggleAutoDetection}
          trackColor={{ false: COLOR.lightGray, true: COLOR.green }}
          thumbColor={COLOR.white}
        />
      </View>

      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={handleUseCurrentLocation}
        disabled={loading}
      >
        <Ionicons name="navigate" size={20} color={COLOR.white} />
        <Text style={styles.currentLocationText}>Usar mi ubicación actual</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <Text style={styles.sectionTitle}>
        {usingCurrentLocation ? 'Zonas cercanas a ti' : 'Todas las zonas disponibles'}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Seleccionar Zona de Entrega</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLOR.gray} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={zones}
          renderItem={renderZoneItem}
          keyExtractor={(item) => item.zoneId}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<HeaderSection />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {loading ? (
                <ActivityIndicator size="large" color={COLOR.green} />
              ) : (
                <>
                  <Ionicons
                    name="location-off-outline"
                    size={48}
                    color={COLOR.gray}
                  />
                  <Text style={styles.emptyText}>
                    {usingCurrentLocation ? 'No hay zonas de entrega cerca de tu ubicación' : 'No hay zonas de entrega disponibles'}
                  </Text>
                  <TouchableOpacity
                    style={styles.tryAgainButton}
                    onPress={() => loadZones(false)}
                  >
                    <Text style={styles.tryAgainText}>Ver todas las zonas</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLOR.green]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.lightGray,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: COLOR.darkGray,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerSection: {
    padding: 16,
    backgroundColor: COLOR.background,
  },
  autoDetectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  autoDetectionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: COLOR.darkGray,
    flex: 1,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.green,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  currentLocationText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: COLOR.white,
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: COLOR.lightGray,
    marginVertical: 8,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: COLOR.darkGray,
    marginTop: 8,
  },
  listContent: {
    flexGrow: 1,
  },
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.lightGray,
    backgroundColor: COLOR.white,
  },
  selectedZoneItem: {
    backgroundColor: '#f0f9f0',
    borderLeftWidth: 4,
    borderLeftColor: COLOR.green,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: COLOR.darkGray,
    marginBottom: 4,
  },
  zoneAddress: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: COLOR.gray,
    marginBottom: 2,
  },
  zoneDetail: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: COLOR.green,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: COLOR.gray,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  tryAgainButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLOR.lightGray,
    borderRadius: 20,
  },
  tryAgainText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: COLOR.darkGray,
  },
});

export default ZoneSelectionModal;
