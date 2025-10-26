import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLOR } from '../../constants/Color';

export default function CommissionScreen({ navigation, route }) {
  const { form, locationData, deliveryOptions } = route.params || {};

  // Formato de coordenadas
  const transformCoordinates = (zonesOrPoints) => {
    return (zonesOrPoints || []).map((item) => ({
      ...item,
      center: Array.isArray(item.center)
        ? {
            longitude: item.center[0],
            latitude: item.center[1],
          }
        : item.center,
    }));
  };

  // Estados para comisiones
  const [zonesCommissions, setZonesCommissions] = useState(
    transformCoordinates(deliveryOptions?.zones).map((zone) => ({
      id: zone.id || Date.now().toString() + Math.random(),
      name: zone.place_name || zone.name || 'Zona sin nombre',
      type: 'delivery',
      selectedOption: 'free',
      commissionAmount: '',
      coordinates: zone.center,
    })),
  );

  const [pointsCommissions, setPointsCommissions] = useState(
    transformCoordinates(deliveryOptions?.points).map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address || p.place_name || '',
      type: 'pickup',
      selectedOption: 'free',
      commissionAmount: '',
      coordinates: p.center,
    })),
  );

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showModalFn = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  // Selección binaria
  const handleOptionSelect = (id, type, option) => {
    const updater = (list) =>
      list.map((item) =>
        item.id === id
          ? {
              ...item, selectedOption: option,
              ...(option === 'free' && { commissionAmount: '' }),
            }
          : item,
      );

    if (type === 'delivery') {
      setZonesCommissions(updater);
    } else {
      setPointsCommissions(updater);
    }
  };

  const handleCommissionChange = (id, type, value) => {
    const updater = (list) =>
      list.map((item) =>
        item.id === id ? { ...item, commissionAmount: value } : item,
      );

    if (type === 'delivery') setZonesCommissions(updater);
    else setPointsCommissions(updater);
  };

  const handleRegister = async () => {
    if (!acceptedTerms) {
      showModalFn('Atención', 'Debes aceptar los Términos y Condiciones antes de continuar.',);
      return;
    }

    const allCommissions = [...zonesCommissions, ...pointsCommissions];
    const invalidCommissions = allCommissions.filter(
      (item) => item.selectedOption === 'commission' && !item.commissionAmount,
    );

    if (invalidCommissions.length > 0) {
      showModalFn('Comisiones incompletas', 'Algunas zonas/puntos tienen comisión seleccionada pero no tienen monto asignado. Por favor, completa la información.',);
      return;
    }

    // Preparar payload
    const cleanCommissions = allCommissions.map((item) => ({
      ...item, address: item.address || '',
      commissionAmount: item.selectedOption === 'free' ? '' : item.commissionAmount,
      coordinates: item.coordinates || null,
    }));

    const cleanDeliveryOptions = {
      ...deliveryOptions,
      zones: transformCoordinates(deliveryOptions?.zones).map((zone) => ({
        ...zone, address: zone.address || zone.place_name || '',
      })),
      points: transformCoordinates(deliveryOptions?.points).map((point) => ({
        ...point, address: point.address || point.place_name || '',
      })),
    };

    const payload = {
      form: {
        ...form,
        address: form?.address || '',
        description: form?.description || '',
        sector: form?.sector || '',
      },
      locationData: {
        ...locationData,
        display_name: locationData?.display_name || '',
        coordinates:
          locationData?.lat && locationData?.lng
            ? {
                latitude: locationData.lat,
                longitude: locationData.lng,
              }
            : null,
      },
      deliveryOptions: cleanDeliveryOptions,
      commissions: cleanCommissions,
    };

    console.log('Datos listos para enviar:', JSON.stringify(payload, null, 2));
    showModalFn('Éxito', 'Registro preparado correctamente.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Paso 3 de 3</Text>
        </View>
        <Text style={styles.title}>Comisiones y registro</Text>
      </View>

      {/* Contenido principal */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Zonas de entrega */}
            {deliveryOptions?.homeDeliveryEnabled &&
              zonesCommissions.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Feather name="truck" size={20} color={COLOR.green} />
                    <Text style={styles.sectionTitle}>
                      Zonas de entrega a domicilio
                    </Text>
                  </View>
                  <Text style={styles.sectionDescription}>
                    Configura las comisiones para cada zona de entrega
                  </Text>

                  {zonesCommissions.map((zone) => (
                    <View key={zone.id} style={styles.itemCard}>
                      <Text style={styles.itemName}>{zone.name}</Text>

                      <View style={styles.binaryOptions}>
                        <TouchableOpacity
                          style={[
                            styles.binaryOption, zone.selectedOption === 'free' && styles.binaryOptionSelected,
                          ]}
                          onPress={() => handleOptionSelect(zone.id, 'delivery', 'free') }
                        >
                          <Feather
                            name="truck"
                            size={16}
                            color={
                              zone.selectedOption === 'free' ? '#fff' : COLOR.green
                            }
                          />
                          <Text
                            style={[
                              styles.binaryOptionText, zone.selectedOption === 'free' && styles.binaryOptionTextSelected,
                            ]}
                          >
                            Envío gratis
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.binaryOption, zone.selectedOption === 'commission' && styles.binaryOptionSelected,
                          ]}
                          onPress={() => handleOptionSelect(zone.id, 'delivery', 'commission',) }
                        >
                          <Feather
                            name="dollar-sign"
                            size={16}
                            color={
                              zone.selectedOption === 'commission' ? '#fff' : COLOR.green
                            }
                          />
                          <Text
                            style={[
                              styles.binaryOptionText, zone.selectedOption === 'commission' && styles.binaryOptionTextSelected,
                            ]}
                          >
                            Aplicar comisión
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {zone.selectedOption === 'commission' && (
                        <View style={styles.commissionInputContainer}>
                          <Text style={styles.commissionLabel}>
                            Monto de comisión (MXN)
                          </Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ej: 50.00"
                            keyboardType="numeric"
                            value={zone.commissionAmount}
                            onChangeText={(v) => handleCommissionChange(zone.id, 'delivery', v) }
                            returnKeyType="done"
                          />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

            {/* Centros de entrega */}
            {deliveryOptions?.deliveryCentersEnabled &&
              pointsCommissions.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Feather name="map-pin" size={20} color={COLOR.green} />
                    <Text style={styles.sectionTitle}>Centros de entrega</Text>
                  </View>
                  <Text style={styles.sectionDescription}>
                    Configura las comisiones para cada punto de entrega
                  </Text>

                  {pointsCommissions.map((point) => (
                    <View key={point.id} style={styles.itemCard}>
                      <Text style={styles.itemName}>{point.address}</Text>

                      <View style={styles.binaryOptions}>
                        <TouchableOpacity
                          style={[
                            styles.binaryOption, point.selectedOption === 'free' && styles.binaryOptionSelected,
                          ]}
                          onPress={() => handleOptionSelect(point.id, 'pickup', 'free') }
                        >
                          <Feather
                            name="truck"
                            size={16}
                            color={
                              point.selectedOption === 'free' ? '#fff' : COLOR.green
                            }
                          />
                          <Text
                            style={[
                              styles.binaryOptionText, point.selectedOption === 'free' && styles.binaryOptionTextSelected,
                            ]}
                          >
                            Envío gratis
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.binaryOption, point.selectedOption === 'commission' && styles.binaryOptionSelected,
                          ]}
                          onPress={() => handleOptionSelect(point.id, 'pickup', 'commission') }
                        >
                          <Feather
                            name="dollar-sign"
                            size={16}
                            color={
                              point.selectedOption === 'commission' ? '#fff' : COLOR.green
                            }
                          />
                          <Text
                            style={[
                              styles.binaryOptionText, point.selectedOption === 'commission' && styles.binaryOptionTextSelected,
                            ]}
                          >
                            Aplicar comisión
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {point.selectedOption === 'commission' && (
                        <View style={styles.commissionInputContainer}>
                          <Text style={styles.commissionLabel}>
                            Monto de comisión (MXN)
                          </Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ej: 30.00"
                            keyboardType="numeric"
                            value={point.commissionAmount}
                            onChangeText={(v) => handleCommissionChange(point.id, 'pickup', v) }
                            returnKeyType="done"
                          />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

            {/* Estado vacío */}
            {(!deliveryOptions?.homeDeliveryEnabled || zonesCommissions.length === 0) &&
              (!deliveryOptions?.deliveryCentersEnabled || pointsCommissions.length === 0) && (
                <View style={styles.emptyState}>
                  <Feather name="settings" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateTitle}>
                    Sin configuraciones de comisión
                  </Text>
                  <Text style={styles.emptyStateText}>
                    No hay zonas de entrega o puntos de recogida configurados.
                    Puedes continuar con el registro.
                  </Text>
                </View>
              )}

            {/* Términos y condiciones */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                style={styles.checkboxContainer}
              >
                <View style={[styles.checkbox, acceptedTerms && styles.checked]}>
                  {acceptedTerms && (
                    <Ionicons name="checkmark" size={18} color="white" />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                Acepto los{' '}
                <Text
                  style={styles.link}
                  onPress={() => navigation.navigate('Terms')}
                >
                  Términos y Condiciones
                </Text>{' '}
                y la{' '}
                <Text
                  style={styles.link}
                  onPress={() => navigation.navigate('Privacy')}
                >
                  Política de Privacidad
                </Text>
              </Text>
            </View>

            {!acceptedTerms && (
              <Text style={styles.errorText}>
                Debes aceptar los términos y política de privacidad
              </Text>
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.registerButton, !acceptedTerms && styles.registerButtonDisabled,
          ]}
          disabled={!acceptedTerms}
          onPress={handleRegister}
        >
          <Text style={styles.registerButtonText}>Completar Registro</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 120,
  },
  bottomSpacer: {
    height: 20,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#00CC861A',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 4,
  },
  stepText: { color: COLOR.green, fontSize: 13, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  sectionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },

  itemCard: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },

  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },

  // Opciones binarias
  binaryOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },

  binaryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLOR.green,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 6,
  },

  binaryOptionSelected: {
    backgroundColor: COLOR.green,
  },

  binaryOptionText: {
    color: COLOR.green,
    fontSize: 13,
    fontWeight: '500',
  },

  binaryOptionTextSelected: {
    color: '#fff',
  },

  // Input de comisión
  commissionInputContainer: {
    marginTop: 8,
  },

  commissionLabel: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
    fontWeight: '500',
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },

  // Estado vacío
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },

  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Términos
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 8,
  },

  checkboxContainer: {
    marginRight: 10,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checked: {
    backgroundColor: COLOR.green,
    borderColor: COLOR.green,
  },

  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#3d3c3cff',
    lineHeight: 20,
  },

  link: {
    color: COLOR.green,
    fontWeight: '600',
  },

  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 34,
  },

  footer: {
    backgroundColor: '#fff',
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
    padding: 16,
  },

  registerButton: {
    backgroundColor: COLOR.green,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  registerButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },

  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827',
  },

  modalMessage: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },

  modalButton: {
    backgroundColor: COLOR.green,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
