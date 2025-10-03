import React, { useState } from 'react';
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

const ProductHardwareDetail = ({ product, onClose, onAddToCart, currentProductQuantity, }) => {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    const variant = selectedUnit ? { unit: selectedUnit } : null;
    onAddToCart(product, quantity, variant);
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
        <Text style={styles.sheetPrice}>
          ${product.price}
          {product.unit ? `/${product.unit}` : ''}
        </Text>

        {product.units && (
          <View style={styles.unitsContainer}>
            <Text style={styles.sectionTitle}>Unidades de venta:</Text>
            <View style={styles.unitsGrid}>
              {product.units.map((unit) => (
                <TouchableOpacity
                  key={unit.type}
                  style={[
                    styles.unitButton, selectedUnit === unit.type && styles.selectedOption,
                  ]}
                  onPress={() => setSelectedUnit(unit.type)}
                >
                  <Text style={[
                      styles.unitText, selectedUnit === unit.type && styles.selectedOptionText,
                    ]}
                  >
                    {unit.type} ({unit.quantity} {product.unit})
                  </Text>
                  {unit.price && (
                    <Text style={[
                        styles.unitPrice, selectedUnit === unit.type && styles.selectedOptionText,
                      ]}
                    >
                      ${unit.price}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {product.specifications && (
          <View style={styles.specificationsContainer}>
            <Text style={styles.sectionTitle}>Especificaciones:</Text>
            {product.specifications.map((spec, index) => (
              <Text key={index} style={styles.specText}>
                • {spec}
              </Text>
            ))}
          </View>
        )}

        {product.materials && (
          <View style={styles.materialsContainer}>
            <Text style={styles.sectionTitle}>Materiales:</Text>
            {product.materials.map((material, index) => (
              <Text key={index} style={styles.materialText}>
                ✓ {material}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.quantityContainer}>
          <Text style={styles.sectionTitle}>Cantidad:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[
                styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled,
              ]}
              onPress={() => quantity > 1 && setQuantity((q) => q - 1)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity((q) => q + 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.addToCartButton, !selectedUnit && product.units && styles.addToCartButtonDisabled,
        ]}
        onPress={handleAddToCart}
        disabled={!selectedUnit && product.units}
      >
        <Ionicons name="cart-outline" size={24} color={COLOR.white} />
        <Text style={styles.addToCartButtonText}>
          Agregar al carrito - $
          {(
            (selectedUnit && product.units
              ? product.units.find((u) => u.type === selectedUnit).price
              : product.price) * quantity
          ).toFixed(2)}
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
  unitsContainer: {
    marginBottom: 16,
  },
  unitsGrid: {
    flexDirection: 'column',
  },
  unitButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLOR.gray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: COLOR.orange,
    borderColor: COLOR.orange,
  },
  unitText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: COLOR.darkGray,
  },
  unitPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: COLOR.darkGray,
  },
  selectedOptionText: {
    color: COLOR.white,
  },
  specificationsContainer: {
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
  materialsContainer: {
    marginBottom: 16,
  },
  materialText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: COLOR.darkGray,
    marginBottom: 4,
  },
  quantityContainer: {
    marginBottom: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    backgroundColor: COLOR.lightGray,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  quantityButtonDisabled: {
    backgroundColor: COLOR.gray,
    opacity: 0.7,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLOR.darkGray,
  },
  quantityValue: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
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
    marginTop: 10,
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

export default ProductHardwareDetail;
