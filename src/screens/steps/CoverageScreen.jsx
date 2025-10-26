import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import MapboxPicker from '../../components/MapboxPicker';
import { MAP } from '../../constants/ApiMaps';
import { COLOR } from '../../constants/Color';

const getSafeSearchTypes = () => {
  return 'place,locality,neighborhood,address,district,poi,region';
};

export default function CoverageScreen({ navigation, route }) {
  const { form, locationData } = route.params || {};
  const sector = form?.sector;

  const [homeDeliveryEnabled, setHomeDeliveryEnabled] = useState(false);
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [deliveryCentersEnabled, setDeliveryCentersEnabled] = useState(false);

  const [zones, setZones] = useState([]);
  const [points, setPoints] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('zones'); // 'zones' | 'points'
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [pendingHomeDelivery, setPendingHomeDelivery] = useState(false);

  // Estados temporales para la selección en el modal
  const [temporaryLocation, setTemporaryLocation] = useState(null);
  const [temporaryAddress, setTemporaryAddress] = useState('');

  const searchTimeoutRef = useRef(null);

  const isNextEnabled = homeDeliveryEnabled || pickupEnabled || deliveryCentersEnabled;

  // Ocultar centro de entrega para sector food
  const shouldShowDeliveryCenters = sector !== 'food';

  // Manejo del switch de domicilio
  const handleHomeDeliveryToggle = (newValue) => {
    if (newValue) {
      // Mostrar modal informativo antes de activar
      setPendingHomeDelivery(true);
      setInfoModalVisible(true);
    } else {
      // Desactivar directamente sin modal
      setHomeDeliveryEnabled(false);
    }
  };

  // Confirmar domicilio después del modal
  const confirmHomeDelivery = () => {
    setHomeDeliveryEnabled(true);
    setInfoModalVisible(false);
    setPendingHomeDelivery(false);
  };

  // Cancelar domicilio
  const cancelHomeDelivery = () => {
    setHomeDeliveryEnabled(false);
    setInfoModalVisible(false);
    setPendingHomeDelivery(false);
  };

  // Validación de duplicados
  const isDuplicate = (list, newItem) => {
    return list.some(
      (item) =>
        item.id === newItem.id ||
        item.name?.toLowerCase() === newItem.name?.toLowerCase() ||
        item.place_name?.toLowerCase() === newItem.place_name?.toLowerCase(),
    );
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
        
        const optimizedUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text
        )}.json?access_token=${MAP.MAPBOX_ACCESS_TOKEN}&limit=10&language=es&country=mx&types=${searchTypes}&autocomplete=true&proximity=${locationData?.lng || -99.1332},${locationData?.lat || 19.4326}`;

        const response = await fetch(optimizedUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filtrar y enriquecer resultados para mostrar mejor los negocios
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
          setSearchError('Error en los parámetros de búsqueda. Intenta con otros términos.');
        } else {
          setSearchError('Error al buscar ubicaciones. Verifica tu conexión e intenta de nuevo.');
        }
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 400);
  };

  // Maneja la selección de una sugerencia
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

  // Maneja el cambio de ubicación desde el mapa
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

  // Confirmar la adición de la ubicación seleccionada
  const confirmAddLocation = () => {
    if (!temporaryLocation) return;

    const targetList = modalType === 'zones' ? zones : points;
    if (isDuplicate(targetList, temporaryLocation)) {
      setSearchError(modalType === 'zones' ? 'Esta zona ya ha sido agregada.' : 'Este punto ya ha sido agregado.');
      return;
    }

    if (modalType === 'zones') {
      setZones([...zones, temporaryLocation]);
    } else {
      setPoints([...points, temporaryLocation]);
    }

    setModalVisible(false);
    resetModalState();
  };

  // Resetear el estado del modal
  const resetModalState = () => {
    setSearchQuery('');
    setTemporaryAddress('');
    setTemporaryLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchError(null);
  };

  const handleRemoveZone = (id) => {
    setZones(zones.filter((zone) => zone.id !== id));
  };

  const handleRemovePoint = (id) => {
    setPoints(points.filter((point) => point.id !== id));
  };

  const handleNext = () => {
    navigation.navigate('Commission', {
      form,
      locationData,
      deliveryOptions: {
        homeDeliveryEnabled,
        pickupEnabled,
        deliveryCentersEnabled,
        zones,
        points,
      },
    });
  };

  const openModal = (type) => {
    setModalType(type);
    resetModalState();
    setModalVisible(true);
  };

  const getModalTitle = () => {
    return modalType === 'zones' ? 'Agregar zona de cobertura' : 'Agregar puntos de entrega';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Paso 2 de 3</Text>
        </View>
        <Text style={styles.title}>Cobertura de zonas</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Método de entrega */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Método de entrega</Text>
            <View style={styles.locationInfo}>
              <Feather name="map-pin" size={16} color="#6B7280" />
              <Text style={styles.locationText}>CDMX, México</Text>
            </View>
          </View>

          {/* A domicilio */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrapper}>
                <Feather name="truck" size={20} color={COLOR.green} />
                <Text style={styles.sectionTitle}>A domicilio</Text>
              </View>
              <Switch
                value={homeDeliveryEnabled}
                onValueChange={handleHomeDeliveryToggle}
                thumbColor={homeDeliveryEnabled ? COLOR.green : '#f4f3f4'}
                trackColor={{ true: COLOR.green, false: '#D1D5DB' }}
                accessibilityLabel="Entrega a domicilio"
                accessibilityHint="Activa o desactiva el servicio de entrega a domicilio"
                accessibilityRole="switch"
              />
            </View>

            {homeDeliveryEnabled && (
              <>
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Zonas de cobertura:</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => openModal('zones')}
                    accessibilityLabel="Agregar zona de cobertura"
                    accessibilityHint="Abre el modal para buscar y agregar nuevas zonas de cobertura"
                    accessibilityRole="button"
                  >
                    <Feather name="plus" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Agregar zona</Text>
                  </TouchableOpacity>

                  {zones.length > 0 && (
                    <View style={styles.chipsContainer}>
                      {zones.map((zone) => (
                        <View key={zone.id} style={styles.chip}>
                          <Text style={styles.chipText} numberOfLines={1}>
                            {zone.place_name || zone.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveZone(zone.id)}
                            style={styles.removeChipButton}
                            accessibilityLabel={`Eliminar zona ${zone.place_name || zone.name}`}
                            accessibilityHint="Elimina esta zona de la lista de cobertura"
                            accessibilityRole="button"
                          >
                            <Feather name="x" size={14} color={COLOR.green} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
          </View>

          <View style={styles.separator} />

          {/* Para recoger */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrapper}>
                <Feather name="shopping-bag" size={20} color={COLOR.green} />
                <Text style={styles.sectionTitle}>Para recoger</Text>
              </View>
              <Switch
                value={pickupEnabled}
                onValueChange={setPickupEnabled}
                thumbColor={pickupEnabled ? COLOR.green : '#f4f3f4'}
                trackColor={{ true: COLOR.green, false: '#D1D5DB' }}
                accessibilityLabel="Recoger en tienda"
                accessibilityHint="Activa o desactiva la opción de recoger pedidos en el local"
                accessibilityRole="switch"
              />
            </View>
            <Text style={styles.desc}>
              La dirección exacta del negocio solo será visible para el cliente
              una vez que el pedido esté confirmado.
            </Text>
          </View>

          <View style={styles.separator} />

          {/* Centro de entrega - Mostrara si no es food */}
          {shouldShowDeliveryCenters && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleWrapper}>
                  <Feather name="map-pin" size={20} color={COLOR.green} />
                  <Text style={styles.sectionTitle}>Centro de entrega</Text>
                </View>
                <Switch
                  value={deliveryCentersEnabled}
                  onValueChange={setDeliveryCentersEnabled}
                  thumbColor={deliveryCentersEnabled ? COLOR.green : '#f4f3f4'}
                  trackColor={{ true: COLOR.green, false: '#D1D5DB' }}
                  accessibilityLabel="Centros de entrega"
                  accessibilityHint="Activa o desactiva la opción de centros de entrega"
                  accessibilityRole="switch"
                />
              </View>

              {deliveryCentersEnabled && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Puntos de entrega:</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => openModal('points')}
                    accessibilityLabel="Agregar punto de entrega"
                    accessibilityHint="Abre el modal para buscar y agregar nuevos puntos de entrega"
                    accessibilityRole="button"
                  >
                    <Feather name="plus" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Agregar punto</Text>
                  </TouchableOpacity>

                  {points.length > 0 && (
                    <View style={styles.chipsContainer}>
                      {points.map((point) => (
                        <View key={point.id} style={styles.chip}>
                          <Text style={styles.chipText} numberOfLines={1}>
                            {point.place_name || point.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleRemovePoint(point.id)}
                            style={styles.removeChipButton}
                            accessibilityLabel={`Eliminar punto ${point.place_name || point.name}`}
                            accessibilityHint="Elimina este punto de la lista de puntos de entrega"
                            accessibilityRole="button"
                          >
                            <Feather name="x" size={14} color={COLOR.green} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal reutilizable para zonas/puntos */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          resetModalState();
        }}
        accessibilityLabel="Modal de agregar ubicaciones"
        accessibilityHint="Permite buscar y seleccionar zonas o puntos de entrega"
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
                accessibilityLabel="Cerrar modal"
                accessibilityHint="Cierra el modal de agregar ubicaciones"
                accessibilityRole="button"
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
                  accessibilityLabel="Campo de búsqueda"
                  accessibilityHint="Escribe al menos 3 caracteres para buscar ubicaciones"
                  accessibilityRole="search"
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
                    accessibilityLabel="Limpiar búsqueda"
                    accessibilityHint="Elimina el texto del campo de búsqueda"
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
                      <ActivityIndicator size="small" color={COLOR.green} />
                      <Text style={styles.loadingText}>
                        {searchQuery.length < 3 ? 'Escribe al menos 3 caracteres...' : 'Buscando ubicaciones en tu área...'}
                      </Text>
                    </View>
                  ) : suggestions.length > 0 ? (
                    // Renderizado de sugerencias
                    suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={suggestion.id || index}
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionSelect(suggestion)}
                        accessibilityLabel={`Seleccionar ${suggestion.place_name}`}
                        accessibilityHint="Selecciona esta ubicación para agregarla"
                        accessibilityRole="button"
                      >
                        <Feather
                          name={
                            suggestion.isBusiness ? 'shopping-bag' : 'map-pin'
                          }
                          size={14}
                          color={
                            suggestion.isBusiness ? '#FF6B35' : COLOR.green
                          }
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
                  accessibilityLabel="Cancelar"
                  accessibilityHint="Cancela la operación y cierra el modal"
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
                  accessibilityLabel={
                    modalType === 'zones' ? 'Agregar zona' : 'Agregar punto'
                  }
                  accessibilityHint={
                    temporaryLocation ? `Confirma agregar ${temporaryAddress}` : 'Selecciona una ubicación primero'
                  }
                  accessibilityRole="button"
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

      {/* Modal informativo para domicilio */}
      <Modal
        visible={infoModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelHomeDelivery}
      >
        <View style={styles.infoModalContainer}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoModalHeader}>
              <View style={styles.infoIconContainer}>
                <Feather name="info" size={24} color={COLOR.green} />
              </View>
              <Text style={styles.infoModalTitle}>Información importante</Text>
            </View>

            <View style={styles.infoModalBody}>
              <Text style={styles.infoModalText}>
                Al seleccionar esta opción, asumimos que usted como negocio,
                cuenta con al menos un repartidor para realizar las entregas a domicilio.
              </Text>

              <Text style={styles.infoModalSubtext}>
                Podrás configurar las zonas de cobertura y tarifas de envío en los siguientes pasos.
              </Text>
            </View>

            <View style={styles.infoModalFooter}>
              <TouchableOpacity
                style={styles.infoModalCancelButton}
                onPress={cancelHomeDelivery}
                accessibilityLabel="Cancelar"
                accessibilityHint="Cancela la activación de entrega a domicilio"
              >
                <Text style={styles.infoModalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.infoModalConfirmButton}
                onPress={confirmHomeDelivery}
                accessibilityLabel="Confirmar"
                accessibilityHint="Confirma la activación de entrega a domicilio"
              >
                <Text style={styles.infoModalConfirmText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton, !isNextEnabled && styles.nextButtonDisabled,
          ]}
          disabled={!isNextEnabled}
          onPress={handleNext}
          accessibilityLabel="Continuar al siguiente paso"
          accessibilityHint={
            isNextEnabled ? 'Avanzar a la configuración de comisiones' : 'Debes habilitar al menos un método de entrega para continuar'
          }
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>Siguiente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
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
    backgroundColor: 'rgba(0, 204, 134, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 4,
  },
  stepText: {
    color: COLOR.green,
    fontSize: 13,
    fontWeight: '600'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 10
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { color: '#6B7280', fontSize: 13 },
  section: { marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '500', color: '#111827' },
  desc: { color: '#6B7280', fontSize: 13, marginTop: 8, lineHeight: 18 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6, fontWeight: '500' },
  separator: {
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    marginVertical: 14,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.green,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Chips reutilizables
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
    borderColor: COLOR.green,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    maxWidth: '100%',
  },
  chipText: {
    color: COLOR.green,
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  removeChipButton: {
    padding: 2,
  },

  // Estilos del Modal de zonas/puntos
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
    fontWeight: '700',
    color: '#111827',
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
    fontWeight: '500',
  },

  // Estilos para manejo de errores
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
  },

  // Sugerencias
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
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
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
  },

  // Estilos para sin resultados
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
  },

  // Mapa en Modal
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
    fontWeight: '600',
    fontSize: 16,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: COLOR.green,
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
    fontWeight: '600',
    fontSize: 16,
  },

  // Modal informativo
  infoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 204, 134, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  infoModalBody: {
    padding: 20,
  },
  infoModalText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  infoModalSubtext: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  infoModalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
    gap: 12,
  },
  infoModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  infoModalCancelText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  infoModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLOR.green,
    alignItems: 'center',
  },
  infoModalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
    padding: 16,
  },
  nextButton: {
    backgroundColor: COLOR.green,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },

  suggestionTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  suggestionAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
    fontWeight: '600',
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
});
