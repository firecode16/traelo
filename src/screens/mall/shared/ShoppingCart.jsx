import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TouchableHighlight,
  StyleSheet,
  Linking,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Clipboard,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapModal from '../../../components/MapModal';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLOR } from '../../../constants/Color';
import { generateOrderMessage } from '../../../orchestrator/OrderMessageOrchestrator';
import { buildJsonOrder } from '../../../util/OrderUtils';
import { createOrder } from '../../../services/OrdersService';
import { useCart } from '../../../contexts/CartContext';
import DeliveryCommissionService from '../../../services/DeliveryCommissionService';

import FoodShoppingCart from '../food/FoodShoppingCart';
import FashionShoppingCart from '../fashion/FashionShoppingCart';
import TechnologyShoppingCart from '../technology/TechnologyShoppingCart';
import HardwareShoppingCart from '../hardware/HardwareShoppingCart';
import PharmacyShoppingCart from '../pharmacy/PharmacyShoppingCart';

// Colores específicos para los modales
const MODAL_COLORS = {
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',
  secondary: '#8E8E93',
  lightGray: '#F2F2F7',
  darkGray: '#1C1C1E',
  white: '#FFFFFF',
};

// Componente de Modal Personalizado
const CustomModal = React.memo(
  ({
    visible,
    onClose,
    title,
    message,
    type = 'info',
    iconName,
    iconColor,
    actions = [],
    showCloseButton = true,
  }) => {
    if (!visible) return null;

    const getIconConfig = () => {
      switch (type) {
        case 'success':
          return {
            name: iconName || 'checkmark-circle',
            color: MODAL_COLORS.success,
            bgColor: '#E8F5E9',
          };
        case 'error':
          return {
            name: iconName || 'close-circle',
            color: MODAL_COLORS.error,
            bgColor: '#FFEBEE',
          };
        case 'warning':
          return {
            name: iconName || 'warning',
            color: MODAL_COLORS.warning,
            bgColor: '#FFF3E0',
          };
        case 'info':
          return {
            name: iconName || 'information-circle',
            color: MODAL_COLORS.info,
            bgColor: '#E3F2FD',
          };
        default:
          return {
            name: iconName || 'information-circle',
            color: iconColor || MODAL_COLORS.primary,
            bgColor: '#E3F2FD',
          };
      }
    };

    const iconConfig = getIconConfig();

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.customModalBox}>
          <View style={[styles.modalIconContainer, { backgroundColor: iconConfig.bgColor }]}>
            <Ionicons name={iconConfig.name} size={48} color={iconConfig.color} />
          </View>

          <Text style={styles.customModalTitle}>{title}</Text>

          <Text style={styles.customModalMessage}>{message}</Text>

          <View style={styles.customModalActions}>
            {actions.length > 0 ? (
              <>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={action.onPress}
                    style={[
                      styles.customModalButton,
                      action.type === 'primary' && { backgroundColor: MODAL_COLORS.primary },
                      action.type === 'secondary' && {
                        backgroundColor: MODAL_COLORS.white,
                        borderWidth: 1,
                        borderColor: MODAL_COLORS.secondary,
                      },
                      action.type === 'danger' && {
                        backgroundColor: MODAL_COLORS.error,
                        borderWidth: 1,
                        borderColor: MODAL_COLORS.error,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.customModalButtonText,
                        action.type === 'primary' && { color: MODAL_COLORS.white },
                        action.type === 'secondary' && { color: MODAL_COLORS.darkGray },
                        action.type === 'danger' && { color: MODAL_COLORS.white },
                      ]}
                    >
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <TouchableOpacity
                onPress={onClose}
                style={[styles.customModalButton, { backgroundColor: MODAL_COLORS.primary }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.customModalButtonText, { color: MODAL_COLORS.white }]}>
                  Aceptar
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {showCloseButton && (
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={MODAL_COLORS.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

const CustomAlert = React.memo(
  ({
    visible,
    onClose,
    title,
    message,
    type = 'info',
    iconName,
    iconColor,
    actions = [],
    showCloseButton = true,
    onBackdropPress,
  }) => {
    const getIconConfig = () => {
      switch (type) {
        case 'success':
          return {
            name: iconName || 'checkmark-circle',
            color: MODAL_COLORS.success,
            bgColor: '#E8F5E9',
          };
        case 'error':
          return {
            name: iconName || 'close-circle',
            color: MODAL_COLORS.error,
            bgColor: '#FFEBEE',
          };
        case 'warning':
          return {
            name: iconName || 'warning',
            color: MODAL_COLORS.warning,
            bgColor: '#FFF3E0',
          };
        case 'info':
          return {
            name: iconName || 'information-circle',
            color: MODAL_COLORS.info,
            bgColor: '#E3F2FD',
          };
        default:
          return {
            name: iconName || 'information-circle',
            color: iconColor || MODAL_COLORS.primary,
            bgColor: '#E3F2FD',
          };
      }
    };

    const iconConfig = getIconConfig();

    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.alertOverlay}
          activeOpacity={1}
          onPress={onBackdropPress || onClose}
        >
          <TouchableOpacity
            style={styles.alertBox}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.alertIconContainer, { backgroundColor: iconConfig.bgColor }]}>
              <Ionicons name={iconConfig.name} size={40} color={iconConfig.color} />
            </View>

            <Text style={styles.alertTitle}>{title}</Text>

            <Text style={styles.alertMessage}>{message}</Text>

            <View style={styles.alertActions}>
              {actions.length > 0 ? (
                <>
                  {actions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={action.onPress}
                      style={[
                        styles.alertButton,
                        action.type === 'primary' && { backgroundColor: MODAL_COLORS.primary },
                        action.type === 'secondary' && {
                          backgroundColor: MODAL_COLORS.white,
                          borderWidth: 1,
                          borderColor: MODAL_COLORS.secondary,
                        },
                        action.type === 'danger' && {
                          backgroundColor: MODAL_COLORS.error,
                          borderWidth: 1,
                          borderColor: MODAL_COLORS.error,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.alertButtonText,
                          action.type === 'primary' && { color: MODAL_COLORS.white },
                          action.type === 'secondary' && { color: MODAL_COLORS.darkGray },
                          action.type === 'danger' && { color: MODAL_COLORS.white },
                        ]}
                      >
                        {action.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.alertButton, { backgroundColor: MODAL_COLORS.primary }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.alertButtonText, { color: MODAL_COLORS.white }]}>
                    Aceptar
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {showCloseButton && (
              <TouchableOpacity
                style={styles.alertCloseButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={MODAL_COLORS.secondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }
);

const sectorComponents = {
  food: FoodShoppingCart,
  fashion: FashionShoppingCart,
  technology: TechnologyShoppingCart,
  hardware: HardwareShoppingCart,
  pharmacy: PharmacyShoppingCart,
};

const ShoppingCart = ({ route, navigation }) => {
  const { businessId, sector, cartItems: initialCartItems, business: initialBusiness } = route.params;
  const { cart, addToCart, clearCartForBusiness } = useCart();

  const SectorComponent = sectorComponents[sector];
  
  if (!SectorComponent) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: COLOR.gray }}>Sector no soportado</Text>
      </View>
    );
  }

  // Usar el negocio de los parámetros si está disponible, si no del contexto
  const business = useMemo(
    () => initialBusiness || cart[businessId]?.business || {},
    [initialBusiness, cart, businessId]
  );

  const cartItems = useMemo(() => cart[businessId]?.items || {}, [cart, businessId]);

  // Estados principales
  const [profile, setProfile] = useState(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [deliveryReference, setDeliveryReference] = useState('');
  const [deliveryCommission, setDeliveryCommission] = useState(null);

  // Estados de UI
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [markerCoords, setMarkerCoords] = useState(null);
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
  const [copiedText, setCopiedText] = useState('');

  // Estados de modales
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [customModal, setCustomModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    actions: [],
  });

  // Estados para CustomAlert
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'warning',
    actions: [],
  });

  // Refs para controlar efectos
  const hasSyncedRef = useRef(false);
  const hasSetDeliveryMethodRef = useRef(false);

  // Payment methods memoized
  const paymentMethods = useMemo(
    () => ({
      acceptCash: business.acceptCash || false,
      acceptTransfer: business.acceptTransfer || false,
      bankCard: business.bankCard || '',
      bankClabe: business.bankClabe || '',
    }),
    [business]
  );

  // Delivery methods memoized
  const deliveryMethods = useMemo(() => {
    if (business.deliveryZones && business.deliveryZones.length > 0) {
      const deliveryZone = business.deliveryZones[0];
      return {
        atHome: deliveryZone.homeDeliveryEnabled || false,
        pickUp: deliveryZone.pickupEnabled || false,
      };
    }
    return { atHome: false, pickUp: false };
  }, [business.deliveryZones]);

  // Cart state memoized
  const cartState = useMemo(() => {
    return business.products && Array.isArray(business.products)
      ? business.products
          .filter((product) => cartItems[product.productId] && cartItems[product.productId] > 0)
          .map((product) => ({
            ...product,
            quantity: cartItems[product.productId],
          }))
      : [];
  }, [business.products, cartItems]);

  // Calcular cantidades
  const totalCantidad = useMemo(
    () => cartState.reduce((sum, item) => sum + item.quantity, 0),
    [cartState]
  );

  const subtotal = useMemo(
    () => cartState.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartState]
  );

  // Calcular comisión y totales
  const { commission, orderTotals } = useMemo(() => {
    let commissionData = null;

    if (deliveryMethod === 'A domicilio' && deliveryLocation && business?.zoneCommissions) {
      commissionData = DeliveryCommissionService.calculateDeliveryCommission(deliveryLocation, business, deliveryMethod, sector);
    }

    const totals = DeliveryCommissionService.calculateOrderTotals(cartState, commissionData);

    return {
      commission: commissionData,
      orderTotals: totals,
    };
  }, [deliveryMethod, deliveryLocation, business, sector, cartState]);

  // Sincronizar items iniciales con el contexto - Solo una vez
  useEffect(() => {
    if (hasSyncedRef.current) return;

    if (initialCartItems && Object.keys(initialCartItems).length > 0 && business) {
      Object.entries(initialCartItems).forEach(([productId, quantity]) => {
        addToCart(businessId, productId, quantity, business);
      });
      hasSyncedRef.current = true;
    }
  }, [initialCartItems, business, businessId, addToCart]);

  // Cargar perfil del usuario - Solo una vez
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('userInfo');
        if (stored) {
          const user = JSON.parse(stored);
          setProfile(user);
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      }
    };
    loadProfile();
  }, []);

  // Establecer método de entrega automáticamente - Solo una vez
  useEffect(() => {
    if (hasSetDeliveryMethodRef.current || !business || !deliveryMethods) return;

    if (deliveryMethods.atHome || deliveryMethods.pickUp) {
      const availableMethods = [];
      if (deliveryMethods.atHome) availableMethods.push('A domicilio');
      if (deliveryMethods.pickUp) availableMethods.push('Para recoger');

      if (availableMethods.length === 1) {
        setDeliveryMethod(availableMethods[0]);
        hasSetDeliveryMethodRef.current = true;
      } else if (availableMethods.length === 2 && !deliveryMethod) {
        setDeliveryMethod('A domicilio');
        hasSetDeliveryMethodRef.current = true;
      }
    }
  }, [business, deliveryMethods, deliveryMethod]);

  // Funciones de navegación y UI
  const openMapModal = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      let baseCoords = deliveryLocation;
      if (!baseCoords) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          showCustomModal(
            'Permiso de ubicación requerido',
            'Necesitamos acceso a tu ubicación para mostrar opciones de entrega.',
            'warning'
          );
          setIsLoadingLocation(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
          maximumAge: 30000,
        });
        baseCoords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
      }
      setLocation(baseCoords);
      setMarkerCoords(baseCoords);
      setShowMapModal(true);
    } catch (error) {
      console.warn('Error al obtener ubicación:', error);
      showCustomModal(
        'Error de ubicación',
        'No se pudo obtener tu ubicación actual.',
        'error'
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, [deliveryLocation]);

  const openRemoveModal = useCallback((productId) => {
    setSelectedProductId(productId);
    setShowRemoveModal(true);
  }, []);

  const confirmRemove = useCallback(() => {
    addToCart(businessId, selectedProductId, 0, business);
    setShowRemoveModal(false);
    showCustomModal(
      'Producto eliminado',
      'El producto ha sido eliminado de tu carrito.',
      'success'
    );
  }, [businessId, selectedProductId, business, addToCart]);

  const copyToClipboardWithFeedback = useCallback((text, type) => {
    Clipboard.setString(text);
    let feedbackText = '';
    if (type === 'clabe') feedbackText = 'CLABE copiada';
    else if (type === 'card') feedbackText = 'Tarjeta copiada';
    setCopiedText(feedbackText);
    setShowCopiedFeedback(true);
    setTimeout(() => setShowCopiedFeedback(false), 1500);
  }, []);

  const showCustomModal = useCallback(
    (title, message, type = 'info', actions = []) => {
      setCustomModal({
        visible: true,
        title,
        message,
        type,
        actions,
      });
    },
    []
  );

  const showCustomAlert = useCallback((title, message, type = 'warning', actions = []) => {
    setAlertConfig({
      title,
      message,
      type,
      actions,
    });
    setShowLocationAlert(true);
  }, []);

  // Validar orden antes de confirmar
  const validateOrder = useCallback(() => {
    if (!paymentMethod) {
      showCustomModal(
        'Método de pago requerido',
        'Por favor selecciona un método de pago.',
        'warning'
      );
      return false;
    }

    if (deliveryMethod === 'A domicilio' && !deliveryLocation) {
      showCustomModal(
        'Ubicación requerida',
        'Para entrega a domicilio, selecciona una ubicación.',
        'warning'
      );
      return false;
    }

    if (deliveryMethod === 'A domicilio' && deliveryLocation && commission && !commission.isValid) {
      showCustomModal('Fuera de cobertura', 'Tu ubicación está fuera del área de cobertura.', 'error');
      return false;
    }

    if (paymentMethod === 'cash' && (!paymentAmount || parseFloat(paymentAmount) < orderTotals.total)) {
      const missingAmount = orderTotals.total - parseFloat(paymentAmount || 0);
      showCustomModal(
        'Monto insuficiente',
        `Faltan: $${missingAmount.toFixed(2)}\nTotal: $${orderTotals.total.toFixed(2)}`,
        'warning'
      );
      return false;
    }

    return true;
  }, [
    paymentMethod,
    deliveryMethod,
    deliveryLocation,
    commission,
    paymentAmount,
    orderTotals.total,
    showCustomModal,
  ]);

  // Enviar a WhatsApp
  const sendOrderToWhatsApp = useCallback(async () => {
    try {
      let locationUrl = '';
      if (deliveryMethod === 'A domicilio' && deliveryLocation) {
        locationUrl = `https://www.google.com/maps?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`;
      } else {
        locationUrl = business.address || 'Ubicación no especificada';
      }

      const businessPhone = business.phone || '000000000';
      const deliveryTime = '25 a 35 minutos';

      const orderData = {
        businessName: business.fullName,
        customerName: profile?.fullName || 'Cliente',
        cartState,
        location: locationUrl,
        customerNotes,
        deliveryMethod,
        paymentAmount: paymentMethod === 'cash' ? paymentAmount : '',
        paymentMethod,
        deliveryReference,
        deliveryTime,
        subtotal: orderTotals.subtotal.toFixed(2),
        deliveryCommission: commission?.commission || 0,
        deliveryCommissionMessage: commission?.message || '',
        total: orderTotals.total.toFixed(2),
      };

      const message = generateOrderMessage(sector, orderData);
      const url = `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`;

      await Linking.openURL(url);
    } catch (err) {
      console.error('Error al abrir WhatsApp:', err);
      showCustomModal('Error al abrir WhatsApp', 'No se pudo abrir WhatsApp.', 'error');
    }
  }, [
    deliveryMethod,
    deliveryLocation,
    business,
    profile,
    cartState,
    customerNotes,
    paymentMethod,
    paymentAmount,
    deliveryReference,
    orderTotals,
    commission,
    sector,
    showCustomModal,
  ]);

  // Confirmar orden
  const confirmOrder = useCallback(async () => {
    if (!validateOrder()) {
      setShowConfirmModal(false);
      return;
    }

    try {
      const orderPayload = {
        orderId: Date.now().toString(),
        businessId: business.businessId,
        customerId: profile?.userId,
        address: deliveryMethod === 'A domicilio' && deliveryLocation ? `https://maps.google.com?q=${deliveryLocation.latitude},${deliveryLocation.longitude}` : business.address || '',
        notes: customerNotes,
        deliveryMethod,
        paymentMethod,
        sector,
        jsonOrder: buildJsonOrder(cartState),
        subtotal: orderTotals.subtotal.toFixed(2),
        deliveryCommission: commission?.commission || 0,
        totalPrice: orderTotals.total.toFixed(2),
        commissionData: commission,
        deliveryReference,
        createdAt: new Date().toISOString(),
      };

      await createOrder(orderPayload);
      clearCartForBusiness(business.businessId);
      setShowConfirmModal(false);

      // Enviar directamente a WhatsApp
      await sendOrderToWhatsApp();
      navigation.popToTop();
    } catch (error) {
      console.error('❌ Error al enviar el pedido:', error);
      showCustomModal('Error al procesar pedido', 'Hubo un problema al enviar tu pedido.', 'error');
    }
  }, [
    validateOrder,
    business,
    profile,
    deliveryMethod,
    deliveryLocation,
    customerNotes,
    cartState,
    orderTotals,
    commission,
    deliveryReference,
    clearCartForBusiness,
    sendOrderToWhatsApp,
    navigation,
    showCustomModal,
  ]);

  const handlePaymentAmountChange = useCallback((text) => {
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(text)) setPaymentAmount(text);
  }, []);

  const renderItem = useCallback(
    ({ item }) => {
      return (
        <SectorComponent
          item={item}
          actions={
            <TouchableHighlight
              underlayColor="#ccc"
              onPress={() => openRemoveModal(item.productId)}
              style={styles.removeButton}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.removeButtonText}>Eliminar</Text>
              </View>
            </TouchableHighlight>
          }
        />
      );
    },
    [SectorComponent, openRemoveModal]
  );

  // Preparar las opciones de entrega disponibles
  const deliveryOptions = useMemo(
    () =>
      [
        {
          label: 'A domicilio',
          value: deliveryMethods.atHome,
          icon: 'home-outline',
          description: 'Recibe tu pedido en tu ubicación',
        },
        {
          label: 'Para recoger',
          value: deliveryMethods.pickUp,
          icon: 'walk-outline',
          description: 'Recoge tu pedido en el negocio',
        },
      ].filter((method) => method.value),
    [deliveryMethods]
  );

  const isSingleOption = deliveryOptions.length === 1;

  // Validar si el botón de confirmar debe estar habilitado
  const isConfirmButtonDisabled = useMemo(() => {
    if (!paymentMethod) return true;
    if (deliveryMethod === 'A domicilio' && !deliveryLocation) return true;
    if (paymentMethod === 'cash' && (!paymentAmount || parseFloat(paymentAmount) < orderTotals.total))
      return true;
    if (deliveryMethod === 'A domicilio' && deliveryLocation && commission && !commission.isValid)
      return true;
    return false;
  }, [paymentMethod, deliveryMethod, deliveryLocation, paymentAmount, orderTotals.total, commission]);

  const handleMapModalConfirm = useCallback(() => {
    if (markerCoords) {
      const coverage = DeliveryCommissionService.validateDeliveryCoverage(markerCoords, business);

      if (!coverage.isValid) {
        const distance = coverage.distance?.toFixed(1) || '?';
        showCustomAlert(
          'Ubicación fuera de cobertura',
          `La ubicación está a ${distance} km del área de cobertura.`,
          'warning',
          [
            {
              text: 'Entendido',
              onPress: () => {
                setShowLocationAlert(false);
                // Mantener el MapModal abierto para que el usuario ajuste la ubicación
              },
              type: 'primary'
            }
          ]
        );
        return;
      }

      setDeliveryLocation(markerCoords);
      setShowMapModal(false);
    }
  }, [markerCoords, business, showCustomAlert]);

  // Preparar texto de cambio en efectivo
  const changeText = useMemo(() => {
    if (!paymentAmount || parseFloat(paymentAmount) === 0) return null;

    const amount = parseFloat(paymentAmount);
    if (amount < orderTotals.total) {
      return `Faltan: $${(orderTotals.total - amount).toFixed(2)}`;
    } else {
      return `Cambio: $${(amount - orderTotals.total).toFixed(2)}`;
    }
  }, [paymentAmount, orderTotals.total]);

  // Limpiar feedback de copiado
  useEffect(() => {
    if (showCopiedFeedback) {
      const timer = setTimeout(() => setShowCopiedFeedback(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showCopiedFeedback]);

  // Efecto para actualizar la comisión cuando cambia deliveryCommission
  useEffect(() => {
    setDeliveryCommission(commission);
  }, [commission]);

  // Cierra el alert y mantiene el MapModal abierto
  const handleAlertClose = useCallback(() => {
    setShowLocationAlert(false);
    // No cerramos el MapModal aquí, para que el usuario pueda ajustar la ubicación
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {cartState.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            <Ionicons name="cart-outline" size={64} color={COLOR.gray} />
            <Text style={styles.emptyCartText}>Tu carrito está vacío</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>Volver al catálogo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <FlatList
              data={cartState}
              keyExtractor={(item) => item.productId.toString()}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 30 }}
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={
                <>
                  <Text style={styles.totalCantidadText}>
                    Total de productos: {totalCantidad}
                  </Text>

                  {/* Sección de Método de Entrega */}
                  {deliveryOptions.length > 0 ? (
                    <View style={styles.card}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="rocket-outline" size={20} color={COLOR.blue} />
                        <Text style={styles.sectionMethodTitle}>Método de entrega</Text>
                      </View>

                      {isSingleOption && (
                        <View style={styles.singleOptionInfo}>
                          <Ionicons
                            name="information-circle-outline"
                            size={16}
                            color={COLOR.blue}
                          />
                          <Text style={styles.singleOptionText}>
                            Este negocio solo ofrece {deliveryOptions[0].label.toLowerCase()}
                          </Text>
                        </View>
                      )}

                      <View style={styles.deliveryMethodContainer}>
                        {deliveryOptions.map((method) => (
                          <TouchableOpacity
                            key={method.label}
                            onPress={() => setDeliveryMethod(method.label)}
                            style={[
                              styles.deliveryOption,
                              (deliveryMethod === method.label || isSingleOption) && styles.selectedDeliveryOption,
                            ]}
                            activeOpacity={0.7}
                          >
                            <View style={styles.deliveryOptionContent}>
                              <View
                                style={[
                                  styles.deliveryIconContainer,
                                  (deliveryMethod === method.label || isSingleOption) && styles.selectedIconContainer,
                                ]}
                              >
                                <Ionicons
                                  name={method.icon}
                                  size={20}
                                  color={
                                    deliveryMethod === method.label || isSingleOption ? COLOR.blue : COLOR.gray
                                  }
                                />
                              </View>

                              <View style={styles.deliveryTextContainer}>
                                <Text
                                  style={[
                                    styles.deliveryOptionLabel,
                                    (deliveryMethod === method.label || isSingleOption) && styles.selectedDeliveryText,
                                  ]}
                                >
                                  {method.label}
                                </Text>
                                <Text
                                  style={[
                                    styles.deliveryOptionDesc,
                                    (deliveryMethod === method.label || isSingleOption) && styles.selectedDeliveryDesc,
                                  ]}
                                >
                                  {method.description}
                                </Text>
                              </View>

                              {(deliveryMethod === method.label || isSingleOption) && (
                                <View style={styles.selectedIndicator}>
                                  <Ionicons name="checkmark-circle" size={20} color={COLOR.green} />
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.card}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="rocket-outline" size={20} color={COLOR.gray} />
                        <Text style={styles.sectionMethodTitle}>Método de entrega</Text>
                      </View>
                      <View style={styles.noDeliveryOptions}>
                        <Ionicons name="alert-circle-outline" size={20} color={COLOR.gray} />
                        <Text style={styles.noDeliveryOptionsText}>
                          Este negocio no tiene métodos de entrega configurados
                        </Text>
                      </View>
                    </View>
                  )}

                  {deliveryMethod === 'A domicilio' && deliveryMethods.atHome && (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.locationButton,
                          {
                            borderColor: deliveryLocation ? COLOR.orange : COLOR.gray,
                            backgroundColor: deliveryLocation ? '#FFF9F0' : '#F9F9F9',
                          },
                        ]}
                        onPress={openMapModal}
                        activeOpacity={0.8}
                      >
                        <View style={styles.locationButtonContent}>
                          <Ionicons
                            name={deliveryLocation ? 'location' : 'location-outline'}
                            size={22}
                            color={deliveryLocation ? COLOR.orange : COLOR.gray}
                          />
                          <View style={styles.locationButtonTextContainer}>
                            <Text style={styles.locationButtonTitle}>
                              {deliveryLocation
                                ? '📍 Ubicación seleccionada'
                                : '📍 Seleccionar ubicación'}
                            </Text>
                            <Text style={styles.locationButtonSubtitle}>
                              {deliveryLocation
                                ? 'Toca para cambiar la ubicación'
                                : 'Selecciona dónde quieres recibir tu pedido'}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={COLOR.gray} />
                        </View>
                      </TouchableOpacity>

                      {isLoadingLocation && (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color={COLOR.blue} />
                          <Text style={styles.loadingText}>Obteniendo tu ubicación...</Text>
                        </View>
                      )}

                      {/* Mostrar información de comisión */}
                      {deliveryLocation && deliveryCommission && (
                        <View
                          style={[
                            styles.card,
                            deliveryCommission.isValid ? styles.validCommissionCard : styles.invalidCommissionCard,
                          ]}
                        >
                          <View style={styles.sectionHeader}>
                            <Ionicons
                              name={
                                deliveryCommission.isFree ? 'gift-outline' : 'cash-outline'
                              }
                              size={20}
                              color={deliveryCommission.isFree ? COLOR.green : COLOR.orange}
                            />
                            <Text style={styles.commissionTitle}>
                              {deliveryCommission.isFree ? 'Envío Gratis' : 'Comisión de Entrega'}
                            </Text>
                          </View>

                          {deliveryCommission.isFree ? (
                            <View style={styles.freeDeliveryContainer}>
                              <Ionicons name="checkmark-circle" size={20} color={COLOR.green} />
                              <Text style={styles.freeDeliveryText}>
                                ¡Envío gratuito en esta zona!
                              </Text>
                            </View>
                          ) : deliveryCommission.isValid ? (
                            <>
                              <View style={styles.commissionDetail}>
                                <View>
                                  <Text style={styles.commissionLabel}>Costo de envío</Text>
                                  <Text style={styles.commissionDistance}>
                                    Distancia: {deliveryCommission.distance?.toFixed(1) || '0'} km
                                  </Text>
                                </View>
                                <Text style={styles.commissionValue}>
                                  ${deliveryCommission.commission.toFixed(2)}
                                </Text>
                              </View>
                              <Text style={styles.commissionMessage}>
                                {deliveryCommission.message}
                              </Text>
                            </>
                          ) : (
                            <View style={styles.invalidCommissionContainer}>
                              <Ionicons name="alert-circle-outline" size={20} color={COLOR.red} />
                              <Text style={styles.invalidCommissionText}>
                                {deliveryCommission.message || 'Ubicación fuera de cobertura'}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="navigate-outline" size={20} color={COLOR.blue} />
                          <Text style={styles.sectionTitle}>Referencia de entrega</Text>
                        </View>
                        <TextInput
                          style={[styles.notesInput, { color: '#000' }]}
                          placeholder="Ejemplo: Portón amarillo, casa azul..."
                          placeholderTextColor="#9E9E9E"
                          value={deliveryReference}
                          onChangeText={setDeliveryReference}
                          maxLength={30}
                        />
                        <View style={styles.charCounterContainer}>
                          <Text style={styles.charCounter}>
                            {deliveryReference.length}/30 caracteres
                          </Text>
                        </View>
                      </View>
                    </>
                  )}

                  <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="pencil-outline" size={20} color={COLOR.blue} />
                      <Text style={styles.sectionTitle}>Notas adicionales</Text>
                    </View>
                    <TextInput
                      style={[styles.notesInput, { color: '#000', minHeight: 80 }]}
                      placeholder="Ejemplo: sin cebolla, salsa extra..."
                      placeholderTextColor="#9E9E9E"
                      multiline
                      numberOfLines={4}
                      value={customerNotes}
                      onChangeText={setCustomerNotes}
                    />
                  </View>

                  <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="card-outline" size={20} color={COLOR.blue} />
                      <Text style={styles.sectionMethodTitle}>Método de pago</Text>
                    </View>
                    <View style={styles.paymentMethodContainer}>
                      {paymentMethods.acceptCash && (
                        <TouchableOpacity
                          onPress={() => setPaymentMethod('cash')}
                          style={[
                            styles.paymentOption,
                            paymentMethod === 'cash' && styles.selectedPaymentOption,
                          ]}
                          activeOpacity={0.8}
                        >
                          <View style={styles.paymentOptionContent}>
                            <View
                              style={[
                                styles.paymentIconContainer,
                                paymentMethod === 'cash' && styles.selectedPaymentIconContainer,
                              ]}
                            >
                              <Ionicons
                                name="cash-outline"
                                size={20}
                                color={paymentMethod === 'cash' ? '#FFFFFF' : COLOR.darkGray}
                              />
                            </View>
                            <Text
                              style={[
                                styles.paymentOptionText,
                                paymentMethod === 'cash' && styles.selectedPaymentOptionText,
                              ]}
                            >
                              Efectivo
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      {paymentMethods.acceptTransfer && (
                        <TouchableOpacity
                          onPress={() => setPaymentMethod('transfer')}
                          style={[
                            styles.paymentOption,
                            paymentMethod === 'transfer' && styles.selectedPaymentOption,
                          ]}
                          activeOpacity={0.8}
                        >
                          <View style={styles.paymentOptionContent}>
                            <View
                              style={[
                                styles.paymentIconContainer,
                                paymentMethod === 'transfer' && styles.selectedPaymentIconContainer,
                              ]}
                            >
                              <Ionicons
                                name="card-outline"
                                size={20}
                                color={paymentMethod === 'transfer' ? '#FFFFFF' : COLOR.darkGray}
                              />
                            </View>
                            <Text
                              style={[
                                styles.paymentOptionText,
                                paymentMethod === 'transfer' && styles.selectedPaymentOptionText,
                              ]}
                            >
                              Transferencia
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    {paymentMethod === 'cash' && (
                      <View style={styles.cashInputContainer}>
                        <Text style={styles.paymentSubLabel}>Pagaré con:</Text>
                        <View style={styles.inputWithIcon}>
                          <Text style={styles.dollarIcon}>$</Text>
                          <TextInput
                            style={[styles.paymentInput, { color: '#000' }]}
                            placeholder="0.00"
                            placeholderTextColor="#9E9E9E"
                            keyboardType="decimal-pad"
                            value={paymentAmount}
                            onChangeText={handlePaymentAmountChange}
                          />
                        </View>
                        <View style={styles.amountInfoContainer}>
                          <Text style={styles.amountInfo}>
                            Total a pagar: ${orderTotals.total.toFixed(2)}
                          </Text>
                          {changeText && (
                            <Text
                              style={[
                                styles.changeInfo,
                                paymentAmount && parseFloat(paymentAmount) < orderTotals.total
                                  ? styles.changeWarning
                                  : styles.changeOk,
                              ]}
                            >
                              {changeText}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}

                    {paymentMethod === 'transfer' && (
                      <View style={styles.transferDetails}>
                        {paymentMethods.bankCard && (
                          <View style={styles.bankDetail}>
                            <View style={styles.bankDetailHeader}>
                              <Ionicons name="card" size={16} color={COLOR.darkGray} />
                              <Text style={styles.bankDetailLabel}>Tarjeta bancaria:</Text>
                            </View>
                            <View style={styles.copyableField}>
                              <Text style={styles.bankDetailInput}>
                                {paymentMethods.bankCard}
                              </Text>
                              <TouchableOpacity
                                onPress={() =>
                                  copyToClipboardWithFeedback(paymentMethods.bankCard, 'card')
                                }
                                style={styles.copyButton}
                              >
                                <Ionicons name="copy-outline" size={20} color={COLOR.blue} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        {paymentMethods.bankClabe && (
                          <View style={styles.bankDetail}>
                            <View style={styles.bankDetailHeader}>
                              <Ionicons name="keypad" size={16} color={COLOR.darkGray} />
                              <Text style={styles.bankDetailLabel}>CLABE interbancaria:</Text>
                            </View>
                            <View style={styles.copyableField}>
                              <Text style={styles.bankDetailInput}>
                                {paymentMethods.bankClabe}
                              </Text>
                              <TouchableOpacity
                                onPress={() =>
                                  copyToClipboardWithFeedback(paymentMethods.bankClabe, 'clabe')
                                }
                                style={styles.copyButton}
                              >
                                <Ionicons name="copy-outline" size={20} color={COLOR.blue} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Sección de totales */}
                  <View style={styles.totalsCard}>
                    <View style={styles.totalRow}>
                      <View style={styles.totalLabelContainer}>
                        <Ionicons name="receipt-outline" size={16} color={COLOR.darkGray} />
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                      </View>
                      <Text style={styles.totalValue}>${orderTotals.subtotal.toFixed(2)}</Text>
                    </View>

                    {deliveryMethod === 'A domicilio' &&
                      deliveryCommission &&
                      deliveryCommission.isValid && (
                        <View style={styles.totalRow}>
                          <View style={styles.totalLabelContainer}>
                            <Ionicons
                              name={deliveryCommission.isFree ? 'gift' : 'rocket'}
                              size={16}
                              color={deliveryCommission.isFree ? COLOR.green : COLOR.orange}
                            />
                            <Text style={styles.totalLabel}>Comisión de envío:</Text>
                          </View>
                          <Text
                            style={[
                              styles.totalValue,
                              deliveryCommission.isFree ? styles.freeText : styles.commissionText,
                            ]}
                          >
                            {deliveryCommission.isFree ? 'Gratis' : `$${deliveryCommission.commission.toFixed(2)}`}
                          </Text>
                        </View>
                      )}

                    <View style={[styles.totalRow, styles.finalTotal]}>
                      <View style={styles.totalLabelContainer}>
                        <Ionicons name="wallet-outline" size={18} color={COLOR.green} />
                        <Text style={styles.finalTotalLabel}>Total a pagar:</Text>
                      </View>
                      <Text style={styles.finalTotalValue}>${orderTotals.total.toFixed(2)}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      isConfirmButtonDisabled && styles.confirmButtonDisabled,
                    ]}
                    onPress={() => {
                      if (isConfirmButtonDisabled) {
                        if (!paymentMethod) {
                          showCustomModal(
                            'Método de pago requerido',
                            'Por favor selecciona un método de pago.',
                            'warning'
                          );
                        } else if (deliveryMethod === 'A domicilio' && !deliveryLocation) {
                          showCustomModal(
                            'Ubicación requerida',
                            'Para entrega a domicilio, selecciona una ubicación.',
                            'warning'
                          );
                        } else if (paymentMethod === 'cash' && (!paymentAmount || parseFloat(paymentAmount) < orderTotals.total)) {
                          const missingAmount = orderTotals.total - parseFloat(paymentAmount || 0);
                          showCustomModal(
                            'Monto insuficiente',
                            `Faltan: $${missingAmount.toFixed(2)}`,
                            'warning'
                          );
                        } else if (deliveryMethod === 'A domicilio' && deliveryLocation && deliveryCommission && !deliveryCommission.isValid) {
                          showCustomModal(
                            'Fuera de cobertura',
                            'Tu ubicación está fuera del área de cobertura.',
                            'error'
                          );
                        }
                      } else {
                        setShowConfirmModal(true);
                      }
                    }}
                    disabled={isConfirmButtonDisabled}
                    activeOpacity={0.9}
                  >
                    <View style={styles.confirmButtonContent}>
                      <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
                      <View style={styles.confirmButtonTextContainer}>
                        <Text style={styles.confirmButtonText}>Confirmar pedido</Text>
                        <Text style={styles.confirmButtonSubtext}>
                          Enviar pedido por WhatsApp
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </>
              }
            />
          </TouchableWithoutFeedback>
        )}

        {showCopiedFeedback && (
          <View style={styles.feedbackContainer}>
            <View style={styles.feedbackBubble}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.feedbackText}>{copiedText}</Text>
            </View>
          </View>
        )}

        <MapModal
          visible={showMapModal}
          onClose={() => setShowMapModal(false)}
          location={location}
          markerCoords={markerCoords}
          setMarkerCoords={setMarkerCoords}
          onConfirm={handleMapModalConfirm}
        />

        {/* Modal de confirmación de pedido */}
        <CustomModal
          visible={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirmar pedido"
          message={`¿Estás seguro de confirmar tu pedido?
            • Método de entrega: ${deliveryMethod || 'No seleccionado'}
            • Método de pago: ${paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
            • Total: $${orderTotals.total.toFixed(2)}
            El pedido se enviará por WhatsApp al negocio.`}
          type="info"
          actions={[
            {
              text: 'Cancelar',
              onPress: () => setShowConfirmModal(false),
              type: 'secondary',
            },
            {
              text: 'Confirmar',
              onPress: confirmOrder,
              type: 'primary',
            },
          ]}
          showCloseButton={false}
        />

        {/* Modal de eliminar producto */}
        <CustomModal
          visible={showRemoveModal}
          onClose={() => setShowRemoveModal(false)}
          title="Eliminar producto"
          message="¿Estás seguro de eliminar este producto de tu carrito?"
          type="warning"
          iconName="trash-outline"
          iconColor={MODAL_COLORS.error}
          actions={[
            {
              text: 'Cancelar',
              onPress: () => setShowRemoveModal(false),
              type: 'secondary',
            },
            {
              text: 'Eliminar',
              onPress: confirmRemove,
              type: 'danger',
            },
          ]}
          showCloseButton={false}
        />

        {/* Alert personalizado para ubicación fuera de cobertura */}
        <CustomAlert
          visible={showLocationAlert}
          onClose={handleAlertClose}
          onBackdropPress={handleAlertClose}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          iconName="location-outline"
          iconColor={MODAL_COLORS.warning}
          actions={alertConfig.actions.length > 0 ? alertConfig.actions : [
            {
              text: 'Entendido',
              onPress: handleAlertClose,
              type: 'primary',
            },
          ]}
          showCloseButton={false}
        />

        {/* Modal personalizado para mensajes generales */}
        <CustomModal
          visible={customModal.visible}
          onClose={() => setCustomModal({ ...customModal, visible: false })}
          title={customModal.title}
          message={customModal.message}
          type={customModal.type}
          actions={customModal.actions}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLOR.lightGray,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCartText: {
    fontSize: 20,
    color: COLOR.darkGray,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: COLOR.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: '#E63946',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  totalCantidadText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    textAlign: 'right',
    marginVertical: 20,
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    paddingTop: 15,
    color: COLOR.darkGray,
  },
  totalsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: COLOR.darkGray,
    marginLeft: 8,
  },
  totalValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: COLOR.darkGray,
  },
  freeText: {
    color: COLOR.green,
  },
  commissionText: {
    color: COLOR.orange,
  },
  finalTotal: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  finalTotalLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 17,
    color: COLOR.darkGray,
    marginLeft: 8,
  },
  finalTotalValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: COLOR.green,
  },
  confirmButton: {
    backgroundColor: '#00CC86',
    padding: 18,
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmButtonTextContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  confirmButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 2,
  },
  confirmButtonSubtext: {
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  customModalBox: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  customModalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
    color: MODAL_COLORS.darkGray,
    lineHeight: 24,
  },
  customModalMessage: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    textAlign: 'center',
    color: MODAL_COLORS.secondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  customModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    gap: 10,
  },
  customModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customModalButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    alignItems: 'center',
  },
  alertIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    color: MODAL_COLORS.darkGray,
    lineHeight: 24,
  },
  alertMessage: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    textAlign: 'center',
    color: MODAL_COLORS.secondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
    gap: 12,
  },
  alertButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  alertButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  alertCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  locationButton: {
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    marginTop: 10,
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButtonTextContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  locationButtonTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 2,
  },
  locationButtonSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: COLOR.blue,
    fontFamily: 'Poppins-Regular',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLOR.darkGray,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  sectionMethodTitle: {
    fontSize: 17,
    color: COLOR.darkGray,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  notesInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  charCounterContainer: {
    alignItems: 'flex-end',
  },
  charCounter: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Poppins-Regular',
  },
  singleOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F2FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLOR.blue,
  },
  singleOptionText: {
    fontSize: 13,
    color: COLOR.blue,
    fontFamily: 'Poppins-Regular',
    marginLeft: 8,
    flex: 1,
  },
  deliveryMethodContainer: {
    marginBottom: 8,
  },
  deliveryOption: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9F9F9',
    marginBottom: 12,
  },
  selectedDeliveryOption: {
    borderColor: COLOR.blue,
    backgroundColor: '#E6F2FF',
  },
  deliveryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIconContainer: {
    backgroundColor: '#B3D9FF',
  },
  deliveryTextContainer: {
    flex: 1,
  },
  deliveryOptionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: COLOR.darkGray,
    marginBottom: 4,
  },
  deliveryOptionDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: COLOR.gray,
  },
  selectedDeliveryText: {
    color: COLOR.blue,
  },
  selectedDeliveryDesc: {
    color: COLOR.blue,
    opacity: 0.8,
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  validCommissionCard: {
    borderWidth: 1,
    borderColor: COLOR.lightBlue,
  },
  invalidCommissionCard: {
    borderWidth: 1,
    borderColor: COLOR.red,
    backgroundColor: '#FFF5F5',
  },
  commissionTitle: {
    fontSize: 16,
    color: COLOR.darkGray,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  freeDeliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  freeDeliveryText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: COLOR.green,
    marginLeft: 10,
  },
  commissionDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
  },
  commissionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: COLOR.darkGray,
    marginBottom: 4,
  },
  commissionDistance: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: COLOR.gray,
  },
  commissionValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: COLOR.orange,
  },
  commissionMessage: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: COLOR.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  invalidCommissionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
  },
  invalidCommissionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: COLOR.red,
    marginLeft: 12,
    textAlign: 'center',
    flex: 1,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    marginTop: 8,
    gap: 10,
  },
  paymentOption: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flex: 1,
  },
  selectedPaymentOption: {
    backgroundColor: COLOR.blue,
    borderColor: COLOR.blue,
  },
  paymentOptionContent: {
    alignItems: 'center',
  },
  paymentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedPaymentIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  paymentOptionText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: COLOR.darkGray,
  },
  selectedPaymentOptionText: {
    color: '#FFFFFF',
  },
  cashInputContainer: {
    marginBottom: 15,
    marginTop: 15,
  },
  paymentSubLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  amountInfoContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  amountInfo: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: COLOR.green,
    marginBottom: 4,
  },
  changeInfo: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  changeOk: {
    color: COLOR.green,
  },
  changeWarning: {
    color: COLOR.red,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 52,
  },
  dollarIcon: {
    fontSize: 20,
    color: '#555555',
    marginRight: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  paymentInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    color: '#000000',
    paddingVertical: 0,
    textAlignVertical: 'center',
    height: '100%',
  },
  transferDetails: {
    marginBottom: 15,
    marginTop: 15,
  },
  bankDetail: {
    marginBottom: 16,
  },
  bankDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankDetailLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: COLOR.darkGray,
    marginLeft: 8,
  },
  copyableField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bankDetailInput: {
    flex: 1,
    color: '#333333',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    letterSpacing: 1,
  },
  copyButton: {
    padding: 8,
  },
  feedbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    pointerEvents: 'none',
  },
  feedbackBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  feedbackText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default ShoppingCart;
