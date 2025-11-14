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
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLOR } from '../../constants/Color';
import { registerUser } from '../../services/RegisterService';
import { registerBusiness } from '../../services/BusinessService';
import { registerSector } from '../../services/SectorService';
import { registerDeliveryZone } from '../../services/DeliveryZoneService';
import { registerZoneCommissionsBatch } from '../../services/ZoneCommissionService';

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
      id: zone.id,
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
  const [loading, setLoading] = useState(false); // Estado para el loading
  const [modalCallback, setModalCallback] = useState(null); // Callback para el modal

  const showModalFn = (title, message, callback = null) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalCallback(() => callback); // Guardar el callback
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalCallback) {
      modalCallback();
    }
  };

  // Selección binaria
  const handleOptionSelect = (id, type, option) => {
    const updater = (list) =>
      list.map((item) =>
        item.id === id
          ? {
              ...item,
              selectedOption: option,
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
    const invalidCommissions = allCommissions.filter((item) => item.selectedOption === 'commission' && !item.commissionAmount);

    if (invalidCommissions.length > 0) {
      showModalFn('Comisiones incompletas', 'Algunas zonas o puntos tienen comisión seleccionada pero no tienen monto asignado. Por favor, completa la información.',);
      return;
    }

    setLoading(true);

    try {
      // 1. Registrar User
      const userPayload = {
        userId: Date.now(),
        roles: [form.role],
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        createdAt: new Date().toISOString(),
      };

      const { claims } = await registerUser(userPayload);
      console.log('✅ User registrado:', claims);

      // 2. Registrar Sector
      const sectorPayload = {
        sectorId: Date.now(),
        name: form?.sector || '',
        displayNameProductTab: form?.sector === 'food' ? 'Menú' : 'Catálogo',
        iconName: form?.sector || 'default',
        isActive: true,
      };

      const savedSector = await registerSector(sectorPayload);
      console.log('✅ Sector registrado:', savedSector);

      // 3. Registrar Business
      const businessPayload = {
        businessId: Date.now(),
        userId: claims.userId,
        fullName: claims.fullName,
        description: form.description || '',
        address: locationData?.display_name || form.address || '',
        latitude: locationData?.lat || null,
        longitude: locationData?.lng || null,
        backdrop: form.backdrop || null,
        isActive: true,
        acceptCash: form.acceptCash || true,
        acceptTransfer: form.acceptTransfer || false,
        bankClabe: form.bankClabe || '',
        bankCard: form.bankCard || '',
        sector: savedSector,
        createdAt: new Date().toISOString(),
      };

      const businessResult = await registerBusiness(businessPayload);
      console.log('✅ Business registrado:', businessResult);
      const businessId = businessResult.businessId || businessPayload.businessId;

      // 4. Registrar DeliveryZone (una sola entidad con todas las zones y points)
      const deliveryZonePayload = {
        deliveryZoneId: Date.now(),
        zoneName: `${businessPayload.fullName} - Zonas de Entrega`,
        pickupEnabled: deliveryOptions?.pickupEnabled || false,
        homeDeliveryEnabled: deliveryOptions?.homeDeliveryEnabled || false,
        deliveryCentersEnabled: deliveryOptions?.deliveryCentersEnabled || false,
        zones: (deliveryOptions?.zones || []).map((zone) => {
          let centerObj;
          if (Array.isArray(zone.center)) {
            centerObj = {
              longitude: zone.center[0],
              latitude: zone.center[1],
            };
          } else if (zone.center && typeof zone.center === 'object') {
            centerObj = {
              longitude: zone.center.longitude || zone.center.lng || 0,
              latitude: zone.center.latitude || zone.center.lat || 0,
            };
          } else {
            centerObj = { longitude: 0, latitude: 0 };
          }

          return {
            id: zone.id,
            name: zone.name,
            place_name: zone.place_name,
            center: centerObj,
            address: zone.address || zone.place_name || '',
            geometry: zone.geometry || null,
          };
        }),
        points: (deliveryOptions?.points || []).map((point) => {
          let centerObj;
          if (Array.isArray(point.center)) {
            centerObj = {
              longitude: point.center[0],
              latitude: point.center[1],
            };
          } else if (point.center && typeof point.center === 'object') {
            centerObj = {
              longitude: point.center.longitude || point.center.lng || 0,
              latitude: point.center.latitude || point.center.lat || 0,
            };
          } else {
            centerObj = { longitude: 0, latitude: 0 };
          }

          return {
            id: point.id,
            name: point.name,
            place_name: point.place_name,
            center: centerObj,
            address: point.address || point.place_name || '',
            geometry: point.geometry || null,
          };
        }),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        businessAuxId: businessId,
      };

      const savedZone = await registerDeliveryZone(deliveryZonePayload);
      console.log('✅ DeliveryZone registrado:', savedZone);

      // 5. Registrar ZoneCommissions en un solo array
      const zoneCommissionsPayload = allCommissions.map((commission) => ({
        zoneCommissionId: commission.id,
        shippingType: commission.type === 'delivery' ? 'DELIVERY' : 'PICKUP',
        selectedOption: commission.selectedOption,
        commissionAmount: commission.commissionAmount || null,
        address: commission.address || commission.name || '',
        coordinates: formattedCoordinates(commission),
        active: true,
        deliveryZoneId: savedZone.deliveryZoneId,
        businessAuxId: businessId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await registerZoneCommissionsBatch(zoneCommissionsPayload);

      console.log('✅ ZoneCommissions registrados en batch');
      setLoading(false);
      showModalFn('Éxito', 'Registro completado correctamente', () => navigation.navigate('Login'),);
    } catch (error) {
      console.error('handleRegister error:', error);
      setLoading(false);
      showModalFn('Error', error.message || 'Ocurrió un error en el registro.');
    }
  };

  const formattedCoordinates = (commission) => {
    // Preparar coordinates de forma robusta
    let coordinates = commission.coordinates || {};

    if (!coordinates) {
      // Intentar obtener de geometry si está disponible
      if (commission.geometry?.coordinates) {
        const [longitude, latitude] = commission.geometry.coordinates;
        coordinates = { longitude, latitude };
      } else if (commission.center) {
        coordinates = {
          longitude: commission.center.longitude || commission.center.lng || 0,
          latitude: commission.center.latitude || commission.center.lat || 0,
        };
      }
    }

    if (coordinates && typeof coordinates === 'string') {
      try {
        coordinates = JSON.parse(coordinates);
      } catch (error) {
        console.warn('⚠️ Error parsing coordinates string:', error);
        coordinates = {};
      }
    }

    return coordinates;
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
                          onPress={() => handleOptionSelect(zone.id, 'delivery', 'free')}
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
                          onPress={() => handleOptionSelect(zone.id, 'delivery', 'commission',)}
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
                            onChangeText={(v) => handleCommissionChange(zone.id, 'delivery', v)}
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
                          onPress={() => handleOptionSelect(point.id, 'pickup', 'free')}
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
                          onPress={() => handleOptionSelect(point.id, 'pickup', 'commission')}
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
                            onChangeText={(v) => handleCommissionChange(point.id, 'pickup', v)}
                            returnKeyType="done"
                          />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

            {/* Estado vacío */}
            {(!deliveryOptions?.homeDeliveryEnabled ||
              zonesCommissions.length === 0) &&
              (!deliveryOptions?.deliveryCentersEnabled ||
                pointsCommissions.length === 0) && (
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
                <View
                  style={[styles.checkbox, acceptedTerms && styles.checked]}
                >
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
            styles.registerButton, (!acceptedTerms || loading) && styles.registerButtonDisabled,
          ]}
          disabled={!acceptedTerms || loading}
          onPress={handleRegister}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.registerButtonText}>Completar Registro</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleModalClose}
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
    justifyContent: 'center',
    minHeight: 50,
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
