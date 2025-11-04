import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDashboardByBusinessId } from '../../services/BusinessService';
import Coverage from '../../components/Coverage';
import Commission from '../../components/Commission';
import PaymentMethod from '../../components/PaymentMethod';

const { width } = Dimensions.get('window');

// Componentes de UI reutilizables
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Button = ({ children, onPress, style }) => (
  <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
    <Text style={styles.buttonText}>{children}</Text>
  </TouchableOpacity>
);

const Badge = ({ children, style }) => (
  <View style={[styles.badge, style]}>
    <Text style={styles.badgeText}>{children}</Text>
  </View>
);

// Mapeo completo de sectores
const SECTOR_MAP = {
  'food': {
    name: 'Alimentos y Bebidas',
    icon: '🍔',
    description: 'Restaurantes, cafeterías, comida rápida, etc.'
  },
  'technology': {
    name: 'Electrónica y Tecnología',
    icon: '💻',
    description: 'Dispositivos electrónicos, computadoras, smartphones, etc.'
  },
  'fashion': {
    name: 'Moda y Calzado',
    icon: '👕',
    description: 'Ropa, calzado, accesorios, etc.'
  },
  'hardware': {
    name: 'Ferretería',
    icon: '🛠',
    description: 'Herramientas, materiales de construcción, etc.'
  },
  'pharmacy': {
    name: 'Farmacia',
    icon: '💊',
    description: 'Medicamentos, productos de cuidado personal, etc.'
  },
  'other': {
    name: 'Otro',
    icon: '🏢',
    description: 'Otro tipo de negocio'
  }
};

// Función auxiliar para obtener información del sector
const getSectorInfo = (sectorKey) => {
  if (!sectorKey) {
    return {
      name: 'No configurado',
      icon: '🏢',
      description: 'Sector no especificado',
      isConfigured: false
    };
  }
  
  const sectorInfo = SECTOR_MAP[sectorKey.toLowerCase()];
  if (!sectorInfo) {
    return {
      name: 'Desconocido',
      icon: '❓',
      description: 'Sector no reconocido',
      isConfigured: false
    };
  }
  
  return {
    ...sectorInfo,
    isConfigured: true
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
          Tu sector actual: <Text style={styles.sectorName}>{sector || 'No configurado'}</Text>
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const stored = await AsyncStorage.getItem('userInfo');
        if (stored) {
          const user = JSON.parse(stored);
          const businessId = user.businessId;
          
          if (businessId) {
            const data = await getDashboardByBusinessId(businessId);
            setDashboardData(data);
            
            // Transformar datos para el componente Commission
            if (data?.zoneCommissions && data?.deliveryZones?.[0]) {
              transformCommissionData(data.zoneCommissions, data.deliveryZones[0]);
            }
          } else {
            setError('No se encontró businessId en userInfo');
          }
        } else {
          setError('No se encontró userInfo en AsyncStorage');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error al cargar los datos del dashboard');
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
        id: item.zoneCommissionId,
        name: item.address,
        type: item.shippingType === 'DELIVERY' ? 'delivery' : 'pickup',
        selectedOption: item.selectedOption || 'free',
        commissionAmount: item.commissionAmount?.toString() || '',
        coordinates: item.coordinates ? JSON.parse(item.coordinates) : {},
        address: item.address,
      }));
    };

    const deliveryZones = zoneCommissions.filter(
      item => item.shippingType === 'DELIVERY'
    );
    const pickupPoints = zoneCommissions.filter(
      item => item.shippingType === 'PICKUP'
    );

    setZonesCommissions(transformCommissionData(deliveryZones));
    setPointsCommissions(transformCommissionData(pickupPoints));
  };

  const handleCoverageUpdate = (updatedCoverage) => {
    setDashboardData(prev => ({
      ...prev,
      deliveryOptions: updatedCoverage
    }));
  };

  const handleCommissionsUpdate = (updatedZones, updatedPoints) => {
    console.log('Comisiones actualizadas - zonas:', updatedZones);
    console.log('Comisiones actualizadas - puntos:', updatedPoints);
    
    setZonesCommissions(updatedZones);
    setPointsCommissions(updatedPoints);
  };

  const handlePaymentMethodsUpdate = (updatedPaymentMethods) => {
    setDashboardData(prev => ({
      ...prev,
      business: {
        ...prev.business,
        ...updatedPaymentMethods
      }
    }));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#00CC86" />
        <Text style={styles.loadingText}>Cargando información del negocio...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Button style={styles.primaryButton} onPress={() => window.location.reload()}>
          Reintentar
        </Button>
      </View>
    );
  }

  const { business, sector, deliveryZones } = dashboardData;

  // Obtener información validada del sector
  const sectorInfo = getSectorInfo(sector?.iconName);
  
  // Transformar datos para Coverage
  const deliveryOptions = deliveryZones && deliveryZones.length > 0 ? {
    homeDeliveryEnabled: deliveryZones[0].homeDeliveryEnabled || false,
    pickupEnabled: deliveryZones[0].pickupEnabled || false,
    deliveryCentersEnabled: deliveryZones[0].deliveryCentersEnabled || false,
    zones: deliveryZones[0].zones || [],
    points: deliveryZones[0].points || [],
    deliveryZone: deliveryZones[0]
  } : {
    homeDeliveryEnabled: false,
    pickupEnabled: false,
    deliveryCentersEnabled: false,
    zones: [],
    points: []
  };

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
              <Text style={styles.headerTitle}>{business?.fullName || 'Mi Negocio'}</Text>
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
              businessId={business?.businessId}
              deliveryOptions={deliveryOptions}
              onUpdate={handleCoverageUpdate}
            />

            {/* Card 3: Commission */}
            <Card style={styles.commissionCard}>
              <Commission
                zonesCommissions={zonesCommissions}
                pointsCommissions={pointsCommissions}
                onZonesCommissionsChange={setZonesCommissions}
                onPointsCommissionsChange={setPointsCommissions}
                onUpdate={handleCommissionsUpdate}
                businessId={business?.businessId}
              />
            </Card>

            {/* Card 4: Payment Methods */}
            <Card style={styles.paymentCard}>
              <PaymentMethod 
                business={business}
                businessId={business?.businessId}
                onUpdate={handlePaymentMethodsUpdate}
              />
            </Card>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

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

  badge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#2E7D32',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.2,
  },
});
