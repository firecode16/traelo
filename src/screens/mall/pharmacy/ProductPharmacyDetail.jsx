import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageWithFallback from '../../../components/ImageWithFallback';
import { COLOR } from '../../../constants/Color';

const ProductPharmacyDetail = ({ product, onClose, onAddToCart, currentProductQuantity }) => {
  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    const variant = selectedPresentation ? { presentation: selectedPresentation } : null;
    onAddToCart(product, quantity, variant);
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
      
      {product.requiresPrescription && (
        <View style={styles.prescriptionBadge}>
          <Text style={styles.prescriptionText}>Requiere receta médica</Text>
        </View>
      )}

      <Text style={styles.sheetDescription}>{product.description}</Text>
      <Text style={styles.sheetPrice}>${product.price}</Text>

      {product.presentations && (
        <View style={styles.presentationsContainer}>
          <Text style={styles.sectionTitle}>Presentaciones:</Text>
          <View style={styles.presentationsGrid}>
            {product.presentations.map((pres) => (
              <TouchableOpacity
                key={pres.id}
                style={[
                  styles.presentationButton,
                  selectedPresentation === pres.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedPresentation(pres.id)}
              >
                <Text style={[
                  styles.presentationText,
                  selectedPresentation === pres.id && styles.selectedOptionText
                ]}>
                  {pres.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {product.details && (
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Información del medicamento:</Text>
          {product.details.map((detail, index) => (
            <Text key={index} style={styles.detailText}>• {detail}</Text>
          ))}
        </View>
      )}

      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={[styles.counterButton, quantity === 1 && styles.counterButtonDisabled]}
          onPress={() => quantity > 1 && setQuantity(q => q - 1)}
        >
          <Text style={styles.counterText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.counterValue}>{quantity}</Text>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => setQuantity(q => q + 1)}
        >
          <Text style={styles.counterText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.addToCartButton,
          (product.requiresPrescription && !product.hasPrescription) && styles.addToCartButtonDisabled,
        ]}
        onPress={handleAddToCart}
        disabled={product.requiresPrescription && !product.hasPrescription}
      >
        <Ionicons name="cart-outline" size={24} color={COLOR.white} />
        <Text style={styles.addToCartButtonText}>
          Agregar al carrito - ${(product.price * quantity).toFixed(2)}
        </Text>
      </TouchableOpacity>

      {product.warnings && (
        <View style={styles.warningsContainer}>
          {product.warnings.map((warning, index) => (
            <Text key={index} style={styles.warningText}>⚠️ {warning}</Text>
          ))}
        </View>
      )}
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
  prescriptionBadge: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  prescriptionText: {
    color: COLOR.white,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
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
  presentationsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  presentationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  presentationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  presentationText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: COLOR.darkGray,
  },
  selectedOptionText: {
    color: COLOR.white,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  detailText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: COLOR.darkGray,
    marginBottom: 4,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  counterButton: {
    backgroundColor: COLOR.lightGray,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 10,
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
  warningsContainer: {
    width: '100%',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  warningText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#e65100',
    marginBottom: 4,
  },
});

export default ProductPharmacyDetail;