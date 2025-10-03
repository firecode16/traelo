import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageWithFallback from '../../../components/ImageWithFallback';
import { COLOR } from '../../../constants/Color';

const ProductFashionDetail = ({ product, onClose, onAddToCart, currentProductQuantity, }) => {
  const [selectedSize, setSelectedSize] = useState(
    product.selectedSize || null,
  );
  const [selectedColor, setSelectedColor] = useState(
    product.selectedColor || null,
  );

  const handleAddToCart = () => {
    const variant = { size: selectedSize, color: selectedColor };
    onAddToCart(product, 1, variant);
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
      <Text style={styles.sheetDescription}>{product.description}</Text>
      <Text style={styles.sheetPrice}>${product.price}</Text>

      <View style={styles.variantsContainer}>
        <Text style={styles.sectionTitle}>Tallas disponibles:</Text>
        <View style={styles.sizesGrid}>
          {product.sizes?.map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeButton, selectedSize === size && styles.selectedOption,
              ]}
              onPress={() => setSelectedSize(size)}
            >
              <Text
                style={[
                  styles.sizeText, selectedSize === size && styles.selectedOptionText,
                ]}
              >
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Colores disponibles:</Text>
        <View style={styles.colorsGrid}>
          {product.colors?.map((color) => (
            <TouchableOpacity
              key={color.code}
              style={[
                styles.colorButton, { backgroundColor: color.code }, selectedColor === color.code && styles.selectedColorButton,
              ]}
              onPress={() => setSelectedColor(color.code)}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.addToCartButton, (!selectedSize || !selectedColor) && styles.addToCartButtonDisabled,
        ]}
        onPress={handleAddToCart}
        disabled={!selectedSize || !selectedColor}
      >
        <Ionicons name="cart-outline" size={24} color={COLOR.white} />
        <Text style={styles.addToCartButtonText}>
          Agregar al carrito - ${product.price}
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
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: COLOR.darkGray,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  variantsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLOR.gray,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: COLOR.orange,
    borderColor: COLOR.orange,
  },
  sizeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: COLOR.darkGray,
  },
  selectedOptionText: {
    color: COLOR.white,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLOR.gray,
  },
  selectedColorButton: {
    borderWidth: 2,
    borderColor: COLOR.orange,
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

export default ProductFashionDetail;
