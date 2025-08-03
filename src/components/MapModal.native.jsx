import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import MapView from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const MapModal = ({
  visible,
  onClose,
  location,
  markerCoords,
  setMarkerCoords,
  onConfirm,
}) => {
  if (!visible || !location) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Selecciona tu ubicación</Text>

          <View style={{ flex: 1 }}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.002,
                longitudeDelta: 0.002,
              }}
              onRegionChangeComplete={(reg) => {
                setMarkerCoords({
                  latitude: reg.latitude,
                  longitude: reg.longitude,
                });
              }}
            />

            <View style={styles.markerFixed}>
              <Ionicons name="location-sharp" size={40} color="#f97316" />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm}>
              <Text style={styles.modalConfirm}>Confirmar ubicación</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 4,
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },
  map: {
    flex: 1,
    borderRadius: 10,
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    zIndex: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalCancel: {
    color: '#999',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalConfirm: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MapModal;
