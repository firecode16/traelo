import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MapModal = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalBox, { height: '26%' }]}>
        <Text style={styles.modalTitle}>Ubicación no disponible</Text>
        <Text style={styles.webMessage}>
          📍Selección de ubicación solo está disponible desde la app móvil.
        </Text>
        <View style={styles.modalActions}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalActions: {
    marginTop: 20,
    alignItems: 'center',
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
  webMessage: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});

export default MapModal;
