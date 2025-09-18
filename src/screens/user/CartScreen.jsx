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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapModal from '../../components/MapModal';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { COLOR } from '../../constants/Color';
import { generateOrderMessage } from '../../data/OrderMessage';
import { buildJsonOrder } from '../../util/OrderUtils';
import { createOrder } from '../../services/OrdersService';

const CartScreen = ({ route, navigation }) => {
  const { cartItems = {}, business, onGoBack } = route.params;
  const [profile, setProfile] = useState(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);

  const paymentMethods = {
    acceptCash: business.acceptCash || false,
    acceptTransfer: business.acceptTransfer || false,
    bankCard: business.bankCard || '',
    bankClabe: business.bankClabe || '',
  };

  const deliveryMethods = {
    pickUp: business.pickUp || false,
    atHome: business.atHome || false,
  };

  useEffect(() => {
    if (business) {
      if (business.atHome) {
        setDeliveryMethod('A domicilio');
      } else if (business.pickUp) {
        setDeliveryMethod('Para recoger');
      }
    }
  }, [business]);

  const [cartState, setCartState] = useState(() => {
    if (!business?.menus || !cartItems) return [];
    return business.menus
      .filter((menu) => cartItems[menu.menuId])
      .map((menu) => ({
        ...menu,
        quantity: cartItems[menu.menuId],
      }));
  });

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

  useEffect(() => {
    return () => {
      if (onGoBack) {
        const updatedCart = {};
        cartState.forEach((item) => {
          if (item.quantity > 0) {
            updatedCart[item.menuId] = item.quantity;
          }
        });
        onGoBack(updatedCart);
      }
    };
  }, [cartState]);

  const totalCantidad = cartState.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrecio = cartState.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

  const openRemoveModal = (menuId) => {
    setSelectedProductId(menuId);
    setShowRemoveModal(true);
  };

  const confirmRemove = () => {
    const updatedCart = cartState.filter(
      (item) => item.menuId !== selectedProductId,
    );
    setCartState(updatedCart);
    setShowRemoveModal(false);
  };

  const copyToClipboardWithFeedback = (text, type) => {
    Clipboard.setString(text);

    let feedbackText = '';
    if (type === 'clabe') {
      feedbackText = 'CLABE copiada';
    } else if (type === 'card') {
      feedbackText = 'Tarjeta copiada';
    }

    setCopiedText(feedbackText);
    setShowCopiedFeedback(true);

    setTimeout(() => {
      setShowCopiedFeedback(false);
    }, 1000);
  };

  const confirmOrder = async () => {
    // Validate that a payment method has been selected
    if (!paymentMethod) {
      setShowPaymentWarning(true);
      return;
    }

    try {
      const orderPayload = {
        orderId: Date.now().toString(),
        businessId: business.businessId,
        customerId: profile?.userId,
        address: `https://maps.google.com?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`,
        notes: customerNotes,
        deliveryMethod: deliveryMethod,
        paymentMethod: paymentMethod,
        jsonOrder: buildJsonOrder(cartState),
        totalPrice: totalPrecio.toFixed(2),
        createdAt: new Date().toISOString(),
      };

      await createOrder(orderPayload);
      console.info('Pedido enviado exitosamente:', orderPayload.orderId);
      setShowConfirmModal(false);
      sendOrderToWhatsApp();
      navigation.popToTop();
    } catch (error) {
      console.error('Error al enviar el pedido:', error);
      alert('Error al enviar el pedido.');
    }
  };

  const sendOrderToWhatsApp = () => {
    console.log('Enviando pedido a WhatsApp...', business.phone);
    const businessPhone = business.phone || '000000000';
    const locationUrl = `https://www.google.com/maps?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`;
    const deliveryTime = '25 a 35 minutos';

    const message = generateOrderMessage(
      business.fullName,
      profile?.fullName || 'Cliente',
      cartState,
      locationUrl,
      customerNotes,
      deliveryMethod,
      paymentMethod === 'cash' ? paymentAmount : '',
      paymentMethod,
      deliveryReference,
      deliveryTime,
    );

    const url = `https://wa.me/${businessPhone}?text=${message}`;

    Linking.openURL(url).catch((err) =>
      console.error('Error al abrir WhatsApp', err),
    );
  };

  const handlePaymentAmountChange = (text) => {
    const regex = /^\d{0,4}$/;
    if (regex.test(text)) {
      setPaymentAmount(text);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>
          {item.quantity} × ${item.price.toFixed(2)} = $
          {(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
      <TouchableHighlight
        underlayColor="#ccc"
        onPress={() => openRemoveModal(item.menuId)}
        style={styles.removeButton}
      >
        <Text style={styles.removeButtonText}>Eliminar</Text>
      </TouchableHighlight>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {cartState.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18, color: COLOR.gray }}>
              Tu carrito está vacío
            </Text>
          </View>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <FlatList
              data={cartState}
              keyExtractor={(item) => item.menuId.toString()}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 30 }}
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={
                <>
                  <Text style={styles.totalCantidadText}>
                    Total de productos: {totalCantidad}
                  </Text>

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
                        color={
                          deliveryLocation ? COLOR.orange : COLOR.lightGray
                        }
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

                    <Text style={styles.sectionMethodTitle}>
                      🚚 Método de entrega
                    </Text>
                    <View style={styles.deliveryMethodContainer}>
                      {[
                        { label: 'A domicilio', value: deliveryMethods.atHome, icon: 'home-outline' },
                        { label: 'Para recoger', value: deliveryMethods.pickUp, icon: 'walk-outline' },
                      ]
                        .filter((method) => method.value)
                        .map((method) => (
                          <TouchableOpacity
                            key={method.label}
                            onPress={() => setDeliveryMethod(method.label)}
                            style={[
                              styles.deliveryOption,
                              deliveryMethod === method.label && styles.selectedOption,
                            ]}
                          >
                            <Ionicons
                              name={method.icon}
                              size={18}
                              color={deliveryMethod === method.label ? '#fff' : '#333'}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={{
                                color: deliveryMethod === method.label ? '#fff' : '#333',
                                fontWeight: 'bold',
                              }}
                            >
                              {method.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>

                    {deliveryMethod === 'A domicilio' && business.atHome && (
                      <>
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
                      </>
                    )}
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
                            paymentMethod === 'cash' &&
                            styles.selectedPaymentOption,
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
                            paymentMethod === 'transfer' &&
                            styles.selectedPaymentOption,
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
                      </View>
                    )}
                  </View>

                  <Text style={styles.totalPrecioText}>
                    Total: ${totalPrecio.toFixed(2)}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      (!paymentMethod || (paymentMethod === 'cash' && !paymentAmount)) &&
                      styles.confirmButtonDisabled,
                    ]}
                    onPress={() => {
                      if (!deliveryLocation) {
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
                      !paymentMethod || (paymentMethod === 'cash' && !paymentAmount)
                    }
                  >
                    <View style={{ flexDirection: 'row' }}>
                      <Ionicons
                        name="logo-whatsapp"
                        size={24}
                        color={COLOR.white}
                        style={{ right: 10 }}
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  itemName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: COLOR.black,
    marginBottom: 4,
  },
  itemDetails: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: COLOR.orange,
  },
  removeButton: {
    backgroundColor: '#E63946',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  totalCantidadText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    textAlign: 'right',
    marginVertical: 20,
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 10,
  },
  totalPrecioText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    textAlign: 'right',
    marginTop: 20,
    marginBottom: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 10,
  },
  confirmButton: {
    backgroundColor: '#22C55E',
    padding: 14,
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: COLOR.white,
    fontSize: 15,
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
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    textAlign: 'center',
    color: '#444',
    marginBottom: 20,
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
  },
  modalConfirm: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalDelete: {
    color: '#E63946',
    fontWeight: 'bold',
    fontSize: 16,
  },
  locationButton: {
    borderWidth: 1,
    backgroundColor: '#f9f9f9',
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  locationButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
  },
  selectedLocationText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
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
    fontSize: 15,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  sectionMethodTitle: {
    fontSize: 15,
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
  },
  deliveryMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 20,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  selectedOption: {
    backgroundColor: '#0099ff',
    borderColor: '#007acc',
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
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  selectedPaymentOption: {
    backgroundColor: '#0099ff',
    borderColor: '#007acc',
  },
  cashInputContainer: {
    marginBottom: 15,
    marginTop: 5,
  },
  paymentSubLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    height: 40,
  },
  dollarIcon: {
    fontSize: 16,
    color: '#555',
    marginRight: 6,
    fontFamily: 'Poppins-SemiBold',
  },
  paymentInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#000',
    paddingVertical: 0,
    textAlignVertical: 'center',
    height: '100%',
  },
  transferDetails: {
    marginBottom: 15,
  },
  bankDetail: {
    marginBottom: 10,
  },
  bankDetailLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  copyableField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
  },
  bankDetailInput: {
    flex: 1,
    paddingVertical: 8,
    color: '#333',
    fontFamily: 'Poppins-Regular',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  feedbackText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  charCounter: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    bottom: 13,
  },
});

export default CartScreen;
