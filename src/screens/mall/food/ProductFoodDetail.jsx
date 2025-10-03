import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    <View style={styles.fullScreenContainer}>
      <View style={styles.handleIndicator} />

      <ImageWithFallback
        src={product.imageUrl}
        style={styles.sheetImage}
        resizeMode="cover"
      />
      <Text style={styles.sheetTitle}>{product.name}</Text>
      <Text style={styles.sheetCategory}>{product.category}</Text>
      <Text style={styles.sheetDescription}>{product.description}</Text>
      <Text style={styles.sheetPrice}>${product.price}</Text>
      <Text style={styles.sheetStock}>Stock: {product.stock}</Text>

      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={[styles.counterButton, quantity === 0 && styles.counterButtonDisabled,]}
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

      <TouchableOpacity
        style={[styles.addToCartButton, quantity === 0 && styles.addToCartButtonDisabled,]}
        onPress={handleConfirmAddToCart}
        disabled={quantity === 0}
      >
        <Ionicons name="cart-outline" size={24} color={COLOR.white} />
        <Text style={styles.addToCartButtonText}>
          Total: $ {(product.price * quantity).toFixed(2)} - Confirmar
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLOR.white,
    padding: 16,
    alignItems: 'center',
  },
  handleIndicator: {
    width: 40,
    height: 5,
    backgroundColor: COLOR.gray,
    borderRadius: 2.5,
    marginBottom: 10,
  },
  sheetImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 20,
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
    color: COLOR.darkGray,
  },
  sheetCategory: {
    fontSize: 14,
    color: COLOR.gray,
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  sheetDescription: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Poppins-Light',
    color: COLOR.darkGray,
    paddingHorizontal: 10,
  },
  sheetPrice: {
    fontSize: 19,
    color: COLOR.green,
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  sheetStock: {
    fontSize: 14,
    color: COLOR.gray,
    marginBottom: 16,
    fontFamily: 'Poppins-Regular',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  counterButton: {
    backgroundColor: COLOR.lightGray,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 10,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLOR.darkGray,
  },
  counterValue: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLOR.darkGray,
  },
  addToCartButton: {
    backgroundColor: COLOR.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 20,
    width: '90%',
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
