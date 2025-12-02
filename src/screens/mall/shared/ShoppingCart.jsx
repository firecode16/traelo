import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapModal from '../../../components/MapModal';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { COLOR } from '../../../constants/Color';
import { generateOrderMessage } from '../../../orchestrator/OrderMessageOrchestrator';
import { buildJsonOrder } from '../../../util/OrderUtils';
import { createOrder } from '../../../services/OrdersService';
import { useCart } from '../../../contexts/CartContext';

import FoodShoppingCart from '../food/FoodShoppingCart';
import FashionShoppingCart from '../fashion/FashionShoppingCart';
import TechnologyShoppingCart from '../technology/TechnologyShoppingCart';
import HardwareShoppingCart from '../hardware/HardwareShoppingCart';
import PharmacyShoppingCart from '../pharmacy/PharmacyShoppingCart';

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
  const business = initialBusiness || cart[businessId]?.business || {};
  const cartItems = cart[businessId]?.items || {};

  const [profile, setProfile] = useState(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState(null);

  // Sincronizar items iniciales con el contexto
  useEffect(() => {
    if (initialCartItems && Object.keys(initialCartItems).length > 0) {
      Object.entries(initialCartItems).forEach(([productId, quantity]) => {
        addToCart(businessId, productId, quantity, business);
      });
    }
  }, []);

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);

  const paymentMethods = {
    acceptCash: business.acceptCash || false,
    acceptTransfer: business.acceptTransfer || false,
    bankCard: business.bankCard || '',
    bankClabe: business.bankClabe || '',
  };

  // Determinar métodos de entrega basados en el objeto business
  const getDeliveryMethods = () => {
    // Primero, verificar si el negocio tiene deliveryZones
    if (business.deliveryZones && business.deliveryZones.length > 0) {
      const deliveryZone = business.deliveryZones[0];
      return {
        atHome: deliveryZone.homeDeliveryEnabled || false,
        pickUp: deliveryZone.pickupEnabled || false,
      };
    }
    
    // Si no hay deliveryZones, usar valores por defecto
    return {
      atHome: false,
      pickUp: false,
    };
  };

  const deliveryMethods = getDeliveryMethods();

  // Establecer automáticamente el método de entrega si solo hay una opción
  useEffect(() => {
    if (business && (deliveryMethods.atHome || deliveryMethods.pickUp)) {
      const availableMethods = [];
      if (deliveryMethods.atHome) availableMethods.push('A domicilio');
      if (deliveryMethods.pickUp) availableMethods.push('Para recoger');
      
      if (availableMethods.length === 1) {
        setDeliveryMethod(availableMethods[0]);
      } else if (availableMethods.length === 2 && !deliveryMethod) {
        // Si hay dos opciones, establecer una por defecto
        setDeliveryMethod('A domicilio');
      }
    }
  }, [business, deliveryMethods]);

  // Construir cartState desde cartItems usando products
  const cartState = business.products && Array.isArray(business.products)
    ? business.products
        .filter((product) => cartItems[product.productId] && cartItems[product.productId] > 0)
        .map((product) => ({
          ...product,
          quantity: cartItems[product.productId],
        }))
    : [];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('userInfo');
        if (stored) {
          const user = JSON.parse(stored);
          console.log('Customer name:', user.fullName);
          setProfile(user);
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      }
    };

    loadProfile();
  }, []);

  const totalCantidad = cartState.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrecio = cartState.reduce((sum, item) => sum + item.price * item.quantity, 0,);

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [markerCoords, setMarkerCoords] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [deliveryReference, setDeliveryReference] = useState('');

  const openMapModal = async () => {
    setIsLoadingLocation(true);
    try {
      let baseCoords = deliveryLocation;
      if (!baseCoords) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permiso de ubicación denegado');
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
      alert('No se pudo obtener tu ubicación');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const openRemoveModal = (productId) => {
    setSelectedProductId(productId);
    setShowRemoveModal(true);
  };

  const confirmRemove = () => {
    addToCart(businessId, selectedProductId, 0, business);
    setShowRemoveModal(false);
  };

  const copyToClipboardWithFeedback = (text, type) => {
    Clipboard.setString(text);
    let feedbackText = '';
    if (type === 'clabe') feedbackText = 'CLABE copiada';
    else if (type === 'card') feedbackText = 'Tarjeta copiada';
    setCopiedText(feedbackText);
    setShowCopiedFeedback(true);
    setTimeout(() => setShowCopiedFeedback(false), 1000);
  };

  const confirmOrder = async () => {
    if (!paymentMethod) {
      setShowPaymentWarning(true);
      return;
    }

    if (deliveryMethod === 'A domicilio' && !deliveryLocation) {
      setShowLocationWarning(true);
      return;
    }

    if (paymentMethod === 'cash' && (!paymentAmount || parseFloat(paymentAmount) < totalPrecio)) {
      setShowPaymentWarning(true);
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
        totalPrice: totalPrecio.toFixed(2),
        createdAt: new Date().toISOString(),
      };

      await createOrder(orderPayload);
      console.info('✅ Pedido enviado exitosamente:', orderPayload.orderId);

      clearCartForBusiness(business.businessId);
      setShowConfirmModal(false);
      await sendOrderToWhatsApp();
      navigation.popToTop();
    } catch (error) {
      console.error('❌ Error al enviar el pedido:', error);
      Alert.alert('Error', 'Error al enviar el pedido. Por favor, intenta nuevamente.', [{ text: 'OK' }],);
    }
  };

  const sendOrderToWhatsApp = async () => {
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
      };

      const message = generateOrderMessage(sector, orderData);
      const url = `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`;

      await Linking.openURL(url);
    } catch (err) {
      console.error('Error al abrir WhatsApp:', err);
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Por favor, intenta nuevamente.', [{ text: 'OK' }],);
    }
  };

  const handlePaymentAmountChange = (text) => {
    // Permitir números y punto decimal
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(text)) setPaymentAmount(text);
  };

  const renderItem = ({ item }) => {
    return (
      <SectorComponent 
        item={item} 
        actions={
          <TouchableHighlight
            underlayColor="#ccc"
            onPress={() => openRemoveModal(item.productId)}
            style={styles.removeButton}
          >
            <Text style={styles.removeButtonText}>Eliminar</Text>
          </TouchableHighlight>
        }
      />
    );
  };

  // Preparar las opciones de entrega disponibles
  const deliveryOptions = [
    {
      label: 'A domicilio',
      value: deliveryMethods.atHome,
      icon: 'home-outline',
      description: 'Recibe tu pedido en tu ubicación'
    },
    {
      label: 'Para recoger',
      value: deliveryMethods.pickUp,
      icon: 'walk-outline',
      description: 'Recoge tu pedido en el negocio'
    },
  ].filter(method => method.value);

  const isSingleOption = deliveryOptions.length === 1;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {cartState.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 18, color: COLOR.gray }}>
              Tu carrito está vacío
            </Text>
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
                      <Text style={styles.sectionMethodTitle}>
                        🚚 Método de entrega
                      </Text>
                      
                      {/* Mostrar mensaje informativo cuando solo hay una opción */}
                      {isSingleOption && (
                        <View style={styles.singleOptionInfo}>
                          <Ionicons name="information-circle-outline" size={16} color={COLOR.blue} />
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
                              <View style={[
                                styles.deliveryIconContainer,
                                (deliveryMethod === method.label || isSingleOption) && styles.selectedIconContainer
                              ]}>
                                <Ionicons
                                  name={method.icon}
                                  size={20}
                                  color={(deliveryMethod === method.label || isSingleOption) ? COLOR.blue : COLOR.gray}
                                />
                              </View>
                              
                              <View style={styles.deliveryTextContainer}>
                                <Text style={[
                                  styles.deliveryOptionLabel,
                                  (deliveryMethod === method.label || isSingleOption) && styles.selectedDeliveryText
                                ]}>
                                  {method.label}
                                </Text>
                                <Text style={[
                                  styles.deliveryOptionDesc,
                                  (deliveryMethod === method.label || isSingleOption) && styles.selectedDeliveryDesc
                                ]}>
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
                      
                      {/* Mostrar método actual seleccionado */}
                      {deliveryMethod && (
                        <View style={styles.selectedMethodContainer}>
                          <Ionicons name="checkmark" size={16} color={COLOR.green} />
                          <Text style={styles.selectedMethodText}>
                            <Text style={styles.selectedMethodLabel}>Método seleccionado: </Text>
                            <Text style={styles.selectedMethodValue}>{deliveryMethod}</Text>
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.card}>
                      <Text style={styles.sectionMethodTitle}>
                        🚚 Método de entrega
                      </Text>
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
                      <TouchableHighlight
                        underlayColor="#d0cfcfff"
                        style={[
                          styles.locationButton,
                          {
                            borderColor: deliveryLocation ? COLOR.orange : COLOR.gray,
                          },
                        ]}
                        onPress={openMapModal}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Entypo
                            name="location"
                            size={22}
                            color={deliveryLocation ? COLOR.orange : COLOR.black}
                            style={{ right: 10 }}
                          />
                          <Text style={styles.locationButtonText}>
                            {deliveryLocation ? (
                              <Text style={styles.selectedLocationText}>
                                Cambiar la ubicación
                              </Text>
                            ) : (
                              'Compartir ubicación de entrega'
                            )}
                          </Text>
                        </View>
                      </TouchableHighlight>

                      {isLoadingLocation && (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#22C55E" />
                          <Text style={styles.loadingText}>
                            Obteniendo ubicación...
                          </Text>
                        </View>
                      )}

                      <View style={styles.card}>
                        <Text style={styles.sectionTitle}>
                          📍 Referencia de entrega
                        </Text>
                        <TextInput
                          style={[styles.notesInput, { color: '#000' }]}
                          placeholder="Eje. Porton amarillo, casa azul, a nombre de..."
                          placeholderTextColor="#9e9e9eff"
                          value={deliveryReference}
                          onChangeText={setDeliveryReference}
                          maxLength={30}
                        />
                        <Text style={styles.charCounter}>
                          {deliveryReference.length}/30 caracteres
                        </Text>
                      </View>
                    </>
                  )}

                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                      📝 Notas del cliente
                    </Text>
                    <TextInput
                      style={[styles.notesInput, { color: '#000' }]}
                      placeholder="Eje. sin cebolla, salsa extra..."
                      placeholderTextColor="#9e9e9eff"
                      multiline
                      numberOfLines={3}
                      value={customerNotes}
                      onChangeText={setCustomerNotes}
                    />
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.sectionMethodTitle}>
                      💳 Método de pago
                    </Text>
                    <View style={styles.paymentMethodContainer}>
                      {paymentMethods.acceptCash && (
                        <TouchableOpacity
                          onPress={() => setPaymentMethod('cash')}
                          style={[
                            styles.paymentOption,
                            paymentMethod === 'cash' && styles.selectedPaymentOption,
                          ]}
                        >
                          <Ionicons
                            name="cash-outline"
                            size={18}
                            color={paymentMethod === 'cash' ? '#fff' : '#333'}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={{
                              color: paymentMethod === 'cash' ? '#fff' : '#333',
                              fontWeight: 'bold',
                            }}
                          >
                            Efectivo
                          </Text>
                        </TouchableOpacity>
                      )}

                      {paymentMethods.acceptTransfer && (
                        <TouchableOpacity
                          onPress={() => setPaymentMethod('transfer')}
                          style={[
                            styles.paymentOption,
                            paymentMethod === 'transfer' && styles.selectedPaymentOption,
                          ]}
                        >
                          <Ionicons
                            name="card-outline"
                            size={18}
                            color={
                              paymentMethod === 'transfer' ? '#fff' : '#333'
                            }
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={{
                              color: paymentMethod === 'transfer' ? '#fff' : '#333',
                              fontWeight: 'bold',
                            }}
                          >
                            Transferencia
                          </Text>
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
                            placeholder="0"
                            placeholderTextColor="#9e9e9eff"
                            keyboardType="numeric"
                            value={paymentAmount}
                            onChangeText={handlePaymentAmountChange}
                          />
                        </View>
                        <Text style={styles.amountInfo}>
                          Total a pagar: ${totalPrecio.toFixed(2)}
                        </Text>
                      </View>
                    )}

                    {paymentMethod === 'transfer' && (
                      <View style={styles.transferDetails}>
                        {paymentMethods.bankCard && (
                          <View style={styles.bankDetail}>
                            <Text style={styles.bankDetailLabel}>Tarjeta:</Text>
                            <View style={styles.copyableField}>
                              <TextInput
                                style={styles.bankDetailInput}
                                value={paymentMethods.bankCard}
                                editable={false}
                              />
                              <TouchableOpacity
                                onPress={() =>
                                  copyToClipboardWithFeedback(paymentMethods.bankCard, 'card')
                                }
                              >
                                <Ionicons
                                  name="copy-outline"
                                  size={20}
                                  color={COLOR.orange}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        {paymentMethods.bankClabe && (
                          <View style={styles.bankDetail}>
                            <Text style={styles.bankDetailLabel}>CLABE:</Text>
                            <View style={styles.copyableField}>
                              <TextInput
                                style={styles.bankDetailInput}
                                value={paymentMethods.bankClabe}
                                editable={false}
                              />
                              <TouchableOpacity
                                onPress={() =>
                                  copyToClipboardWithFeedback(paymentMethods.bankClabe, 'clabe')
                                }
                              >
                                <Ionicons
                                  name="copy-outline"
                                  size={20}
                                  color={COLOR.orange}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  <Text style={styles.totalPrecioText}>
                    Total: ${totalPrecio.toFixed(2)}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      (!paymentMethod || (deliveryMethod === 'A domicilio' && !deliveryLocation) ||
                        (paymentMethod === 'cash' && (!paymentAmount || parseFloat(paymentAmount) < totalPrecio))
                      ) && styles.confirmButtonDisabled,
                    ]}
                    onPress={() => {
                      if (deliveryMethod === 'A domicilio' && !deliveryLocation) {
                        setShowLocationWarning(true);
                      } else if (!paymentMethod) {
                        setShowPaymentWarning(true);
                      } else if (paymentMethod === 'cash' && (!paymentAmount || parseFloat(paymentAmount) < totalPrecio)) {
                        setShowPaymentWarning(true);
                      } else {
                        setShowConfirmModal(true);
                      }
                    }}
                    disabled={
                      !paymentMethod || (deliveryMethod === 'A domicilio' && !deliveryLocation) || (paymentMethod === 'cash' && !paymentAmount)
                    }
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons
                        name="logo-whatsapp"
                        size={24}
                        color={COLOR.white}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={styles.confirmButtonText}>
                        Confirmar pedido
                      </Text>
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
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
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
          onConfirm={() => {
            if (markerCoords) {
              setDeliveryLocation(markerCoords);
              setShowMapModal(false);
            }
          }}
        />

        {showConfirmModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Confirmar pedido</Text>
              <Text style={styles.modalText}>¿Deseas confirmar tu pedido?</Text>
              {deliveryMethod && (
                <Text style={[styles.modalText]}>
                  Método de entrega:{' '}
                  <Text style={{ fontWeight: 'bold', color: '#0099ff' }}>
                    {deliveryMethod}
                  </Text>
                </Text>
              )}
              {paymentMethod && (
                <Text style={[styles.modalText]}>
                  Método de pago:{' '}
                  <Text style={{ fontWeight: 'bold', color: '#0099ff' }}>
                    {paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                  </Text>
                </Text>
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                  <Text style={styles.modalCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmOrder}>
                  <Text style={styles.modalConfirm}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {showRemoveModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Eliminar producto</Text>
              <Text style={styles.modalText}>
                ¿Seguro que deseas eliminar este producto del carrito?
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowRemoveModal(false)}>
                  <Text style={styles.modalCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmRemove}>
                  <Text style={styles.modalDelete}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {showLocationWarning && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Ubicación requerida</Text>
              <Text style={styles.modalText}>
                Por favor selecciona la ubicación de entrega antes de confirmar tu pedido.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowLocationWarning(false)}>
                  <Text style={styles.modalCancel}>Entendido</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {showPaymentWarning && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Método de pago requerido</Text>
              <Text style={styles.modalText}>
                {!paymentMethod
                  ? 'Por favor selecciona un método de pago antes de confirmar tu pedido.'
                  : paymentMethod === 'cash' && (!paymentAmount || parseFloat(paymentAmount) < totalPrecio)
                  ? 'Por favor ingresa un monto igual o mayor al total a pagar.'
                  : 'Por favor ingresa el monto con el que pagarás en efectivo.'}
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowPaymentWarning(false)}>
                  <Text style={styles.modalCancel}>Entendido</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
  removeButton: {
    backgroundColor: '#E63946',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  totalCantidadText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    textAlign: 'right',
    marginVertical: 20,
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 10,
    color: COLOR.darkGray,
  },
  totalPrecioText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    textAlign: 'right',
    marginTop: 20,
    marginBottom: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 10,
    color: COLOR.green,
  },
  confirmButton: {
    backgroundColor: '#00CC86',
    padding: 16,
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: COLOR.white,
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: COLOR.darkGray,
  },
  modalText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    textAlign: 'center',
    color: '#444',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalCancel: {
    color: '#999',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  modalConfirm: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  modalDelete: {
    color: '#E63946',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  locationButton: {
    borderWidth: 1.5,
    backgroundColor: '#f9f9f9',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 10,
  },
  locationButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    textAlign: 'center',
    color: '#333',
  },
  selectedLocationText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    textAlign: 'center',
    color: COLOR.orange,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  sectionTitle: {
    fontSize: 16,
    color: COLOR.darkGray,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  sectionMethodTitle: {
    fontSize: 17,
    color: COLOR.darkGray,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  singleOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f2ff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
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
    marginTop: 8,
    marginBottom: 8,
  },
  deliveryOption: {
    borderWidth: 1.5,
    borderColor: COLOR.lightGray,
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fff',
    marginBottom: 10,
    width: '100%',
  },
  selectedDeliveryOption: {
    borderColor: COLOR.green,
    backgroundColor: '#e6f2ff',
  },
  deliveryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLOR.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIconContainer: {
    backgroundColor: '#b3d9ff',
  },
  deliveryTextContainer: {
    flex: 1,
  },
  deliveryOptionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: COLOR.darkGray,
    marginBottom: 2,
  },
  deliveryOptionDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
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
  selectedMethodContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLOR.green,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedMethodText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: COLOR.darkGray,
    marginLeft: 6,
  },
  selectedMethodLabel: {
    fontFamily: 'Poppins-SemiBold',
    color: COLOR.darkGray,
  },
  selectedMethodValue: {
    fontFamily: 'Poppins-SemiBold',
    color: COLOR.green,
  },
  noDeliveryOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  noDeliveryOptionsText: {
    fontSize: 13,
    color: COLOR.gray,
    fontFamily: 'Poppins-Regular',
    marginLeft: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    marginTop: 5,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
  },
  selectedPaymentOption: {
    backgroundColor: '#0099ff',
    borderColor: '#007acc',
  },
  cashInputContainer: {
    marginBottom: 15,
    marginTop: 15,
  },
  paymentSubLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountInfo: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: COLOR.green,
    marginTop: 8,
    textAlign: 'center',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    height: 44,
  },
  dollarIcon: {
    fontSize: 18,
    color: '#555',
    marginRight: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  paymentInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#000',
    paddingVertical: 0,
    textAlignVertical: 'center',
    height: '100%',
  },
  transferDetails: {
    marginBottom: 15,
    marginTop: 15,
  },
  bankDetail: {
    marginBottom: 12,
  },
  bankDetailLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  copyableField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  bankDetailInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#333',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  feedbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  feedbackBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  feedbackText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Poppins-SemiBold',
  },
  charCounter: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
});

export default ShoppingCart;
