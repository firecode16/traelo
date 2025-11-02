import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDashboardByBusinessId } from '../../services/BusinessService';

const { width } = Dimensions.get('window');

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

// SectorCard
const SectorCard = ({ sector, icon }) => (
  <Card style={styles.sectorCard}>
    <View style={styles.sectorHeader}>
      <View style={styles.sectorTitle}>
        <Text style={styles.mutedText}>Sector de tu negocio</Text>
      </View>
      <MaterialIcons name="info-outline" size={20} color="#6B7280" />
    </View>
    <View style={styles.sectorContent}>
      <Text style={styles.emoji}>{icon || '🏢'}</Text>
      <Text style={styles.sectorText}>Tu sector actual: {sector || 'No configurado'}</Text>
    </View>
  </Card>
);

// CoverageCard
const CoverageCard = ({ deliveryZones }) => {
  const hasConfiguration = deliveryZones && deliveryZones.length > 0;
  
  const deliveryMethods = [
    { 
      icon: 'local-shipping', 
      label: "Envío a domicilio",
      enabled: deliveryZones?.some(zone => zone.homeDeliveryEnabled) || false
    },
    { 
      icon: 'shopping-bag', 
      label: "Recoger en tienda",
      enabled: deliveryZones?.some(zone => zone.pickupEnabled) || false
    },
    { 
      icon: 'location-on', 
      label: "Punto de encuentro",
      enabled: deliveryZones?.some(zone => zone.deliveryCentersEnabled) || false
    },
  ];

  if (!hasConfiguration) {
    return (
      <Card style={styles.coverageCard}>
        <Text style={styles.cardTitle}>Cobertura de zonas y método de entrega</Text>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Aún no has configurado tu cobertura
          </Text>
        </View>
        <Button style={styles.primaryButton}>
          Configurar cobertura
        </Button>
      </Card>
    );
  }

  return (
    <Card style={styles.coverageCard}>
      <Text style={styles.cardTitle}>Cobertura de zonas y método de entrega</Text>
      
      <View style={styles.methodsSection}>
        <Text style={styles.mutedText}>Métodos activos</Text>
        <View style={styles.methodsContainer}>
          {deliveryMethods.map((method, index) => (
            <View key={index} style={styles.methodItem}>
              <View style={[
                styles.methodIcon,
                { backgroundColor: method.enabled ? '#E8F5E9' : '#F3F4F6' }
              ]}>
                <MaterialIcons 
                  name={method.icon} 
                  size={24} 
                  color={method.enabled ? '#2E7D32' : '#9CA3AF'} 
                />
              </View>
              <Text style={[
                styles.methodLabel,
                { color: method.enabled ? '#2E7D32' : '#9CA3AF' }
              ]}>
                {method.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.zonesSection}>
        <Text style={styles.mutedText}>Zonas configuradas</Text>
        <View style={styles.zonesContainer}>
          {deliveryZones.map((zone) => (
            <Badge 
              key={zone.deliveryZoneId} 
              style={styles.zoneBadge}
            >
              {zone.zoneName}
            </Badge>
          ))}
        </View>
      </View>

      <Button style={styles.primaryButton}>
        Editar
      </Button>
    </Card>
  );
};

// CommissionCard
const CommissionCard = ({ zoneCommissions }) => {
  const [commissions, setCommissions] = useState(zoneCommissions || []);

  const handleCommissionToggle = (id) => {
    setCommissions(commissions.map(commission => 
      commission.zoneCommissionId === id ? { 
        ...commission, 
        hasCommission: !commission.hasCommission 
      } : commission
    ));
  };

  const handleFreeShippingToggle = (id) => {
    setCommissions(commissions.map(commission => 
      commission.zoneCommissionId === id ? { 
        ...commission, 
        freeShipping: !commission.freeShipping 
      } : commission
    ));
  };

  const handleAmountChange = (id, amount) => {
    setCommissions(commissions.map(commission => 
      commission.zoneCommissionId === id ? { ...commission, amount } : commission
    ));
  };

  if (!commissions || commissions.length === 0) {
    return (
      <Card style={styles.commissionCard}>
        <Text style={styles.cardTitle}>Asignación de comisiones</Text>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            No hay comisiones configuradas
          </Text>
        </View>
        <Button style={styles.primaryButton}>
          Configurar comisiones
        </Button>
      </Card>
    );
  }

  return (
    <Card style={styles.commissionCard}>
      <Text style={styles.cardTitle}>Asignación de comisiones</Text>
      <Text style={styles.mutedText}>Zonas configuradas</Text>
      
      <View style={styles.zonesList}>
        {commissions.map((commission) => (
          <View key={commission.zoneCommissionId} style={styles.zoneItem}>
            <Text style={styles.zoneName}>
              {commission.shippingType} - {commission.address || 'Sin dirección'}
            </Text>
            
            <View style={styles.switchGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Aplica comisión</Text>
                <Switch
                  value={commission.hasCommission || false}
                  onValueChange={() => handleCommissionToggle(commission.zoneCommissionId)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={commission.hasCommission ? '#00CC86' : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Envío gratis</Text>
                <Switch
                  value={commission.freeShipping || false}
                  onValueChange={() => handleFreeShippingToggle(commission.zoneCommissionId)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={commission.freeShipping ? '#00CC86' : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Monto</Text>
                <TextInput
                  style={styles.input}
                  value={commission.commissionAmount ? `$${commission.commissionAmount}` : '$0.00'}
                  onChangeText={(text) => handleAmountChange(commission.zoneCommissionId, text)}
                  placeholder="$0.00"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      <Button style={styles.primaryButton}>
        Guardar cambios
      </Button>
    </Card>
  );
};

// PaymentMethodsCard
const PaymentMethodsCard = ({ business }) => {
  const [cashEnabled, setCashEnabled] = useState(business?.acceptCash || true);
  const [transferEnabled, setTransferEnabled] = useState(business?.acceptTransfer || false);
  const [bankAccount, setBankAccount] = useState(business?.bankCard || '');
  const [clabe, setClabe] = useState(business?.bankClabe || '');
  const [accountHolder, setAccountHolder] = useState('');

  return (
    <Card style={styles.paymentCard}>
      <Text style={styles.cardTitle}>Métodos de pago</Text>
      <Text style={styles.mutedText}>Métodos de pago disponibles</Text>
      
      <View style={styles.paymentSwitches}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Efectivo</Text>
          <Switch
            value={cashEnabled}
            onValueChange={setCashEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={cashEnabled ? '#00CC86' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Transferencia</Text>
          <Switch
            value={transferEnabled}
            onValueChange={setTransferEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={transferEnabled ? '#00CC86' : '#f4f3f4'}
          />
        </View>
      </View>

      {transferEnabled && (
        <View style={styles.bankInfo}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cuenta bancaria</Text>
            <TextInput
              style={styles.input}
              value={bankAccount}
              onChangeText={setBankAccount}
              placeholder="Número de cuenta"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CLABE</Text>
            <TextInput
              style={styles.input}
              value={clabe}
              onChangeText={setClabe}
              placeholder="CLABE interbancaria"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre del titular</Text>
            <TextInput
              style={styles.input}
              value={accountHolder}
              onChangeText={setAccountHolder}
              placeholder="Nombre completo"
            />
          </View>
        </View>
      )}

      <Button style={styles.primaryButton}>
        Guardar métodos de pago
      </Button>
    </Card>
  );
};

// Componente principal
export default function BusinessHomeScreen() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            //console.log('Dashboard data:', data);
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
        <Button style={styles.primaryButton} onPress={() => setLoading(true)}>
          Reintentar
        </Button>
      </View>
    );
  }

  const { business, sector, deliveryZones, zoneCommissions } = dashboardData;

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
              sector={sector?.name}
              icon={getSectorIcon(sector?.iconName)}
            />

            {/* Card 2: Coverage */}
            <CoverageCard deliveryZones={deliveryZones} />

            {/* Card 3: Commission */}
            <CommissionCard zoneCommissions={zoneCommissions} />

            {/* Card 4: Payment Methods */}
            <PaymentMethodsCard business={business} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// Auxiliar para obtener iconos por sector
const getSectorIcon = (iconName) => {
  const iconMap = {
    'food': '🍔',
    'technology': '💻',
    'fashion': '👕',
    'hardware': '🛠',
    'pharmacy': '💊',
    'other': '🏢'
  };
  return iconMap[iconName] || '🏢';
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
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginHorizontal: 24,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  methodLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
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
  },
  sectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  emoji: {
    fontSize: 40,
  },
  sectorText: {
    flex: 1,
    fontSize: 16,
  },
  coverageCard: {
    padding: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
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
    fontWeight: '600',
  },
  methodsSection: {
    marginBottom: 16,
  },
  methodsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  methodItem: {
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#E8F5E9',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zonesSection: {
    marginBottom: 16,
  },
  zonesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
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
    fontWeight: '500',
  },
  zoneBadge: {
    backgroundColor: '#E8F5E9',
  },
  commissionCard: {
    padding: 24,
  },
  paymentCard: {
    padding: 24,
  },
  zonesList: {
    marginTop: 16,
  },
  zoneItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 16,
    marginBottom: 16,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#000',
  },
  switchGroup: {
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: '#000',
  },
  inputGroup: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  paymentSwitches: {
    gap: 16,
    marginBottom: 16,
  },
  bankInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    gap: 16,
    marginBottom: 16,
  },
});
