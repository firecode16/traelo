import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLOR } from '../constants/Color';

const CommissionModal = ({ visible, title, message, type = 'info', onConfirm, onCancel, confirmText = 'Aceptar', cancelText = 'Cancelar', }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View
            style={[
              styles.modalIcon, type === 'success' ? styles.modalIconSuccess : type === 'error' ? styles.modalIconError : styles.modalIconInfo,
            ]}
          >
            <Feather
              name={
                type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'
              }
              size={32}
              color="#fff"
            />
          </View>

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>

          <View style={styles.modalButtons}>
            {onCancel && (
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={onCancel}
              >
                <Text style={styles.modalCancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.modalConfirmButton,
                type === 'success' ? styles.modalConfirmButtonSuccess : type === 'error' ? styles.modalConfirmButtonError : styles.modalConfirmButtonInfo,
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.modalConfirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function Commission({ zonesCommissions, pointsCommissions, onZonesCommissionsChange, onPointsCommissionsChange, onUpdate, businessId, deliveryOptions, showModal, }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalZones, setOriginalZones] = useState([]);
  const [originalPoints, setOriginalPoints] = useState([]);

  // Estado para modales internos
  const [internalModal, setInternalModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    onCancel: null,
  });

  // Estado para controlar cambios
  const [hasChanges, setHasChanges] = useState(false);

  // Estado local siempre se actualiza
  const [localZones, setLocalZones] = useState(zonesCommissions || []);
  const [localPoints, setLocalPoints] = useState(pointsCommissions || []);

  // Sincronizar inmediatamente cuando las props cambien
  useEffect(() => {
    console.log('🔄 Commission - Props actualizadas:', {
      zones: zonesCommissions?.length || 0,
      points: pointsCommissions?.length || 0,
    });

    setLocalZones(zonesCommissions || []);
    setLocalPoints(pointsCommissions || []);
  }, [zonesCommissions, pointsCommissions]);

  // Mostrar modal interno
  const showInternalModal = (title, message, type = 'info', onConfirm = null, onCancel = null,) => {
    setInternalModal({
      visible: true,
      title,
      message,
      type,
      onConfirm: onConfirm
        ? () => {
            onConfirm();
            setInternalModal((prev) => ({ ...prev, visible: false }));
          }
        : () => setInternalModal((prev) => ({ ...prev, visible: false })),
      onCancel: onCancel
        ? () => {
            onCancel();
            setInternalModal((prev) => ({ ...prev, visible: false }));
          }
        : () => setInternalModal((prev) => ({ ...prev, visible: false })),
    });
  };

  // Efecto para detectar cambios
  useEffect(() => {
    if (editing) {
      const zonesChanged = JSON.stringify(localZones) !== JSON.stringify(originalZones);
      const pointsChanged = JSON.stringify(localPoints) !== JSON.stringify(originalPoints);
      setHasChanges(zonesChanged || pointsChanged);
    }
  }, [localZones, localPoints, editing, originalZones, originalPoints]);

  // Para filtrar comisiones
  const getFilteredCommissions = useCallback(
    (commissions, type) => {
      if (!deliveryOptions) return [];

      let shouldShow = false;

      if (type === 'delivery') {
        shouldShow = deliveryOptions.homeDeliveryEnabled === true;
      } else if (type === 'pickup') {
        shouldShow = deliveryOptions.deliveryCentersEnabled === true;
      }

      return shouldShow ? commissions || [] : [];
    },
    [deliveryOptions],
  );

  const filteredZonesCommissions = getFilteredCommissions(localZones, 'delivery',);
  const filteredPointsCommissions = getFilteredCommissions(localPoints, 'pickup',);

  const handleEdit = () => {
    console.log('✏️ Commission - Iniciando edición');
    setOriginalZones([...localZones]);
    setOriginalPoints([...localPoints]);
    setEditing(true);
    setHasChanges(false);
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!businessId || businessId === 'null' || businessId === 'undefined') {
      console.error('❌ BusinessId inválido en Commission:', businessId);
      if (showModal) {
        showModal('Error', 'ID de negocio no válido', 'error');
      } else {
        showInternalModal('Error', 'ID de negocio no válido', 'error');
      }
      return;
    }

    // Validar comisiones incompletas
    const allCommissions = [...localZones, ...localPoints];
    const invalidCommissions = allCommissions.filter((item) => item.selectedOption === 'commission' && !item.commissionAmount,);

    if (invalidCommissions.length > 0) {
      showInternalModal(
        'Comisiones incompletas',
        'Algunas zonas o puntos tienen comisión seleccionada pero no tienen monto asignado. Por favor, completa la información.',
        'info',
      );
      return;
    }

    setLoading(true);
    try {
      if (onUpdate) {
        await onUpdate(localZones, localPoints);
      }

      setEditing(false);
      setHasChanges(false);
      if (showModal) {
        showModal('Éxito', 'Comisiones actualizadas correctamente', 'success');
      } else {
        showInternalModal(
          'Éxito',
          'Comisiones actualizadas correctamente',
          'success',
        );
      }
    } catch (error) {
      if (showModal) {
        showModal('Error', 'No se pudieron guardar las comisiones', 'error');
      } else {
        showInternalModal('Error', 'No se pudieron guardar las comisiones', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      showInternalModal(
        '¿Descartar cambios?',
        'Tienes cambios sin guardar en las comisiones. ¿Estás seguro de que quieres descartarlos?',
        'info',
        () => {
          // Make rollback
          setLocalZones([...originalZones]);
          setLocalPoints([...originalPoints]);
          if (onZonesCommissionsChange)
            onZonesCommissionsChange([...originalZones]);
          if (onPointsCommissionsChange)
            onPointsCommissionsChange([...originalPoints]);
          setEditing(false);
          setHasChanges(false);
        },
      );
    } else {
      setEditing(false);
    }
  };

  const handleOptionSelect = (id, type, option) => {
    if (!editing) return;

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
      const updated = updater(localZones);
      setLocalZones(updated);
      if (onZonesCommissionsChange) onZonesCommissionsChange(updated);
    } else {
      const updated = updater(localPoints);
      setLocalPoints(updated);
      if (onPointsCommissionsChange) onPointsCommissionsChange(updated);
    }
  };

  const handleCommissionChange = (id, type, value) => {
    if (!editing) return;

    const numericValue = value.replace(/[^0-9.]/g, '');

    const updater = (list) =>
      list.map((item) =>
        item.id === id ? { ...item, commissionAmount: numericValue } : item,
      );

    if (type === 'delivery') {
      const updated = updater(localZones);
      setLocalZones(updated);
      if (onZonesCommissionsChange) onZonesCommissionsChange(updated);
    } else {
      const updated = updater(localPoints);
      setLocalPoints(updated);
      if (onPointsCommissionsChange) onPointsCommissionsChange(updated);
    }
  };

  const handleContainerPress = () => {
    if (editing) {
      Keyboard.dismiss();
    }
  };

  // Detectar si hay comisiones ocultas
  const hasHiddenCommissions =
    (localZones &&
      localZones.length > 0 &&
      filteredZonesCommissions.length === 0) ||
    (localPoints &&
      localPoints.length > 0 &&
      filteredPointsCommissions.length === 0);

  // Detectar si no hay comisiones visibles
  const noVisibleCommissions =
    filteredZonesCommissions.length === 0 &&
    filteredPointsCommissions.length === 0;

  // Renderizar estado de sincronización
  const renderSyncStatus = () => {
    if (hasHiddenCommissions) {
      return (
        <View style={styles.syncStatus}>
          <Feather name="info" size={14} color="#B45309" />
          <Text style={styles.syncText}>
            Sincronizado • Algunas comisiones están ocultas
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.syncStatus}>
        <Feather name="check-circle" size={14} color="#059669" />
        <Text style={styles.syncText}>Sincronizado con cobertura</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!editing && (
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Configuración de Comisiones</Text>
            {renderSyncStatus()}
          </View>
          <TouchableOpacity onPress={handleEdit}>
            <Feather name="edit" size={20} color="#00CC86" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <View
          onStartShouldSetResponder={() => true}
          onResponderRelease={handleContainerPress}
        >
          {/* Mensaje cuando hay comisiones ocultas */}
          {hasHiddenCommissions && (
            <View style={styles.warningBox}>
              <Feather name="info" size={16} color="#B45309" />
              <Text style={styles.warningText}>
                Algunas comisiones están ocultas porque los métodos de entrega
                correspondientes están desactivados en la sección de Cobertura.
              </Text>
            </View>
          )}

          {/* Zonas de entrega a domicilio - Solo si homeDeliveryEnabled esta Activo */}
          {filteredZonesCommissions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="truck" size={20} color={COLOR.green} />
                <Text style={styles.sectionTitle}>
                  Zonas de entrega a domicilio
                </Text>
              </View>
              <Text style={styles.sectionDescription}>
                {editing
                  ? 'Configura las comisiones para cada zona de entrega'
                  : 'Comisiones configuradas para zonas de entrega'}
              </Text>

              {filteredZonesCommissions.map((zone) => (
                <View key={zone.id} style={styles.itemCard}>
                  <Text style={styles.itemName}>{zone.name}</Text>

                  {editing ? (
                    <>
                      <View style={styles.binaryOptions}>
                        <TouchableOpacity
                          style={[
                            styles.binaryOption, zone.selectedOption === 'free' && styles.binaryOptionSelected,
                          ]}
                          onPress={() =>
                            handleOptionSelect(zone.id, 'delivery', 'free')
                          }
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
                            Gratis
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.binaryOption, zone.selectedOption === 'commission' && styles.binaryOptionSelected,
                          ]}
                          onPress={() =>
                            handleOptionSelect(zone.id, 'delivery', 'commission')
                          }
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
                            Comisión
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
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={zone.commissionAmount}
                            onChangeText={(v) =>
                              handleCommissionChange(zone.id, 'delivery', v)
                            }
                            returnKeyType="done"
                            editable={editing}
                            blurOnSubmit={true}
                            onSubmitEditing={Keyboard.dismiss}
                          />
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.readonlyContainer}>
                      <View style={styles.readonlyBadge}>
                        <Feather
                          name={
                            zone.selectedOption === 'free' ? 'truck' : 'dollar-sign'
                          }
                          size={16}
                          color={COLOR.green}
                        />
                        <Text style={styles.readonlyText}>
                          {zone.selectedOption === 'free' ? 'Gratis' : `Comisión: $${zone.commissionAmount || '0.00'}`}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Centros de entrega - Solo si deliveryCentersEnabled esta Activo */}
          {filteredPointsCommissions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="map-pin" size={20} color={COLOR.green} />
                <Text style={styles.sectionTitle}>Centros de entrega</Text>
              </View>
              <Text style={styles.sectionDescription}>
                {editing
                  ? 'Configura las comisiones para cada punto de entrega'
                  : 'Comisiones configuradas para centros de entrega'}
              </Text>

              {filteredPointsCommissions.map((point) => (
                <View key={point.id} style={styles.itemCard}>
                  <Text style={styles.itemName}>{point.address}</Text>

                  {editing ? (
                    <>
                      <View style={styles.binaryOptions}>
                        <TouchableOpacity
                          style={[
                            styles.binaryOption, point.selectedOption === 'free' && styles.binaryOptionSelected,
                          ]}
                          onPress={() =>
                            handleOptionSelect(point.id, 'pickup', 'free')
                          }
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
                            Gratis
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.binaryOption, point.selectedOption === 'commission' && styles.binaryOptionSelected,
                          ]}
                          onPress={() =>
                            handleOptionSelect(point.id, 'pickup', 'commission')
                          }
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
                            Comisión
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
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={point.commissionAmount}
                            onChangeText={(v) =>
                              handleCommissionChange(point.id, 'pickup', v)
                            }
                            returnKeyType="done"
                            editable={editing}
                            blurOnSubmit={true}
                            onSubmitEditing={Keyboard.dismiss}
                          />
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.readonlyContainer}>
                      <View style={styles.readonlyBadge}>
                        <Feather
                          name={
                            point.selectedOption === 'free' ? 'truck' : 'dollar-sign'
                          }
                          size={16}
                          color={COLOR.green}
                        />
                        <Text style={styles.readonlyText}>
                          {point.selectedOption === 'free' ? 'Gratis' : `Comisión: $${point.commissionAmount || '0.00'}`}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Estado vacío - cuando no hay comisiones visibles */}
          {noVisibleCommissions && (
            <View style={styles.emptyState}>
              <Feather name="settings" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>
                {localZones?.length > 0 || localPoints?.length > 0 ? 'Comisiones no disponibles' : 'Sin configuraciones de comisión'}
              </Text>
              <Text style={styles.emptyStateText}>
                {localZones?.length > 0 || localPoints?.length > 0
                  ? 'Activa los métodos de entrega correspondientes en la sección de Cobertura para ver y configurar las comisiones.'
                  : 'No hay zonas de entrega o puntos de recogida configurados.'}
              </Text>
            </View>
          )}

          {editing && (
            <View style={styles.editButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton, !hasChanges && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={loading || !hasChanges}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CommissionModal
        visible={internalModal.visible}
        title={internalModal.title}
        message={internalModal.message}
        type={internalModal.type}
        onConfirm={internalModal.onConfirm}
        onCancel={internalModal.onCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    flex: 1,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  syncText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  bottomSpacer: {
    height: 0,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  sectionDescription: {
    fontSize: 13,
    fontFamily: 'Poppins-Light',
    color: '#6B7280',
    marginBottom: 16,
  },
  itemCard: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
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
    paddingHorizontal: 4,
    gap: 6,
  },
  binaryOptionSelected: {
    backgroundColor: COLOR.green,
  },
  binaryOptionText: {
    color: COLOR.green,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  binaryOptionTextSelected: {
    color: '#fff',
    fontFamily: 'Poppins-Regular',
  },
  commissionInputContainer: {
    marginTop: 8,
  },
  commissionLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  readonlyContainer: {
    marginTop: 4,
  },
  readonlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  readonlyText: {
    color: COLOR.green,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#00CC86',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  warningBox: {
    backgroundColor: '#FEF3CD',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    flex: 1,
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '60%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconSuccess: {
    backgroundColor: '#10B981',
  },
  modalIconError: {
    backgroundColor: '#EF4444',
  },
  modalIconInfo: {
    backgroundColor: '#3B82F6',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    width: '100%',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmButtonSuccess: {
    backgroundColor: '#10B981',
  },
  modalConfirmButtonError: {
    backgroundColor: '#EF4444',
  },
  modalConfirmButtonInfo: {
    backgroundColor: '#3B82F6',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});
