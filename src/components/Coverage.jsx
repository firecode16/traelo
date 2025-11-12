import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import MapboxPicker from './MapboxPicker';
import { MAP } from '../constants/ApiMaps';

const CoverageModal = ({ visible, title, message, type = 'info', onConfirm, onCancel, confirmText = 'Aceptar', cancelText = 'Cancelar', }) => {
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
              styles.modalIcon,
              type === 'success' ? styles.modalIconSuccess : type === 'error' ? styles.modalIconError : styles.modalIconInfo,
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

const Coverage = ({ businessId, deliveryOptions, onUpdate, onSwitchChange, onRollback, zonesCommissions = [], pointsCommissions = [], showModal, onItemRemoval, onEditStart, onItemAddition }) => {
  const [editing, setEditing] = useState(false);
  const [tempOptions, setTempOptions] = useState({
    homeDeliveryEnabled: false,
    pickupEnabled: false,
    deliveryCentersEnabled: false,
    zones: [],
    points: [],
  });
  const [loading, setLoading] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [modalType, setModalType] = useState('zones');

  // Estado para modales internos
  const [internalModal, setInternalModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    onCancel: null,
  });

  // Estado para controlar cambios durante edición
  const [hasChanges, setHasChanges] = useState(false);
  const [initialEditState, setInitialEditState] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [temporaryLocation, setTemporaryLocation] = useState(null);
  const [temporaryAddress, setTemporaryAddress] = useState('');

  const searchTimeoutRef = useRef(null);

  const extractNumericId = (id) => {
    if (!id) {
      return Date.now();
    }

    if (typeof id === 'number') {
      return id;
    }

    if (typeof id === 'string' && id.startsWith('place.')) {
      const numericPart = id.replace('place.', '');
      const numericId = parseInt(numericPart, 10);
      return isNaN(numericId) ? Date.now() : numericId;
    }

    if (typeof id === 'string') {
      const numericId = parseInt(id, 10);
      return isNaN(numericId) ? Date.now() : numericId;
    }

    return Date.now();
  };

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

  // Sincronizar tempOptions cuando cambien las props
  useEffect(() => {
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

  // Efecto para detectar cambios durante edición
  useEffect(() => {
    if (editing && initialEditState) {
      const currentState = JSON.stringify(tempOptions);
      const initialState = JSON.stringify(initialEditState);
      setHasChanges(currentState !== initialState);
    }
  }, [tempOptions, editing, initialEditState]);

  // Efecto para limpiar el campo type
  useEffect(() => {
    if (tempOptions.zones) {
      const cleanedZones = tempOptions.zones.map((zone) => {
        const cleaned = { ...zone };
        delete cleaned.type;
        return cleaned;
      });

      if (JSON.stringify(cleanedZones) !== JSON.stringify(tempOptions.zones)) {
        setTempOptions((prev) => ({ ...prev, zones: cleanedZones }));
      }
    }

    if (tempOptions.points) {
      const cleanedPoints = tempOptions.points.map((point) => {
        const cleaned = { ...point };
        delete cleaned.type;
        return cleaned;
      });

      if (JSON.stringify(cleanedPoints) !== JSON.stringify(tempOptions.points)) {
        setTempOptions((prev) => ({ ...prev, points: cleanedPoints }));
      }
    }
  }, [tempOptions.zones, tempOptions.points]);

  // Efecto para limpiar errores
  useEffect(() => {
    if (temporaryLocation && ((temporaryLocation.center && Array.isArray(temporaryLocation.center)) || (temporaryLocation.geometry?.coordinates && Array.isArray(temporaryLocation.geometry.coordinates)))) {
      setSearchError(null);
    }
  }, [temporaryLocation]);

  const handleEdit = () => {
    // Guardar estado inicial al entrar en edición
    const initialEditState = {
      homeDeliveryEnabled: deliveryOptions.homeDeliveryEnabled || false,
      pickupEnabled: deliveryOptions.pickupEnabled || false,
      deliveryCentersEnabled: deliveryOptions.deliveryCentersEnabled || false,
      zones: deliveryOptions.zones || [],
      points: deliveryOptions.points || [],
    };

    setInitialEditState(initialEditState);
    setEditing(true);
    setHasChanges(false);

    // Notificar al padre que comenzó la edición
    if (onEditStart) {
      onEditStart();
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      showInternalModal(
        '¿Descartar cambios?',
        'Tienes cambios sin guardar. ¿Estás seguro de que quieres descartarlos?',
        'info',
        () => {
          console.log('🔄 Ejecutando cancelación - Rollback completo');

          // Rollback visual en Coverage
          if (initialEditState) {
            setTempOptions(initialEditState);

            // Notificar al padre para hacer rollback completo
            if (onRollback) {
              onRollback(initialEditState);
            }
          }

          setEditing(false);
          setHasChanges(false);
          setInitialEditState(null);
        },
      );
    } else {
      setEditing(false);
      setInitialEditState(null);
    }
  };

  const handleRemoveZone = (zoneId) => {
    const zoneToRemove = tempOptions.zones.find((zone) => zone.id === zoneId);

    // Actualización visual inmediata en Coverage
    setTempOptions((prev) => ({
      ...prev,
      zones: prev.zones.filter((zone) => zone.id !== zoneId),
    }));

    // SINCRONIZACIÓN INMEDIATA con Commission
    if (zoneToRemove && onItemRemoval) {
      // Buscar si hay una comisión asociada a esta zona
      const associatedCommission = zonesCommissions.find((commission) =>
        commission.deliveryZoneId === zoneId || commission.id === zoneId,
      );

      const removalId = associatedCommission?.zoneCommissionId || zoneId;
      const address = zoneToRemove.place_name || zoneToRemove.address || zoneToRemove.name;

      console.log(`📍 Eliminando zona:`, {
        zoneId,
        zoneCommissionId: removalId,
        address: address,
      });

      onItemRemoval('zones', removalId, address);
    }
  };

  const handleRemovePoint = (pointId) => {
    const pointToRemove = tempOptions.points.find(
      (point) => point.id === pointId,
    );

    setTempOptions((prev) => ({
      ...prev,
      points: prev.points.filter((point) => point.id !== pointId),
    }));

    // SINCRONIZACIÓN INMEDIATA con Commission
    if (pointToRemove && onItemRemoval) {
      // Buscar si hay una comisión asociada a este punto
      const associatedCommission = pointsCommissions.find((commission) =>
        commission.id === pointId || commission.address === pointToRemove.address,
      );

      const removalId = associatedCommission?.zoneCommissionId || pointId;
      const address = pointToRemove.place_name || pointToRemove.address || pointToRemove.name;

      console.log(`📍 Eliminando punto:`, {
        pointId,
        zoneCommissionId: removalId,
        address: address,
      });

      onItemRemoval('points', removalId, address);
    }
  };

  const handleToggle = (option) => {
    const newValue = !tempOptions[option];

    // Validar desactivación
    if (tempOptions[option] === true) {
      let commissionsExist = false;
      let commissionType = '';

      switch (option) {
        case 'homeDeliveryEnabled':
          commissionsExist = zonesCommissions && zonesCommissions.length > 0;
          commissionType = 'zonas de entrega a domicilio';
          break;
        case 'deliveryCentersEnabled':
          commissionsExist = pointsCommissions && pointsCommissions.length > 0;
          commissionType = 'puntos de entrega';
          break;
      }

      if (commissionsExist) {
        showInternalModal(
          'Comisiones Configuradas',
          `Tienes comisiones configuradas para ${commissionType}. Al desactivar este método, las comisiones asociadas se ocultarán.`,
          'info',
          () => confirmToggle(option, newValue),
        );
        return;
      }
    }

    confirmToggle(option, newValue);
  };

  const confirmToggle = (option, newValue) => {
    const updatedOptions = {
      ...tempOptions,
      [option]: newValue,
    };

    setTempOptions(updatedOptions);

    // Actualización visual inmediata sin guardar en backend
    if (onSwitchChange) {
      onSwitchChange(option, newValue);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('💾 Guardando cambios...');

      // Validar que businessId sea válido
      if (!businessId || businessId === 'null' || businessId === 'undefined') {
        console.error('❌ BusinessId inválido en Coverage:', businessId);
        showModal('Error', 'ID de negocio no válido', 'error');
        return;
      }

      const success = await onUpdate(tempOptions, true);
      if (success) {
        setEditing(false);
        setHasChanges(false);
        setInitialEditState(null);
        console.log('✅ Guardado exitoso');
      }
    } catch (error) {
      console.error('❌ Error al guardar:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSwitch = (option) => (
    <Switch
      value={tempOptions[option]}
      onValueChange={() => handleToggle(option)}
      thumbColor={tempOptions[option] ? '#00CC86' : '#f4f3f4'}
      trackColor={{ true: '#00CC86', false: '#D1D5DB' }}
      disabled={loading}
    />
  );

  const handleAddZone = (newZone) => {
    const numericId = extractNumericId(newZone?.id);

    let centerDTO = null;

    if (newZone?.center && Array.isArray(newZone.center) && newZone.center.length === 2) {
      centerDTO = {
        longitude: newZone.center[0],
        latitude: newZone.center[1],
      };
    } else if (newZone?.geometry?.coordinates && Array.isArray(newZone.geometry.coordinates)) {
      const coords = newZone.geometry.coordinates;
      if (coords.length >= 2) {
        centerDTO = {
          longitude: coords[0],
          latitude: coords[1],
        };
      }
    } else if (newZone?.center && typeof newZone.center === 'object' && newZone.center.longitude && newZone.center.latitude) {
      centerDTO = newZone.center;
    } else {
      console.warn('⚠️ No se pudieron obtener coordenadas para la zona:', newZone,);
      centerDTO = {
        longitude: -99.1332,
        latitude: 19.4326,
      };
    }

    const zoneWithProperStructure = {
      id: numericId,
      name: newZone?.name || newZone?.text || 'Zona sin nombre',
      place_name: newZone?.place_name || newZone?.name || 'Zona sin nombre',
      center: centerDTO,
      address: newZone?.place_name || newZone?.name || 'Dirección no disponible',
      geometry: newZone?.geometry || null,
    };

    delete zoneWithProperStructure.type;
    if (zoneWithProperStructure.geometry && zoneWithProperStructure.geometry.type) {
      delete zoneWithProperStructure.geometry.type;
    }

    console.log('📍 Zona transformada:', zoneWithProperStructure);

    setTempOptions((prev) => ({
      ...prev,
      zones: [...prev.zones, zoneWithProperStructure],
    }));

    // ✅ Inicializar comisiones para la nueva zona
    if (onItemAddition) {
      const newCommission = {
        id: numericId,
        zoneCommissionId: numericId,
        type: 'delivery',
        selectedOption: 'free',
        commissionAmount: '',
        address: zoneWithProperStructure.address,
        coordinates: centerDTO,
        name: zoneWithProperStructure.name,
        deliveryZoneId: null
      };
      console.log('💰 Creando nueva comisión para zona:', newCommission);
      onItemAddition('zones', newCommission);
    }

    setMapModalVisible(false);
    resetModalState();
  };

  const handleAddPoint = (newPoint) => {
    const numericId = extractNumericId(newPoint?.id);

    let centerDTO = null;

    if (newPoint?.center && Array.isArray(newPoint.center) && newPoint.center.length === 2) {
      centerDTO = {
        longitude: newPoint.center[0],
        latitude: newPoint.center[1],
      };
    } else if (newPoint?.geometry?.coordinates && Array.isArray(newPoint.geometry.coordinates)) {
      const coords = newPoint.geometry.coordinates;
      if (coords.length >= 2) {
        centerDTO = {
          longitude: coords[0],
          latitude: coords[1],
        };
      }
    } else if (newPoint?.center && typeof newPoint.center === 'object' && newPoint.center.longitude && newPoint.center.latitude) {
      centerDTO = newPoint.center;
    } else {
      console.warn('⚠️ No se pudieron obtener coordenadas para el punto:', newPoint,);
      centerDTO = {
        longitude: -99.1332,
        latitude: 19.4326,
      };
    }

    const pointWithProperStructure = {
      id: numericId,
      name: newPoint?.name || newPoint?.text || 'Punto sin nombre',
      place_name: newPoint?.place_name || newPoint?.name || 'Punto sin nombre',
      center: centerDTO,
      address: newPoint?.place_name || newPoint?.name || 'Dirección no disponible',
      geometry: newPoint?.geometry || null,
    };

    delete pointWithProperStructure.type;
    if (pointWithProperStructure.geometry && pointWithProperStructure.geometry.type) {
      delete pointWithProperStructure.geometry.type;
    }

    console.log('📍 Punto transformado:', pointWithProperStructure);

    setTempOptions((prev) => ({
      ...prev,
      points: [...prev.points, pointWithProperStructure],
    }));

    // ✅ Inicializar comisiones para el nuevo punto
    if (onItemAddition) {
      const newCommission = {
        id: numericId,
        zoneCommissionId: numericId,
        type: 'pickup',
        selectedOption: 'free',
        commissionAmount: '',
        address: pointWithProperStructure.address,
        coordinates: centerDTO,
        name: pointWithProperStructure.name,
        deliveryZoneId: null
      };

      console.log('💰 Creando nueva comisión para punto:', newCommission);
      onItemAddition('points', newCommission);
    }

    setMapModalVisible(false);
    resetModalState();
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

        const optimizedUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${MAP.MAPBOX_ACCESS_TOKEN}&limit=10&language=es&country=mx&types=${searchTypes}&autocomplete=true&proximity=-99.1332,19.4326`;

        const response = await fetch(optimizedUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const enrichedSuggestions = (data.features || []).map((feature) => ({
          ...feature,
          isBusiness: feature.properties?.category?.includes('commercial') || feature.place_type?.includes('poi'),
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
    const displayName = suggestion?.place_name || 'Ubicación sin nombre';
    setSearchQuery(displayName);
    setTemporaryAddress(displayName);
    setShowSuggestions(false);
    setSuggestions([]);

    const numericId = extractNumericId(suggestion?.id);

    let centerArray = null;
    let latitude, longitude;

    // 1. Priorizar center de Mapbox
    if (suggestion?.center && Array.isArray(suggestion.center)) {
      centerArray = suggestion.center;
      [longitude, latitude] = centerArray;
      console.log('📍 Coordenadas obtenidas de suggestion.center:', {
        latitude,
        longitude,
      });
    }
    // 2. Si no hay center, intentar obtener de geometry
    else if (suggestion?.geometry?.coordinates && Array.isArray(suggestion.geometry.coordinates)) {
      centerArray = suggestion.geometry.coordinates;

      // Para Polygon, tomar el primer punto
      if (centerArray.length > 0 && Array.isArray(centerArray[0]) && Array.isArray(centerArray[0][0])) {
        [longitude, latitude] = centerArray[0][0];
      } else {
        [longitude, latitude] = centerArray;
      }
      console.log('📍 Coordenadas obtenidas de suggestion.geometry:', {
        latitude,
        longitude,
      });
    }

    if (longitude !== undefined && latitude !== undefined) {
      const temporaryLocationData = {
        id: numericId,
        name: suggestion?.text || 'Ubicación',
        place_name: displayName,
        geometry: suggestion?.geometry || null,
        latitude: latitude,
        longitude: longitude,
        center: [longitude, latitude],
      };

      setTemporaryLocation(temporaryLocationData);
      setSearchError(null);
    } else {
      console.warn('❌ No se pudieron obtener coordenadas de la sugerencia:', suggestion,);
      setSearchError('La ubicación seleccionada no tiene coordenadas válidas. Por favor, selecciona otra ubicación o usa el mapa.',);
    }
  };

  const handleMapboxLocationChange = useCallback(
    (location) => {
      console.log('🗺️ Mapbox location change recibido en Coverage:', location);

      if (!location) {
        console.warn('❌ Location es null/undefined');
        return;
      }

      // Obtener coordenadas de forma robusta
      let finalLat, finalLng;

      if (location.lat !== undefined && location.lng !== undefined) {
        finalLat = location.lat;
        finalLng = location.lng;
      } else if (location.center && Array.isArray(location.center)) {
        [finalLng, finalLat] = location.center;
      } else if (location.geometry?.coordinates && Array.isArray(location.geometry.coordinates)) {
        [finalLng, finalLat] = location.geometry.coordinates;
      } else {
        console.warn('❌ No se pudieron extraer coordenadas válidas:', location,);
        return;
      }

      // Validación final de coordenadas
      if (typeof finalLat !== 'number' || typeof finalLng !== 'number' || isNaN(finalLat) || isNaN(finalLng)) {
        console.warn('❌ Coordenadas numéricas inválidas:', {
          finalLat,
          finalLng,
        });
        return;
      }

      const displayName = location.display_name || location.place_name || 'Ubicación seleccionada en el mapa';

      // Actualizar searchQuery solo si es diferente
      if (searchQuery !== displayName) {
        setSearchQuery(displayName);
        setTemporaryAddress(displayName);
      }

      const numericId = extractNumericId(location?.place_id);

      // Actualizar temporaryLocation con datos consistentes
      const temporaryLocationData = {
        id: numericId || Date.now(),
        name: displayName,
        place_name: displayName,
        geometry: location?.geometry || {
          type: 'Point',
          coordinates: [finalLng, finalLat],
        },
        latitude: finalLat,
        longitude: finalLng,
        center: [finalLng, finalLat],
      };

      setTemporaryLocation(temporaryLocationData);
      setSearchError(null);
    },
    [searchQuery],
  );

  const confirmAddLocation = () => {
    if (!temporaryLocation) {
      setSearchError('No se ha seleccionado una ubicación válida');
      console.warn('❌ temporaryLocation es null/undefined');
      return;
    }

    const hasValidCoordinates = (temporaryLocation.latitude !== undefined &&
        temporaryLocation.longitude !== undefined &&
        !isNaN(temporaryLocation.latitude) &&
        !isNaN(temporaryLocation.longitude)) ||
      (temporaryLocation.center &&
        Array.isArray(temporaryLocation.center) &&
        temporaryLocation.center.length === 2 &&
        !isNaN(temporaryLocation.center[0]) &&
        !isNaN(temporaryLocation.center[1]));

    if (!hasValidCoordinates) {
      setSearchError('No se pudieron obtener las coordenadas. Por favor, selecciona una ubicación en el mapa moviendo el marcador o haciendo clic en el mapa.',);
      return;
    }

    let finalLatitude, finalLongitude;

    if (temporaryLocation.latitude !== undefined && temporaryLocation.longitude !== undefined) {
      finalLatitude = temporaryLocation.latitude;
      finalLongitude = temporaryLocation.longitude;
    } else if (temporaryLocation.center && Array.isArray(temporaryLocation.center)) {
      [finalLongitude, finalLatitude] = temporaryLocation.center;
    }

    if (typeof finalLatitude !== 'number' || typeof finalLongitude !== 'number' || isNaN(finalLatitude) || isNaN(finalLongitude)) {
      setSearchError('Las coordenadas obtenidas no son válidas. Por favor, selecciona una ubicación en el mapa.',);
      return;
    }

    // Validar duplicados
    const targetList = modalType === 'zones' ? tempOptions.zones : tempOptions.points;
    const isDuplicate = targetList.some((item) =>
      item.id === temporaryLocation.id || item.place_name?.toLowerCase() === temporaryLocation.place_name?.toLowerCase(),
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
    setMapModalVisible(true);
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
          <TouchableOpacity onPress={handleEdit}>
            <Feather name="edit" size={20} color="#00CC86" />
          </TouchableOpacity>
        </View>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Aún no has configurado tu cobertura
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleEdit}>
          <Text style={styles.buttonText}>Configurar cobertura</Text>
        </TouchableOpacity>

        {/* Modal Interno */}
        <CoverageModal
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

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          Cobertura de zonas y método de entrega
        </Text>
        {!editing && (
          <TouchableOpacity onPress={handleEdit}>
            <Feather name="edit" size={20} color="#00CC86" />
          </TouchableOpacity>
        )}
      </View>

      {!editing ? (
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
              {renderSwitch('homeDeliveryEnabled')}
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
                disabled={loading}
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
              {renderSwitch('deliveryCentersEnabled')}
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
        </ScrollView>
      )}

      {/* Modal de Confirmación Interno */}
      <CoverageModal
        visible={internalModal.visible}
        title={internalModal.title}
        message={internalModal.message}
        type={internalModal.type}
        onConfirm={internalModal.onConfirm}
        onCancel={internalModal.onCancel}
      />

      {/* ========== MODAL MAPBOX ========== */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setMapModalVisible(false);
          resetModalState();
        }}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalContent}>
            <View style={styles.mapModalHeader}>
              <Text style={styles.mapModalTitle}>{getModalTitle()}</Text>
              <TouchableOpacity
                onPress={() => {
                  setMapModalVisible(false);
                  resetModalState();
                }}
                style={styles.mapModalCloseButton}
              >
                <Feather name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.mapModalBody}>
              <Text style={styles.mapModalLabel}>
                {modalType === 'zones' ? 'Buscar zona, colonia o municipio:' : 'Buscar punto de entrega:'}
              </Text>
              <View style={styles.mapModalSearchContainer}>
                <TextInput
                  style={styles.mapModalInput}
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
                    style={styles.mapModalClearSearchButton}
                  >
                    <Feather name="x" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>

              {searchError && (
                <View style={styles.mapModalErrorContainer}>
                  <Feather name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.mapModalErrorText}>{searchError}</Text>
                </View>
              )}

              {showSuggestions && (
                <View style={styles.mapModalSuggestionsContainer}>
                  {isLoadingSuggestions ? (
                    <View style={styles.mapModalLoadingContainer}>
                      <ActivityIndicator size="small" color="#00CC86" />
                      <Text style={styles.mapModalLoadingText}>
                        {searchQuery.length < 3 ? 'Escribe al menos 3 caracteres...' : 'Buscando ubicaciones en tu área...'}
                      </Text>
                    </View>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={suggestion.id || index}
                        style={styles.mapModalSuggestionItem}
                        onPress={() => handleSuggestionSelect(suggestion)}
                      >
                        <Feather
                          name={
                            suggestion.isBusiness ? 'shopping-bag' : 'map-pin'
                          }
                          size={14}
                          color={suggestion.isBusiness ? '#FF6B35' : '#00CC86'}
                        />
                        <View style={styles.mapModalSuggestionTextContainer}>
                          <Text
                            style={styles.mapModalSuggestionText}
                            numberOfLines={1}
                          >
                            {suggestion.text}
                          </Text>
                          <Text
                            style={styles.mapModalSuggestionAddress}
                            numberOfLines={1}
                          >
                            {suggestion.place_name}
                          </Text>
                          {suggestion.isBusiness && (
                            <View style={styles.mapModalBusinessBadge}>
                              <Text style={styles.mapModalBusinessBadgeText}>
                                Negocio
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.mapModalNoResultsContainer}>
                      <Feather name="search" size={20} color="#9CA3AF" />
                      <Text style={styles.mapModalNoResultsText}>
                        {searchQuery.length >= 3 ? 'No se encontraron resultados para tu búsqueda' : 'Escribe al menos 3 caracteres para buscar'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.mapModalMapContainer}>
                <Text style={styles.mapModalLabel}>Selecciona en el mapa:</Text>
                <MapboxPicker
                  style={styles.mapModalMap}
                  onLocationChange={handleMapboxLocationChange}
                  latitude={temporaryLocation?.latitude}
                  longitude={temporaryLocation?.longitude}
                />
              </View>

              <View style={styles.mapModalFooter}>
                <TouchableOpacity
                  style={styles.mapModalCancelButton}
                  onPress={() => {
                    setMapModalVisible(false);
                    resetModalState();
                  }}
                >
                  <Text style={styles.mapModalCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mapModalConfirmButton, !temporaryLocation && styles.mapModalConfirmButtonDisabled,
                  ]}
                  disabled={!temporaryLocation}
                  onPress={confirmAddLocation}
                >
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={styles.mapModalConfirmButtonText}>
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
  saveButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
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
  mapModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mapModalContent: {
    backgroundColor: '#fff',
    marginTop: 50,
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  mapModalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    lineHeight: 24,
    flex: 1,
  },
  mapModalCloseButton: {
    padding: 4,
  },
  mapModalBody: {
    flex: 1,
    padding: 20,
  },
  mapModalLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 18,
  },
  mapModalSearchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapModalInput: {
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
  mapModalClearSearchButton: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#E5E7EB',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapModalErrorContainer: {
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
  mapModalErrorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
  mapModalSuggestionsContainer: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 150,
    elevation: 2,
  },
  mapModalSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    gap: 8,
  },
  mapModalSuggestionTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  mapModalSuggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
  mapModalSuggestionAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'Poppins-Light',
    lineHeight: 16,
  },
  mapModalBusinessBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  mapModalBusinessBadgeText: {
    fontSize: 10,
    color: '#FF6B35',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.2,
  },
  mapModalLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  mapModalLoadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
  mapModalNoResultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  mapModalNoResultsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
  mapModalMapContainer: {
    flex: 1,
    marginBottom: 20,
  },
  mapModalMap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 300,
  },
  mapModalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  mapModalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  mapModalCancelButtonText: {
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  mapModalConfirmButton: {
    flex: 1,
    backgroundColor: '#00CC86',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  mapModalConfirmButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  mapModalConfirmButtonText: {
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
