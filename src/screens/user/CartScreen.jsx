import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLOR } from '../../constants/Color';
import { generateOrderMessage } from '../../data/OrderMessage';

const CartScreen = ({ route, navigation }) => {
  const { cart, item } = route.params;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

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
    const message = generateOrderMessage(
      item.businessName,
      'Nombre cliente',
      cart,
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
              style={styles.confirmButton}
              onPress={() => setShowConfirmModal(true)}
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
});

export default CartScreen;
