import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const MapModal = ({
  visible,
  onClose,
  location,
  markerCoords,
  setMarkerCoords,
  onConfirm,
}) => {
  if (!location) return null;

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

          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            onPress={(e) => setMarkerCoords(e.nativeEvent.coordinate)}
          >
            {markerCoords && (
              <Marker
                coordinate={markerCoords}
                draggable
                onDragEnd={(e) => setMarkerCoords(e.nativeEvent.coordinate)}
              />
            )}
          </MapView>

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
  webMessage: {
    textAlign: 'center',
    color: '#333',
    fontSize: 14,
  },
  map: {
    flex: 1,
    borderRadius: 10,
  },
});

export default MapModal;
