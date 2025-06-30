import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapModal from '../../components/MapModal';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { COLOR } from '../../constants/Color';
import { generateOrderMessage } from '../../data/OrderMessage';

const CartScreen = ({ route, navigation }) => {
  const { cart, item } = route.params;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  /** loading */
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  /** map location */
  const [showMapModal, setShowMapModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [markerCoords, setMarkerCoords] = useState(null);

  /** order cart */
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  const openMapModal = async () => {
    // show loading
    setIsLoadingLocation(true);

    try {
      // Si ya tenemos ubicación guardada, no la volvemos a pedir
      if (!location) {
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

        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        setLocation(coords);
        setMarkerCoords(coords);
      }

      // show modal
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
    const updatedCart = cart.filter(
      (item) => item.menuId !== selectedProductId,
    );
    navigation.setParams({ cart: updatedCart });
    setShowRemoveModal(false);
  };

  const confirmOrder = () => {
    setShowConfirmModal(false);
    sendOrderToWhatsApp();
    navigation.popToTop(); // simula regreso a inicio
  };

  const sendOrderToWhatsApp = () => {
    const businessPhone = item.cellPhone; // número de WhatsApp del negocio
    const locationUrl = `https://www.google.com/maps?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`;
    const message = generateOrderMessage(
      item.businessName,
      'Nombre cliente',
      cart,
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
          {item.quantity} × ${item.price} = ${item.price * item.quantity}
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
      <FlatList
        data={cart}
        keyExtractor={(item) => item.menuId.toString()}
        renderItem={renderItem}
        ListFooterComponent={
          <>
            <Text style={styles.totalText}>Total: ${total}</Text>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={openMapModal}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
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
                <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
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

      {/* Modal: Map */}
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
          console.log('Ubicación confirmada:', markerCoords);
        }}
      />

      {/* Modal: Confirmar pedido */}
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

      {/* Modal: Eliminar producto */}
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

      {/** Modal: show location warning */}
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

  totalText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    textAlign: 'right',
    marginVertical: 20,
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
