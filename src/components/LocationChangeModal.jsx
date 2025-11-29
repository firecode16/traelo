import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLOR } from '../constants/Color';

const LocationChangeModal = ({ visible, onUpdate, onKeepCurrent, newZone, distance }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeepCurrent}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={48} color={COLOR.orange} />
          </View>

          <Text style={styles.title}>Cambiaste de ubicación</Text>

          <Text style={styles.message}>
            Te has movido aproximadamente {distance} km.
            {newZone && ` Ahora estás en la zona "${newZone.zoneName}".`}
          </Text>

          <Text style={styles.question}>
            ¿Deseas actualizar tu zona de entrega?
          </Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.keepButton]}
              onPress={onKeepCurrent}
            >
              <Text style={[styles.buttonText, styles.keepButtonText]}>
                Mantener zona actual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={onUpdate}
            >
              <Text style={[styles.buttonText, styles.updateButtonText]}>
                Actualizar zona
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.autoUpdateContainer}
            onPress={onUpdate}
          >
            <Ionicons name="refresh" size={16} color={COLOR.green} />
            <Text style={styles.autoUpdateText}>
              Actualizar automáticamente en el futuro
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLOR.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: COLOR.darkGray,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: COLOR.gray,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  question: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: COLOR.darkGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepButton: {
    backgroundColor: COLOR.lightGray,
    borderWidth: 1,
    borderColor: COLOR.lightGray,
  },
  updateButton: {
    backgroundColor: COLOR.green,
    borderWidth: 1,
    borderColor: COLOR.green,
  },
  buttonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    textAlign: 'center',
  },
  keepButtonText: {
    color: COLOR.darkGray,
  },
  updateButtonText: {
    color: COLOR.white,
  },
  autoUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  autoUpdateText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: COLOR.green,
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
});

export default LocationChangeModal;
