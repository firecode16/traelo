import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { updateCoverageOptions } from '../services/BusinessService';
import MapboxPicker from './MapboxPicker';
import { MAP } from '../constants/ApiMaps';

const Coverage = ({ businessId, deliveryOptions, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [tempOptions, setTempOptions] = useState({
    homeDeliveryEnabled: false,
    pickupEnabled: false,
    deliveryCentersEnabled: false,
    zones: [],
    points: [],
  });
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('zones');

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [temporaryLocation, setTemporaryLocation] = useState(null);
  const [temporaryAddress, setTemporaryAddress] = useState('');

  const searchTimeoutRef = useRef(null);

  // Sincronizar tempOptions cuando cambien las props
  useEffect(() => {
    console.log('✅ DeliveryOptions recibidos en Coverage:', deliveryOptions);

    if (deliveryOptions) {
      setTempOptions({
        homeDeliveryEnabled: deliveryOptions.homeDeliveryEnabled || false,
        pickupEnabled: deliveryOptions.pickupEnabled || false,
        deliveryCentersEnabled: deliveryOptions.deliveryCentersEnabled || false,
        zones: deliveryOptions.zones || [],
        points: deliveryOptions.points || [],
      });
    }
  }, [deliveryOptions]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateCoverageOptions(businessId, tempOptions);
      onUpdate(tempOptions);
      setEditing(false);
      Alert.alert('Éxito', 'Cobertura actualizada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la cobertura');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (deliveryOptions) {
      setTempOptions({
        homeDeliveryEnabled: deliveryOptions.homeDeliveryEnabled || false,
        pickupEnabled: deliveryOptions.pickupEnabled || false,
        deliveryCentersEnabled: deliveryOptions.deliveryCentersEnabled || false,
        zones: deliveryOptions.zones || [],
        points: deliveryOptions.points || [],
      });
    }
    setEditing(false);
  };

  const handleToggle = (option) => {
    setTempOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleAddZone = (newZone) => {
    setTempOptions((prev) => ({
      ...prev,
      zones: [
        ...prev.zones,
        {
          id: Date.now().toString(),
          name: newZone.name,
          address: newZone.place_name || newZone.name,
          center: newZone.center,
          place_name: newZone.place_name,
          ...newZone,
        },
      ],
    }));
    setModalVisible(false);
    resetModalState();
  };

  const handleAddPoint = (newPoint) => {
    setTempOptions((prev) => ({
      ...prev,
      points: [
        ...prev.points,
        {
          id: Date.now().toString(),
          name: newPoint.name,
          address: newPoint.place_name || newPoint.name,
          center: newPoint.center,
          place_name: newPoint.place_name,
          ...newPoint,
        },
      ],
    }));
    setModalVisible(false);
    resetModalState();
  };

  const handleRemoveZone = (zoneId) => {
    setTempOptions((prev) => ({
      ...prev,
      zones: prev.zones.filter((zone) => zone.id !== zoneId),
    }));
  };

  const handleRemovePoint = (pointId) => {
    setTempOptions((prev) => ({
      ...prev,
      points: prev.points.filter((point) => point.id !== pointId),
    }));
  };

  const getSafeSearchTypes = () => {
    return 'place,locality,neighborhood,address,district,poi,region';
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    setTemporaryAddress(text);
    setSearchError(null);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text || text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    setShowSuggestions(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const searchTypes = getSafeSearchTypes();

        const optimizedUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text,
        )}.json?access_token=${MAP.MAPBOX_ACCESS_TOKEN}&limit=10&language=es&country=mx&types=${searchTypes}&autocomplete=true&proximity=-99.1332,19.4326`;

        const response = await fetch(optimizedUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const enrichedSuggestions = (data.features || []).map((feature) => ({
          ...feature,
          isBusiness:
            feature.properties?.category?.includes('commercial') ||
            feature.place_type?.includes('poi'),
        }));

        setSuggestions(enrichedSuggestions);
        setSearchError(null);
      } catch (error) {
        console.error('Mapbox search error', error);
        if (error.message.includes('422')) {
          setSearchError('Error en los parámetros de búsqueda. Intenta con otros términos.',);
        } else {
          setSearchError('Error al buscar ubicaciones. Verifica tu conexión e intenta de nuevo.',);
        }
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 400);
  };

  const handleSuggestionSelect = (suggestion) => {
    const displayName = suggestion.place_name;
    setSearchQuery(displayName);
    setTemporaryAddress(displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    setTemporaryLocation({
      id: suggestion.id,
      name: suggestion.text,
      place_name: displayName,
      center: suggestion.center,
    });
  };

  const handleMapboxLocationChange = (location) => {
    if (location.display_name) {
      setSearchQuery(location.display_name);
      setTemporaryAddress(location.display_name);
      setTemporaryLocation({
        id: location.place_id || Date.now().toString(),
        name: location.display_name,
        place_name: location.display_name,
        center: [location.lng, location.lat],
      });
    }
  };

  const confirmAddLocation = () => {
    if (!temporaryLocation) return;

    // Validar duplicados
    const targetList = modalType === 'zones' ? tempOptions.zones : tempOptions.points;
    const isDuplicate = targetList.some(
      (item) =>
        item.id === temporaryLocation.id ||
        item.name?.toLowerCase() === temporaryLocation.name?.toLowerCase() ||
        item.place_name?.toLowerCase() === temporaryLocation.place_name?.toLowerCase(),
    );

    if (isDuplicate) {
      setSearchError(modalType === 'zones' ? 'Esta zona ya ha sido agregada.' : 'Este punto ya ha sido agregado.',);
      return;
    }

    if (modalType === 'zones') {
      handleAddZone(temporaryLocation);
    } else {
      handleAddPoint(temporaryLocation);
    }
  };

  const resetModalState = () => {
    setSearchQuery('');
    setTemporaryAddress('');
    setTemporaryLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchError(null);
  };

  const openModal = (type) => {
    setModalType(type);
    resetModalState();
    setModalVisible(true);
  };

  const getModalTitle = () => {
    return modalType === 'zones' ? 'Agregar zona de cobertura' : 'Agregar puntos de entrega';
  };

  const zones = tempOptions.zones || [];
  const points = tempOptions.points || [];

  const hasConfiguration =
    zones.length > 0 ||
    points.length > 0 ||
    tempOptions.pickupEnabled ||
    tempOptions.homeDeliveryEnabled ||
    tempOptions.deliveryCentersEnabled;

  const shouldShowConfiguration = hasConfiguration || zones.length > 0 || points.length > 0;

  if (!shouldShowConfiguration && !editing) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            Cobertura de zonas y método de entrega
          </Text>
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Feather name="edit" size={20} color="#00CC86" />
          </TouchableOpacity>
        </View>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Aún no has configurado tu cobertura
          </Text>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setEditing(true)}
        >
          <Text style={styles.buttonText}>Configurar cobertura</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          Cobertura de zonas y método de entrega
        </Text>
        {!editing && (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Feather name="edit" size={20} color="#00CC86" />
          </TouchableOpacity>
        )}
      </View>

      {!editing ? (
        // Modo visualización
        <View>
          <View style={styles.methodsSection}>
            <Text style={styles.mutedText}>Métodos activos</Text>
            <View style={styles.methodsContainer}>
              <View style={styles.methodItem}>
                <View
                  style={[
                    styles.methodIcon,
                    {
                      backgroundColor: tempOptions.homeDeliveryEnabled ? '#E8F5E9' : '#F3F4F6',
                    },
                  ]}
                >
                  <Feather
                    name="truck"
                    size={24}
                    color={
                      tempOptions.homeDeliveryEnabled ? '#2E7D32' : '#9CA3AF'
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.methodLabel,
                    {
                      color: tempOptions.homeDeliveryEnabled ? '#2E7D32' : '#9CA3AF',
                    },
                  ]}
                >
                  Envío a domicilio
                </Text>
              </View>

              <View style={styles.methodItem}>
                <View
                  style={[
                    styles.methodIcon,
                    {
                      backgroundColor: tempOptions.pickupEnabled ? '#E8F5E9' : '#F3F4F6',
                    },
                  ]}
                >
                  <Feather
                    name="shopping-bag"
                    size={24}
                    color={tempOptions.pickupEnabled ? '#2E7D32' : '#9CA3AF'}
                  />
                </View>
                <Text
                  style={[
                    styles.methodLabel,
                    {
                      color: tempOptions.pickupEnabled ? '#2E7D32' : '#9CA3AF',
                    },
                  ]}
                >
                  Recoger en tienda
                </Text>
              </View>

              <View style={styles.methodItem}>
                <View
                  style={[
                    styles.methodIcon,
                    {
                      backgroundColor: tempOptions.deliveryCentersEnabled ? '#E8F5E9' : '#F3F4F6',
                    },
                  ]}
                >
                  <Feather
                    name="map-pin"
                    size={24}
                    color={
                      tempOptions.deliveryCentersEnabled ? '#2E7D32' : '#9CA3AF'
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.methodLabel,
                    {
                      color: tempOptions.deliveryCentersEnabled ? '#2E7D32' : '#9CA3AF',
                    },
                  ]}
                >
                  Punto de encuentro
                </Text>
              </View>
            </View>
          </View>

          {/* Mostrar zonas en modo visualización */}
          {zones.length > 0 && (
            <View style={styles.zonesSection}>
              <Text style={styles.mutedText}>
                Zonas de cobertura ({zones.length})
              </Text>
              <View style={styles.chipsContainer}>
                {zones.map((zone) => (
                  <View key={zone.id} style={styles.viewOnlyChip}>
                    <Text style={styles.chipText} numberOfLines={2}>
                      {zone.place_name || zone.address || zone.name || 'Dirección no disponible'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Mostrar puntos en modo visualización */}
          {points.length > 0 && (
            <View style={styles.zonesSection}>
              <Text style={styles.mutedText}>
                Puntos de entrega ({points.length})
              </Text>
              <View style={styles.chipsContainer}>
                {points.map((point) => (
                  <View key={point.id} style={styles.viewOnlyChip}>
                    <Text style={styles.chipText} numberOfLines={2}>
                      {point.place_name || point.address || point.name || 'Dirección no disponible'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : (
        // Modo edición
        <ScrollView>
          {/* A domicilio */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrapper}>
                <Feather name="truck" size={20} color="#00CC86" />
                <Text style={styles.sectionTitle}>A domicilio</Text>
              </View>
              <Switch
                value={tempOptions.homeDeliveryEnabled}
                onValueChange={() => handleToggle('homeDeliveryEnabled')}
                thumbColor={
                  tempOptions.homeDeliveryEnabled ? '#00CC86' : '#f4f3f4'
                }
                trackColor={{ true: '#00CC86', false: '#D1D5DB' }}
              />
            </View>

            {tempOptions.homeDeliveryEnabled && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Zonas de cobertura:</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => openModal('zones')}
                >
                  <Feather name="plus" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Agregar zona</Text>
                </TouchableOpacity>

                {zones.length > 0 && (
                  <View style={styles.chipsContainer}>
                    {zones.map((zone) => (
                      <View key={zone.id} style={styles.chip}>
                        <Text style={styles.chipText} numberOfLines={2}>
                          {zone.place_name || zone.address || zone.name || 'Dirección no disponible'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveZone(zone.id)}
                          style={styles.removeChipButton}
                        >
                          <Feather name="x" size={14} color="#00CC86" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.separator} />

          {/* Para recoger */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrapper}>
                <Feather name="shopping-bag" size={20} color="#00CC86" />
                <Text style={styles.sectionTitle}>Para recoger</Text>
              </View>
              <Switch
                value={tempOptions.pickupEnabled}
                onValueChange={() => handleToggle('pickupEnabled')}
                thumbColor={tempOptions.pickupEnabled ? '#00CC86' : '#f4f3f4'}
                trackColor={{ true: '#00CC86', false: '#D1D5DB' }}
              />
            </View>
            <Text style={styles.desc}>
              La dirección exacta del negocio solo será visible para el cliente
              una vez que el pedido esté confirmado.
            </Text>
          </View>

          <View style={styles.separator} />

          {/* Centro de entrega */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrapper}>
                <Feather name="map-pin" size={20} color="#00CC86" />
                <Text style={styles.sectionTitle}>Centro de entrega</Text>
              </View>
              <Switch
                value={tempOptions.deliveryCentersEnabled}
                onValueChange={() => handleToggle('deliveryCentersEnabled')}
                thumbColor={
                  tempOptions.deliveryCentersEnabled ? '#00CC86' : '#f4f3f4'
                }
                trackColor={{ true: '#00CC86', false: '#D1D5DB' }}
              />
            </View>

            {tempOptions.deliveryCentersEnabled && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Puntos de entrega:</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => openModal('points')}
                >
                  <Feather name="plus" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Agregar punto</Text>
                </TouchableOpacity>

                {points.length > 0 && (
                  <View style={styles.chipsContainer}>
                    {points.map((point) => (
                      <View key={point.id} style={styles.chip}>
                        <Text style={styles.chipText} numberOfLines={2}>
                          {point.place_name || point.address || point.name || 'Dirección no disponible'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemovePoint(point.id)}
                          style={styles.removeChipButton}
                        >
                          <Feather name="x" size={14} color="#00CC86" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

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
        </ScrollView>
      )}

      {/* ========== MODAL MAPBOX ========== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          resetModalState();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetModalState();
                }}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>
                {modalType === 'zones' ? 'Buscar zona, colonia o municipio:' : 'Buscar punto de entrega:'}
              </Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.modalInput}
                  placeholder={
                    modalType === 'zones' ? 'Escribe una zona o colonia...' : 'Escribe la dirección del punto...'
                  }
                  placeholderTextColor="#9e9e9e"
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setTemporaryAddress('');
                      setSuggestions([]);
                      setShowSuggestions(false);
                      setSearchError(null);
                    }}
                    style={styles.clearSearchButton}
                  >
                    <Feather name="x" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>

              {searchError && (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{searchError}</Text>
                </View>
              )}

              {showSuggestions && (
                <View style={styles.suggestionsContainer}>
                  {isLoadingSuggestions ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#00CC86" />
                      <Text style={styles.loadingText}>
                        {searchQuery.length < 3 ? 'Escribe al menos 3 caracteres...' : 'Buscando ubicaciones en tu área...'}
                      </Text>
                    </View>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={suggestion.id || index}
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionSelect(suggestion)}
                      >
                        <Feather
                          name={
                            suggestion.isBusiness ? 'shopping-bag' : 'map-pin'
                          }
                          size={14}
                          color={suggestion.isBusiness ? '#FF6B35' : '#00CC86'}
                        />
                        <View style={styles.suggestionTextContainer}>
                          <Text style={styles.suggestionText} numberOfLines={1}>
                            {suggestion.text}
                          </Text>
                          <Text
                            style={styles.suggestionAddress}
                            numberOfLines={1}
                          >
                            {suggestion.place_name}
                          </Text>
                          {suggestion.isBusiness && (
                            <View style={styles.businessBadge}>
                              <Text style={styles.businessBadgeText}>
                                Negocio
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noResultsContainer}>
                      <Feather name="search" size={20} color="#9CA3AF" />
                      <Text style={styles.noResultsText}>
                        {searchQuery.length >= 3 ? 'No se encontraron resultados para tu búsqueda' : 'Escribe al menos 3 caracteres para buscar'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.mapContainer}>
                <Text style={styles.modalLabel}>Selecciona en el mapa:</Text>
                <MapboxPicker
                  style={styles.modalMap}
                  onLocationChange={handleMapboxLocationChange}
                  latitude={temporaryLocation?.center?.[1]}
                  longitude={temporaryLocation?.center?.[0]}
                />
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setModalVisible(false);
                    resetModalState();
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalConfirmButton,
                    !temporaryLocation && styles.modalConfirmButtonDisabled,
                  ]}
                  disabled={!temporaryLocation}
                  onPress={confirmAddLocation}
                >
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={styles.modalConfirmButtonText}>
                    {modalType === 'zones' ? 'Agregar Zona' : 'Agregar Punto'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    flex: 1,
    lineHeight: 24,
  },
  warningBox: {
    backgroundColor: '#FEF3CD',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#00CC86',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.3,
  },
  methodsSection: {
    marginBottom: 16,
  },
  mutedText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  methodsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  methodItem: {
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  methodLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    lineHeight: 20,
  },
  desc: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
    fontFamily: 'Poppins-Light',
  },
  label: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 16,
  },
  separator: {
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    marginVertical: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00CC86',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#00CC86',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    maxWidth: '100%',
  },
  viewOnlyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  chipText: {
    color: '#00CC86',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    flexShrink: 1,
    maxWidth: '90%',
    lineHeight: 16,
  },
  removeChipButton: {
    padding: 2,
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
    letterSpacing: 0.3,
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
    letterSpacing: 0.3,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginTop: 50,
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    lineHeight: 24,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 18,
  },
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalInput: {
    flex: 1,
    backgroundColor: '#F3F3F5',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    paddingRight: 45,
    fontFamily: 'Poppins-Regular',
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#E5E7EB',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 150,
    elevation: 2,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    gap: 8,
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
  suggestionAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'Poppins-Light',
    lineHeight: 16,
  },
  businessBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  businessBadgeText: {
    fontSize: 10,
    color: '#FF6B35',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
  noResultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
  mapContainer: {
    flex: 1,
    marginBottom: 20,
  },
  modalMap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 300,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalCancelButtonText: {
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#00CC86',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  zonesSection: {
    marginBottom: 16,
  },
});

export default Coverage;
