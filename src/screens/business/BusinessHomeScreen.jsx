import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDashboardByBusinessId } from '../../services/BusinessService';
import { updateDeliveryZoneOptions } from '../../services/DeliveryZoneService';
import Coverage from '../../components/Coverage';
import Commission from '../../components/Commission';
import PaymentMethod from '../../components/PaymentMethod';

const { width } = Dimensions.get('window');

// Componentes de UI reutilizables
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Button = ({ children, onPress, style, textStyle }) => (
  <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
    <Text style={[styles.buttonText, textStyle]}>{children}</Text>
  </TouchableOpacity>
);

// Modal Personalizado
const CustomModal = ({ visible, title, message, type = 'info', onConfirm, onCancel, confirmText = 'Aceptar', cancelText = 'Cancelar', }) => (
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
            <Button
              style={styles.modalCancelButton}
              textStyle={styles.modalCancelButtonText}
              onPress={onCancel}
            >
              {cancelText}
            </Button>
          )}
          <Button
            style={[
              styles.modalConfirmButton,
              type === 'success' ? styles.modalConfirmButtonSuccess : type === 'error' ? styles.modalConfirmButtonError : styles.modalConfirmButtonInfo,
            ]}
            onPress={onConfirm}
          >
            {confirmText}
          </Button>
        </View>
      </View>
    </View>
  </Modal>
);

// Mapeo completo de sectores
const SECTOR_MAP = {
  food: {
    name: 'Alimentos y Bebidas',
    icon: '🍔',
    description: 'Restaurantes, cafeterías, comida rápida, etc.',
  },
  technology: {
    name: 'Electrónica y Tecnología',
    icon: '💻',
    description: 'Dispositivos electrónicos, computadoras, smartphones, etc.',
  },
  fashion: {
    name: 'Moda y Calzado',
    icon: '👕',
    description: 'Ropa, calzado, accesorios, etc.',
  },
  hardware: {
    name: 'Ferretería',
    icon: '🛠',
    description: 'Herramientas, materiales de construcción, etc.',
  },
  pharmacy: {
    name: 'Farmacia',
    icon: '💊',
    description: 'Medicamentos, productos de cuidado personal, etc.',
  },
  other: {
    name: 'Otro',
    icon: '🏢',
    description: 'Otro tipo de negocio',
  },
};

// Función auxiliar para obtener información del sector
const getSectorInfo = (sectorKey) => {
  if (!sectorKey) {
    return {
      name: 'No configurado',
      icon: '🏢',
      description: 'Sector no especificado',
      isConfigured: false,
    };
  }

  const sectorInfo = SECTOR_MAP[sectorKey.toLowerCase()];
  if (!sectorInfo) {
    return {
      name: 'Desconocido',
      icon: '❓',
      description: 'Sector no reconocido',
      isConfigured: false,
    };
  }

  return {
    ...sectorInfo, isConfigured: true,
  };
};

// SectorCard
const SectorCard = ({ sector, icon, description }) => (
  <Card style={styles.sectorCard}>
    <View style={styles.sectorHeader}>
      <View style={styles.sectorTitle}>
        <Text style={styles.mutedText}>Sector de tu negocio</Text>
      </View>
      <MaterialIcons name="info-outline" size={20} color="#6B7280" />
    </View>
    <View style={styles.sectorContent}>
      <Text style={styles.emoji}>{icon || '🏢'}</Text>
      <View style={styles.sectorTextContainer}>
        <Text style={styles.sectorText}>
          Tu sector actual:{' '}
          <Text style={styles.sectorName}>{sector || 'No configurado'}</Text>
        </Text>
        {description && (
          <Text style={styles.sectorDescription}>{description}</Text>
        )}
      </View>
    </View>
    {(!sector || sector === 'No configurado' || sector === 'Desconocido') && (
      <View style={styles.warningBox}>
        <MaterialIcons name="warning" size={16} color="#B45309" />
        <Text style={styles.warningText}>
          Completa la información de tu sector para mejorar tu visibilidad
        </Text>
      </View>
    )}
  </Card>
);

export default function BusinessHomeScreen() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zonesCommissions, setZonesCommissions] = useState([]);
  const [pointsCommissions, setPointsCommissions] = useState([]);

  // Estado compartido para sincronización visual
  const [deliveryOptions, setDeliveryOptions] = useState({
    homeDeliveryEnabled: false,
    pickupEnabled: false,
    deliveryCentersEnabled: false,
    zones: [],
    points: [],
  });

  // Estados para rollback completo
  const [initialCommissionsState, setInitialCommissionsState] = useState({
    zones: [],
    points: [],
  });
  const [previousDeliveryOptions, setPreviousDeliveryOptions] = useState(null);

  // Estado para modales
  const [modal, setModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    onCancel: null,
  });

  const [businessId, setBusinessId] = useState(null);

  // Mostrar modal personalizado
  const showModal = (title, message, type = 'info', onConfirm = null, onCancel = null,) => {
    setModal({
      visible: true,
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setModal({ ...modal, visible: false })),
      onCancel: onCancel || (() => setModal({ ...modal, visible: false })),
    });
  };

  // Función para extraer ID numérico
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

  // Transforma center a objeto CenterDTO
  const transformCenterToDTO = (items) => {
    return items.map((item) => {
      // Si center es null o undefined, intentar obtener de geometry
      if (!item.center && item.geometry?.coordinates) {
        const coords = item.geometry.coordinates;
        if (Array.isArray(coords) && coords.length >= 2) {
          return {
            ...item,
            center: {
              longitude: coords[0],
              latitude: coords[1],
            },
          };
        }
      }

      // Si center es un array, transformarlo a objeto
      if (item.center && Array.isArray(item.center)) {
        return {
          ...item,
          center: {
            longitude: item.center[0],
            latitude: item.center[1],
          },
        };
      }

      // Si center ya es un objeto, mantenerlo
      if (item.center && typeof item.center === 'object') {
        return item;
      }

      // Si no hay center válido, mantener el item original
      return item;
    });
  };

  // 🔄 Reload data
  const reloadDashboardData = async (specificBusinessId = null) => {
    try {
      const idToUse = specificBusinessId || businessId;

      // Validar que businessId sea válido
      if (!idToUse || idToUse === 'null' || idToUse === 'undefined') {
        console.error('❌ BusinessId inválido:', idToUse);
        setError('ID de negocio no válido');
        return;
      }

      console.log('🔄 Recargando datos del dashboard para businessId:', idToUse,);
      const data = await getDashboardByBusinessId(idToUse);

      if (!data) {
        console.error('❌ No se recibieron datos del dashboard');
        setError('No se pudieron cargar los datos del negocio');
        return;
      }

      setDashboardData(data);
      setError(null);

      // Actualizar delivery options
      if (data?.deliveryZones?.[0]) {
        const zoneData = data.deliveryZones[0];

        // Asegurar eliminación de type
        const transformAndCleanItem = (item) => {
          if (!item) return item;

          let transformed = { ...item };

          // Transformar center si es array o si está en geometry
          if (transformed.center && Array.isArray(transformed.center)) {
            transformed.center = {
              longitude: transformed.center[0],
              latitude: transformed.center[1],
            };
          } else if (!transformed.center && transformed.geometry?.coordinates) {
            const coords = transformed.geometry.coordinates;
            if (Array.isArray(coords) && coords.length >= 2) {
              transformed.center = {
                longitude: coords[0],
                latitude: coords[1],
              };
            }
          }

          // Asegurar que el ID sea numérico
          transformed.id = extractNumericId(transformed.id);

          delete transformed.type;
          if (transformed.geometry && transformed.geometry.type) {
            delete transformed.geometry.type;
          }

          return transformed;
        };

        const initialOptions = {
          homeDeliveryEnabled: zoneData.homeDeliveryEnabled || false,
          pickupEnabled: zoneData.pickupEnabled || false,
          deliveryCentersEnabled: zoneData.deliveryCentersEnabled || false,
          zones: (zoneData.zones || []).map(transformAndCleanItem),
          points: (zoneData.points || []).map(transformAndCleanItem),
          deliveryZone: zoneData,
        };

        setDeliveryOptions(initialOptions);
        setPreviousDeliveryOptions(initialOptions);
      }

      // Transformar datos para el componente Commission
      if (data?.zoneCommissions && data?.deliveryZones?.[0]) {
        console.log('🔄 Actualizando comisiones con nuevos datos...');
        transformCommissionData(data.zoneCommissions, data.deliveryZones[0]);
      }
    } catch (error) {
      console.error('❌ Error recargando datos:', error);
      setError('Error al cargar los datos del negocio: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const stored = await AsyncStorage.getItem('userInfo');

        if (stored) {
          const user = JSON.parse(stored);
          const id = user.businessId;

          // Validar que el businessId sea válido
          if (!id || id === 'null' || id === 'undefined') {
            console.error('❌ BusinessId no válido en userInfo:', id);
            setError('ID de negocio no válido en la configuración');
            setLoading(false);
            return;
          }

          setBusinessId(id);
          await reloadDashboardData(id);
        } else {
          console.error('❌ No se encontró userInfo en AsyncStorage');
          setError('No se encontró información de usuario');
        }
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        setError('Error al cargar los datos del dashboard: ' + error.message);
        showModal(
          'Error',
          'No se pudieron cargar los datos del dashboard',
          'error',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Transforma los datos del dashboard al formato del componente Commission
  const transformCommissionData = (zoneCommissions, deliveryZone) => {
    const transformCommissionData = (commissions) => {
      return commissions.map((item) => ({
        id: item.zoneCommissionId || item.id,
        name: item.address,
        type: item.shippingType === 'DELIVERY' ? 'delivery' : 'pickup',
        selectedOption: item.selectedOption || 'free',
        commissionAmount: item.commissionAmount?.toString() || '',
        coordinates: item.coordinates ? typeof item.coordinates === 'string' ? JSON.parse(item.coordinates) : item.coordinates : {},
        address: item.address,
        // ZoneCommissionId real para las eliminaciones
        zoneCommissionId: item.zoneCommissionId,
        // Referencia de entrega si existe
        deliveryZoneId: item.deliveryZone?.id,
        ...item,
      }));
    };

    const deliveryZones = zoneCommissions.filter((item) => item.shippingType === 'DELIVERY',);
    const pickupPoints = zoneCommissions.filter((item) => item.shippingType === 'PICKUP',);

    console.log('🔄 Transformando comisiones:', {
      deliveryZones: deliveryZones.length,
      pickupPoints: pickupPoints.length,
    });

    setZonesCommissions(transformCommissionData(deliveryZones));
    setPointsCommissions(transformCommissionData(pickupPoints));
  };

  // Manejador para cuando Coverage entra en edición
  const handleCoverageEdit = () => {
    console.log('📝 Iniciando edición - Guardando estado inicial de comisiones',);
    // Guardar estado actual de comisiones para posible rollback
    setInitialCommissionsState({
      zones: [...zonesCommissions],
      points: [...pointsCommissions],
    });
  };

  // Auxiliar para obtener zoneCommissionIds eliminados
  const getDeletedZoneCommissionIds = (initialCommissions, currentCommissions,) => {
    const initialIds = new Set(
      initialCommissions
        .map((item) => item.zoneCommissionId || item.id)
        .filter(Boolean),
    );
    const currentIds = new Set(
      currentCommissions
        .map((item) => item.zoneCommissionId || item.id)
        .filter(Boolean),
    );

    const deletedIds = [];
    initialIds.forEach((id) => {
      if (!currentIds.has(id)) {
        deletedIds.push(id);
      }
    });

    console.log('🗑️ ZoneCommissionIds eliminados:', {
      initialIds: Array.from(initialIds),
      currentIds: Array.from(currentIds),
      deletedIds,
    });

    return deletedIds;
  };

  // Manejador para eliminaciones inmediatas
  const handleImmediateItemRemoval = (type, removedId, address = null) => {
    console.log(`🗑️ Eliminación inmediata: ${type} - ${removedId}`, address ? `(address: ${address})` : '',);

    // Normalizar ID
    const normalizeId = (id) => {
      if (!id) return null;
      if (typeof id === 'number') return id;
      if (typeof id === 'string') {
        if (id.startsWith('place.')) {
          const numericPart = id.replace('place.', '');
          return parseInt(numericPart, 10);
        }
        return parseInt(id, 10);
      }
      return null;
    };

    const numericRemovedId = normalizeId(removedId);

    if (type === 'zones') {
      const updatedZones = zonesCommissions.filter((commission) => {
        const commissionId = commission.zoneCommissionId || commission.id;
        const numericCommissionId = normalizeId(commissionId);
        return numericCommissionId !== numericRemovedId;
      });
      setZonesCommissions([...updatedZones]);
    } else if (type === 'points') {
      const updatedPoints = pointsCommissions.filter((commission) => {
        const commissionId = commission.zoneCommissionId || commission.id;
        const numericCommissionId = normalizeId(commissionId);
        return numericCommissionId !== numericRemovedId;
      });
      setPointsCommissions([...updatedPoints]);
    }

    console.log('✅ Eliminación procesada');
  };

  // Manejador para rollback completo
  const handleCoverageRollback = (rollbackOptions) => {
    console.log('🔄 Ejecutando rollback completo');

    // 1. Rollback de deliveryOptions
    setDeliveryOptions(rollbackOptions);

    // 2. Rollback de comisiones
    setZonesCommissions([...initialCommissionsState.zones]);
    setPointsCommissions([...initialCommissionsState.points]);

    console.log('✅ Rollback completado - Comisiones restauradas:', {
      zones: initialCommissionsState.zones.length,
      points: initialCommissionsState.points.length,
    });
  };

  const handleCoverageUpdate = async (updatedOptions, shouldSaveToBackend = true,) => {
    if (!businessId || businessId === 'null' || businessId === 'undefined') {
      console.error('❌ BusinessId inválido para guardar:', businessId);
      showModal('Error', 'ID de negocio no válido', 'error');
      return false;
    }

    setPreviousDeliveryOptions(deliveryOptions);
    setDeliveryOptions(updatedOptions);

    if (shouldSaveToBackend && businessId) {
      try {
        // Transformar center a objeto CenterDTO
        const zonesWithCenterDTO = transformCenterToDTO(updatedOptions.zones || [],);
        const pointsWithCenterDTO = transformCenterToDTO(updatedOptions.points || [],);

        // Validar que todas las zonas y puntos tengan center válido
        const invalidZones = zonesWithCenterDTO.filter((zone) => !zone.center);
        const invalidPoints = pointsWithCenterDTO.filter((point) => !point.center,);

        if (invalidZones.length > 0 || invalidPoints.length > 0) {
          console.warn('⚠️ Algunas ubicaciones no tienen coordenadas válidas:', {
            invalidZones: invalidZones.length,
            invalidPoints: invalidPoints.length,
          });
        }

        const payload = {
          businessAuxId: Number(businessId),
          homeDeliveryEnabled: updatedOptions.homeDeliveryEnabled,
          pickupEnabled: updatedOptions.pickupEnabled,
          deliveryCentersEnabled: updatedOptions.deliveryCentersEnabled,
          zones: zonesWithCenterDTO,
          points: pointsWithCenterDTO,
          deletedZones: getDeletedZoneCommissionIds(initialCommissionsState.zones, zonesCommissions,),
          deletedPoints: getDeletedZoneCommissionIds(initialCommissionsState.points, pointsCommissions,),
          commissions: getZoneCommissions(),
        };

        console.log('📤 Enviando payload...');

        await updateDeliveryZoneOptions(businessId, payload);

        console.log('🔄 Recargando datos...');
        await reloadDashboardData();

        showModal('Éxito', 'Cobertura y comisiones actualizadas correctamente', 'success');
        setInitialCommissionsState({ zones: [], points: [] });
        return true;
      } catch (error) {
        console.error('❌ Error guardando cobertura:', error);

        // Rollback visual inmediato
        setDeliveryOptions(previousDeliveryOptions);
        setZonesCommissions([...initialCommissionsState.zones]);
        setPointsCommissions([...initialCommissionsState.points]);

        let errorMessage = 'No se pudo guardar la cobertura';
        if (error.response?.data) {
          errorMessage += `: ${error.response.data}`;
        } else if (error.message) {
          errorMessage += `: ${error.message}`;
        }

        showModal('Error', errorMessage, 'error');
        return false;
      }
    }
    return true;
  };

  const getZoneCommissions = () => {
    console.log('🔄 Consolidando TODAS las comisiones...');
    console.log('📦 ZonesCommissions:', zonesCommissions);
    console.log('📦 PointsCommissions:', pointsCommissions);

    const allCommissions = [...zonesCommissions, ...pointsCommissions];

    const formattedCommissions = allCommissions.map((commission, index) => {
      if (!commission) {
        console.warn(`⚠️ Comisión ${index} es null/undefined, omitiendo`);
        return null;
      }

      // Validar datos mínimos
      const hasValidAddress = commission.address || commission.name;
      if (!hasValidAddress) {
        console.warn(`⚠️ Comisión ${index} no tiene dirección válida, omitiendo`, commission);
        return null;
      }

      // Formatear commissionAmount
      let commissionAmount = null;
      if (commission.selectedOption === 'commission' && commission.commissionAmount) {
        const amount = parseFloat(commission.commissionAmount);
        commissionAmount = isNaN(amount) ? null : amount;
      }

      // Preparar coordinates de forma robusta
      let coordinates = commission.coordinates;
      if (!coordinates) {
        // Intentar obtener de geometry si está disponible
        if (commission.geometry?.coordinates) {
          const [longitude, latitude] = commission.geometry.coordinates;
          coordinates = { longitude, latitude };
        } else if (commission.center) {
          coordinates = { 
            longitude: commission.center.longitude, 
            latitude: commission.center.latitude 
          };
        }
      }

      if (coordinates && typeof coordinates === 'string') {
        try {
          coordinates = JSON.parse(coordinates);
        } catch (error) {
          console.warn('⚠️ Error parseando coordinates:', error);
          coordinates = {};
        }
      }

      const formattedCommission = {
        businessAuxId: Number(businessId),
        zoneCommissionId: commission.zoneCommissionId || commission.id,
        shippingType: commission.type === 'delivery' ? 'DELIVERY' : 'PICKUP',
        selectedOption: commission.selectedOption || 'free',
        commissionAmount: commissionAmount,
        address: commission.address || commission.name || '',
        coordinates: coordinates || {},
        isActive: true,
        deliveryZoneId: commission.deliveryZoneId || null,
      };

      console.log(`✅ Comisión ${index} formateada:`, formattedCommission);
      return formattedCommission;
    }).filter(commission => commission !== null); // Filtrar nulos

    console.log(`✅ ${formattedCommissions.length} comisiones consolidadas`);
    return formattedCommissions;
  };

  const handleItemAddition = (type, newCommission) => {
    console.log(`➕ Agregando nueva comisión ${type}:`, newCommission);

    if (type === 'zones') {
      setZonesCommissions(prev => {
        // Evitar duplicados
        const exists = prev.some(zone => zone.id === newCommission.id);
        if (exists) {
          console.warn('⚠️ Zona ya existe, no se agrega:', newCommission);
          return prev;
        }
        const updated = [...prev, newCommission];
        console.log('✅ Zona agregada. Total zonas ahora:', updated.length);
        return updated;
      });
    } else if (type === 'points') {
      setPointsCommissions(prev => {
        // Evitar duplicados
        const exists = prev.some(point => point.id === newCommission.id);
        if (exists) {
          console.warn('⚠️ Punto ya existe, no se agrega:', newCommission);
          return prev;
        }
        const updated = [...prev, newCommission];
        console.log('✅ Punto agregado. Total puntos ahora:', updated.length);
        return updated;
      });
    }
  };

  // Manejador para cambios en switches (actualización inmediata)
  const handleSwitchChange = (option, newValue) => {
    const updatedOptions = {
      ...deliveryOptions,
      [option]: newValue,
    };

    // Actualización visual inmediata sin guardar en backend
    handleCoverageUpdate(updatedOptions, false);
  };

  const handleCommissionsUpdate = (updatedZones, updatedPoints) => {
    console.log('Comisiones actualizadas - zonas:', updatedZones);
    console.log('Comisiones actualizadas - puntos:', updatedPoints);

    setZonesCommissions(updatedZones);
    setPointsCommissions(updatedPoints);
  };

  const handlePaymentMethodsUpdate = (updatedPaymentMethods) => {
    if (dashboardData && dashboardData.business) {
      setDashboardData((prev) => ({
        ...prev,
        business: {
          ...prev.business,
          ...updatedPaymentMethods,
        },
      }));
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#00CC86" />
        <Text style={styles.loadingText}>
          Cargando información del negocio...
        </Text>
      </View>
    );
  }

  if (error || !dashboardData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>
          {error || 'No se pudieron cargar los datos del negocio'}
        </Text>
        <Button
          style={styles.primaryButton}
          onPress={() => reloadDashboardData()}
        >
          Reintentar
        </Button>
      </View>
    );
  }

  // Usar operador de encadenamiento opcional para evitar errores
  const business = dashboardData?.business || {};
  const sector = dashboardData?.sector;

  // Obtener información validada del sector
  const sectorInfo = getSectorInfo(sector?.iconName);

  return (
    <View style={styles.container}>
      <View style={styles.mobileFrame}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {business?.fullName || 'Mi Negocio'}
              </Text>
              <Text style={styles.headerSubtitle}>Dashboard</Text>
            </View>

            {/* Card 1: Sector */}
            <SectorCard
              sector={sectorInfo.name}
              icon={sectorInfo.icon}
              description={sectorInfo.description}
            />

            {/* Card 2: Coverage */}
            <Coverage
              businessId={businessId}
              deliveryOptions={deliveryOptions}
              onUpdate={handleCoverageUpdate}
              onSwitchChange={handleSwitchChange}
              onRollback={handleCoverageRollback}
              zonesCommissions={zonesCommissions}
              pointsCommissions={pointsCommissions}
              showModal={showModal}
              onItemRemoval={handleImmediateItemRemoval}
              onEditStart={handleCoverageEdit}
              onItemAddition={handleItemAddition}
            />

            {/* Card 3: Commission */}
            <Card style={styles.commissionCard}>
              <Commission
                zonesCommissions={zonesCommissions}
                pointsCommissions={pointsCommissions}
                onZonesCommissionsChange={setZonesCommissions}
                onPointsCommissionsChange={setPointsCommissions}
                onUpdate={handleCommissionsUpdate}
                businessId={businessId}
                deliveryOptions={deliveryOptions}
                showModal={showModal}
              />
            </Card>

            {/* Card 4: Payment Methods */}
            <Card style={styles.paymentCard}>
              <PaymentMethod
                business={business}
                businessId={businessId}
                onUpdate={handlePaymentMethodsUpdate}
              />
            </Card>
          </View>
        </ScrollView>
      </View>

      {/* Modal Personalizado */}
      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginHorizontal: 24,
    fontFamily: 'Poppins-Regular',
    lineHeight: 22,
  },
  mobileFrame: {
    width: '100%',
    maxWidth: 390,
    minHeight: '100%',
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
    paddingVertical: 24,
  },

  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    lineHeight: 34,
  },
  headerSubtitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Light',
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 22,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  // SECTOR CARD
  sectorCard: {
    padding: 24,
  },
  sectorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectorTitle: {
    flex: 1,
  },
  mutedText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    letterSpacing: 0.2,
  },
  sectorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  emoji: {
    fontSize: 40,
  },
  sectorTextContainer: {
    flex: 1,
  },
  sectorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 6,
    fontFamily: 'Poppins-Regular',
    lineHeight: 22,
  },
  sectorName: {
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  sectorDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Light',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  warningBox: {
    backgroundColor: '#FEF3CD',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    flex: 1,
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },

  primaryButton: {
    backgroundColor: '#00CC86',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.3,
  },

  commissionCard: {
    padding: 24,
    marginBottom: 16,
  },
  paymentCard: {
    padding: 24,
    marginBottom: 16,
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
    width: '100%',
    maxWidth: 400,
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
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
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
  },
  modalCancelButtonText: {
    color: '#374151',
  },
  modalConfirmButton: {
    flex: 1,
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
});
