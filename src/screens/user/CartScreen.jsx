import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapModal from '../../components/MapModal';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { COLOR } from '../../constants/Color';
import { generateOrderMessage } from '../../data/OrderMessage';

const CartScreen = ({ route, navigation }) => {
  const { cartItems = {}, business, onGoBack } = route.params;
  const [profile, setProfile] = useState(null);

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

  const totalPrecio = cartState.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [markerCoords, setMarkerCoords] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  const openMapModal = async () => {
    setIsLoadingLocation(true);
    try {
      if (!location) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permiso de ubicaci\u00f3n denegado');
          setIsLoadingLocation(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
          maximumAge: 30000,
        });
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setLocation(coords);
        setMarkerCoords(coords);
      }
      setShowMapModal(true);
    } catch (error) {
      console.warn('Error al obtener ubicaci\u00f3n:', error);
      alert('No se pudo obtener tu ubicaci\u00f3n');
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

  const confirmOrder = () => {
    setShowConfirmModal(false);
    sendOrderToWhatsApp();
    navigation.popToTop();
  };

  const sendOrderToWhatsApp = () => {
    console.log('Enviando pedido a WhatsApp...', business.phone);
    const businessPhone = business.phone || '000000000';
    const locationUrl = `https://www.google.com/maps?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`;

    const message = generateOrderMessage(
      business.fullName,
      profile?.fullName || 'Cliente',
      cartState,
      locationUrl,
    );

    const url = `https://wa.me/${businessPhone}?text=${message}`;

    Linking.openURL(url).catch((err) =>
      console.error('Error al abrir WhatsApp', err),
    );
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
      <TouchableOpacity
        onPress={() => openRemoveModal(item.menuId)}
        style={styles.removeButton}
      >
        <Text style={styles.removeButtonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
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
        <FlatList
          data={cartState}
          keyExtractor={(item) => item.menuId.toString()}
          renderItem={renderItem}
          ListFooterComponent={
            <>
              <Text style={styles.totalCantidadText}>
                Total de productos: {totalCantidad}
              </Text>
              <Text style={styles.totalPrecioText}>
                Total: ${totalPrecio.toFixed(2)}
              </Text>

              <TouchableOpacity
                style={styles.locationButton}
                onPress={openMapModal}
              >
                <View
                  style={{ flexDirection: 'row', justifyContent: 'center' }}
                >
                  <Entypo
                    name="location"
                    size={22}
                    color={deliveryLocation ? COLOR.orange : COLOR.lightGray}
                    style={{ right: 10 }}
                  />
                  <Text style={styles.locationButtonText}>
                    {deliveryLocation ? (
                      <Text style={styles.selectedLocationText}>
                        Ubicación seleccionada
                      </Text>
                    ) : (
                      'Seleccionar ubicación de entrega'
                    )}
                  </Text>
                </View>
              </TouchableOpacity>

              {isLoadingLocation && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#22C55E" />
                  <Text style={styles.loadingText}>
                    Obteniendo ubicación...
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  if (!deliveryLocation) {
                    setShowLocationWarning(true);
                  } else {
                    setShowConfirmModal(true);
                  }
                }}
              >
                <View style={{ flexDirection: 'row' }}>
                  <Ionicons
                    name="logo-whatsapp"
                    size={24}
                    color={COLOR.white}
                    style={{ right: 10 }}
                  />
                  <Text style={styles.confirmButtonText}>Confirmar pedido</Text>
                </View>
              </TouchableOpacity>
            </>
          }
        />
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
              Por favor selecciona la ubicación de entrega antes de confirmar tu
              pedido.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowLocationWarning(false)}>
                <Text style={styles.modalCancel}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
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
    elevation: 1,
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
    marginBottom: 25,
  },

  confirmButton: {
    backgroundColor: '#22C55E',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
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
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
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
});

export default CartScreen;
