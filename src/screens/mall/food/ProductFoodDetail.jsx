import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageWithFallback from '../../../components/ImageWithFallback';
import { COLOR } from '../../../constants/Color';

const ProductFoodDetail = ({ product, onClose, onAddToCart, currentProductQuantity }) => {
  const quantity = currentProductQuantity;

  const handleUpdateQuantity = (newQty) => {
    onAddToCart(product, newQty);
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 0) {
      handleUpdateQuantity(quantity - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    handleUpdateQuantity(quantity + 1);
  };

  const handleConfirmAddToCart = () => {
    onClose();
  };

  return (
    <View style={styles.modalContent}>
      {/* Cabecera del modal con botón cerrar */}
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={COLOR.darkGray} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Detalles del Producto</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <ImageWithFallback
          src={product.imageUrl}
          style={styles.sheetImage}
          resizeMode="cover"
        />
        
        <View style={styles.contentPadding}>
          <Text style={styles.sheetTitle}>{product.name}</Text>
          <Text style={styles.sheetCategory}>{product.category}</Text>
          
          <Text style={styles.sheetDescription}>{product.description}</Text>
          
          {/* Sección de ingredientes */}
          {product.ingredients && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Ingredientes</Text>
              <Text style={styles.ingredientsText}>{product.ingredients}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.sheetPrice}>${product.price}</Text>
              <Text style={styles.priceLabel}>Precio</Text>
            </View>
            
            <View style={styles.infoColumn}>
              <Text style={styles.sheetStock}>{product.generalStock}</Text>
              <Text style={styles.stockLabel}>Disponibles</Text>
            </View>
            
            {product.preparationTime && (
              <View style={styles.infoColumn}>
                <View style={styles.timeContainer}>
                  <Ionicons name="time-outline" size={16} color={COLOR.orange} />
                  <Text style={styles.preparationTime}>{product.preparationTime}</Text>
                </View>
                <Text style={styles.timeLabel}>Minutos</Text>
              </View>
            )}
          </View>

          {/* Tiempo estimado de preparación */}
          {product.preparationTime && (
            <View style={styles.deliveryInfoContainer}>
              <Ionicons name="time" size={18} color={COLOR.blue} />
              <Text style={styles.deliveryInfoText}>
                Tiempo estimado de preparación: {product.preparationTime} minutos
              </Text>
            </View>
          )}

          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={[styles.counterButton, quantity === 0 && styles.counterButtonDisabled]}
              onPress={handleDecreaseQuantity}
              disabled={quantity === 0}
            >
              <Text style={styles.counterText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={handleIncreaseQuantity}
            >
              <Text style={styles.counterText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Botón fijo en la parte inferior */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[styles.addToCartButton, quantity === 0 && styles.addToCartButtonDisabled]}
          onPress={handleConfirmAddToCart}
          disabled={quantity === 0}
        >
          <Ionicons name="cart-outline" size={24} color={COLOR.white} />
          <Text style={styles.addToCartButtonText}>
            {quantity === 0 ? 'Añadir al carrito' : `Total: $${(product.price * quantity).toFixed(2)} - Confirmar`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    backgroundColor: COLOR.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.lightGray,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: COLOR.darkGray,
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentPadding: {
    paddingHorizontal: 16,
  },
  sheetImage: {
    width: '100%',
    height: 280,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
    color: COLOR.darkGray,
    textAlign: 'center',
  },
  sheetCategory: {
    fontSize: 14,
    color: COLOR.gray,
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  sheetDescription: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins-Light',
    color: COLOR.darkGray,
    lineHeight: 22,
  },
  sectionContainer: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLOR.darkGray,
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  ingredientsText: {
    fontSize: 14,
    color: COLOR.gray,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
    backgroundColor: COLOR.lightGray,
    padding: 12,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  infoColumn: {
    alignItems: 'center',
    flex: 1,
  },
  sheetPrice: {
    fontSize: 22,
    color: COLOR.green,
    fontFamily: 'Poppins-SemiBold',
  },
  priceLabel: {
    fontSize: 12,
    color: COLOR.gray,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
  sheetStock: {
    fontSize: 22,
    color: COLOR.orange,
    fontFamily: 'Poppins-SemiBold',
  },
  stockLabel: {
    fontSize: 12,
    color: COLOR.gray,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preparationTime: {
    fontSize: 22,
    color: COLOR.blue,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: COLOR.gray,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
  deliveryInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR.lightBlue,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  deliveryInfoText: {
    fontSize: 14,
    color: COLOR.blue,
    fontFamily: 'Poppins-Regular',
    marginLeft: 8,
    flex: 1,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 8,
  },
  counterButton: {
    backgroundColor: COLOR.lightGray,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  counterButtonDisabled: {
    backgroundColor: COLOR.gray,
    opacity: 0.7,
  },
  counterText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLOR.darkGray,
  },
  counterValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLOR.darkGray,
    minWidth: 50,
    textAlign: 'center',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLOR.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLOR.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  addToCartButton: {
    backgroundColor: COLOR.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  addToCartButtonDisabled: {
    backgroundColor: COLOR.gray,
    opacity: 0.7,
  },
  addToCartButtonText: {
    color: COLOR.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ProductFoodDetail;
