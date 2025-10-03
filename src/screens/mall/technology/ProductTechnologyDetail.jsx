import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageWithFallback from '../../../components/ImageWithFallback';
import { COLOR } from '../../../constants/Color';

const ProductTechnologyDetail = ({ product, onClose, onAddToCart, currentProductQuantity }) => {
  const [selectedWarranty, setSelectedWarranty] = useState(null);

  const handleAddToCart = () => {
    const variant = selectedWarranty ? { warranty: selectedWarranty } : null;
    const finalPrice = variant ? product.price + product.warrantyOptions.find(w => w.period === selectedWarranty).price : product.price;

    onAddToCart(product, 1, variant, finalPrice);
    onClose();
  };

  return (
    <View style={styles.fullScreenContainer}>
      <View style={styles.handleIndicator} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageWithFallback
          src={product.imageUrl}
          style={styles.sheetImage}
          resizeMode="cover"
        />
        <Text style={styles.sheetTitle}>{product.name}</Text>
        <Text style={styles.sheetDescription}>{product.description}</Text>
        <Text style={styles.sheetPrice}>${product.price}</Text>

        {product.specs && (
          <View style={styles.specsContainer}>
            <Text style={styles.sectionTitle}>Especificaciones técnicas:</Text>
            {product.specs.map((spec, index) => (
              <Text key={index} style={styles.specText}>• {spec}</Text>
            ))}
          </View>
        )}

        {product.warrantyOptions && (
          <View style={styles.warrantyContainer}>
            <Text style={styles.sectionTitle}>Opciones de garantía:</Text>
            {product.warrantyOptions.map((warranty) => (
              <TouchableOpacity
                key={warranty.period}
                style={[
                  styles.warrantyButton, selectedWarranty === warranty.period && styles.selectedOption,
                ]}
                onPress={() => setSelectedWarranty(warranty.period)}
              >
                <Text style={[
                  styles.warrantyText, selectedWarranty === warranty.period && styles.selectedOptionText
                ]}>
                  {warranty.period} - +${warranty.price}
                </Text>
                <Text style={[
                  styles.warrantyDescription, selectedWarranty === warranty.period && styles.selectedOptionText
                ]}>
                  {warranty.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {product.features && (
          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>Características destacadas:</Text>
            {product.features.map((feature, index) => (
              <Text key={index} style={styles.featureText}>✓ {feature}</Text>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={handleAddToCart}
      >
        <Ionicons name="cart-outline" size={24} color={COLOR.white} />
        <Text style={styles.addToCartButtonText}>
          Agregar al carrito - $
          {selectedWarranty ? (product.price + product.warrantyOptions.find(w => w.period === selectedWarranty).price).toFixed(2) : product.price.toFixed(2)}
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
  },
  handleIndicator: {
    width: 40,
    height: 5,
    backgroundColor: COLOR.gray,
    borderRadius: 2.5,
    marginBottom: 10,
    alignSelf: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
    marginBottom: 12,
    fontFamily: 'Poppins-Light',
    color: COLOR.darkGray,
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
  },
  specsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  specText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: COLOR.darkGray,
    marginBottom: 4,
  },
  warrantyContainer: {
    marginBottom: 16,
  },
  warrantyButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLOR.gray,
  },
  selectedOption: {
    backgroundColor: COLOR.orange,
    borderColor: COLOR.orange,
  },
  warrantyText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: COLOR.darkGray,
    marginBottom: 4,
  },
  warrantyDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: COLOR.darkGray,
  },
  selectedOptionText: {
    color: COLOR.white,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: COLOR.darkGray,
    marginBottom: 4,
  },
  addToCartButton: {
    backgroundColor: COLOR.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  addToCartButtonText: {
    color: COLOR.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ProductTechnologyDetail;