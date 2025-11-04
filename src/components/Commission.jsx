import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLOR } from '../constants/Color';

export default function Commission({
  zonesCommissions,
  pointsCommissions,
  onZonesCommissionsChange,
  onPointsCommissionsChange,
  onUpdate,
  businessId,
}) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalZones, setOriginalZones] = useState([]);
  const [originalPoints, setOriginalPoints] = useState([]);

  const handleEdit = () => {
    setOriginalZones([...zonesCommissions]);
    setOriginalPoints([...pointsCommissions]);
    setEditing(true);
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    setLoading(true);
    try {
      const allCommissions = [...zonesCommissions, ...pointsCommissions];
      const invalidCommissions = allCommissions.filter(
        (item) =>
          item.selectedOption === 'commission' && !item.commissionAmount,
      );

      if (invalidCommissions.length > 0) {
        Alert.alert('Comisiones incompletas', 'Algunas zonas o puntos tienen comisión seleccionada pero no tienen monto asignado. Por favor, completa la información.',);
        setLoading(false);
        return;
      }

      if (onUpdate) {
        await onUpdate(zonesCommissions, pointsCommissions);
      }

      setEditing(false);
      Alert.alert('Éxito', 'Comisiones actualizadas correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar las comisiones');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    onZonesCommissionsChange(originalZones);
    onPointsCommissionsChange(originalPoints);
    setEditing(false);
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
      onZonesCommissionsChange(updater(zonesCommissions));
    } else {
      onPointsCommissionsChange(updater(pointsCommissions));
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
      onZonesCommissionsChange(updater(zonesCommissions));
    } else {
      onPointsCommissionsChange(updater(pointsCommissions));
    }
  };

  const handleContainerPress = () => {
    if (editing) {
      Keyboard.dismiss();
    }
  };

  const deliveryZones = zonesCommissions || [];
  const pickupPoints = pointsCommissions || [];

  return (
    <View style={styles.container}>
      {!editing && (
        <View style={styles.header}>
          <Text style={styles.title}>Configuración de Comisiones</Text>
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
          {deliveryZones.length > 0 && (
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

              {deliveryZones.map((zone) => (
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
                            handleOptionSelect(zone.id, 'delivery', 'commission',)
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

          {pickupPoints.length > 0 && (
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

              {pickupPoints.map((point) => (
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

          {deliveryZones.length === 0 && pickupPoints.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="settings" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>
                Sin configuraciones de comisión
              </Text>
              <Text style={styles.emptyStateText}>
                No hay zonas de entrega o puntos de recogida configurados.
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
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    flex: 1,
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
  saveButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
});
