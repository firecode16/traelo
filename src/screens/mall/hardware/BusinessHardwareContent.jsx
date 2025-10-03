import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useCart } from '../../../contexts/CartContext';
import ImageWithFallback from '../../../components/ImageWithFallback';
import ProductDetail from '../shared/ProductDetail';
import { COLOR } from '../../../constants/Color';

const AnimatedFlatList = Animated.createAnimatedComponent(Animated.FlatList);

const BusinessHardwareContent = ({ business, sector, scrollY, handleScroll, handleViewableItemsChanged, }) => {
  const { cart, addToCart } = useCart();
  const cartItems = cart[business.businessId]?.items || {};
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = useCallback(
    (product, unit, qty = 1) => {
      const productId = unit ? `${product.id}-${unit}` : product.id;
      addToCart(business.businessId, productId, qty, business);
      setSelectedUnit(null);
      setQuantity(1);
    },
    [business, addToCart],
  );

  const renderProductItem = useCallback(
    ({ item }) => (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => setSelectedProduct(item)} activeOpacity={0.9}>
          <ImageWithFallback
            src={item.imageUrl}
            style={styles.productImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.productPrice}>
            💲{item.price}
            {item.unit ? `/${item.unit}` : ''}
          </Text>

          {item.units && (
            <View style={styles.unitsContainer}>
              <Text style={styles.unitsTitle}>Unidades de venta:</Text>
              <View style={styles.unitsGrid}>
                {item.units.map((unit) => (
                  <TouchableOpacity
                    key={unit.type}
                    style={[
                      styles.unitButton, selectedUnit === unit.type && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedUnit(unit.type)}
                  >
                    <Text
                      style={[
                        styles.unitText, selectedUnit === unit.type && styles.selectedOptionText,
                      ]}
                    >
                      {unit.type} ({unit.quantity} {item.unit})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {item.specifications && (
            <View style={styles.specsList}>
              {item.specifications.map((spec, index) => (
                <Text key={index} style={styles.specItem}>
                  • {spec}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.quantityButton} onPress={() => quantity > 1 && setQuantity((q) => q - 1)}>
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantity((q) => q + 1)}>
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton, !selectedUnit && item.units && styles.addButtonDisabled,
            ]}
            onPress={() => handleAddToCart(item, selectedUnit, quantity)}
            disabled={!selectedUnit && item.units}
          >
            <Text style={styles.addButtonText}>Agregar al carrito</Text>
          </TouchableOpacity>
        </View>

        {cartItems[selectedUnit ? `${item.id}-${selectedUnit}` : item.id] > 0 && (
          <View style={styles.cartQuantityBadge}>
            <Text style={styles.cartQuantityText}>
              {cartItems[selectedUnit ? `${item.id}-${selectedUnit}` : item.id]}
            </Text>
          </View>
        )}
      </View>
    ),
    [selectedUnit, quantity, cartItems, handleAddToCart],
  );

  return (
    <>
      <AnimatedFlatList
        data={business.products}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        contentContainerStyle={{
          paddingTop: 320,
          paddingBottom: 90,
          paddingHorizontal: 10,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true, listener: handleScroll },
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
          waitForInteraction: true,
        }}
      />

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          isVisible={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          selectedUnit={selectedUnit}
          onUnitSelect={setSelectedUnit}
          quantity={quantity}
          onQuantityChange={setQuantity}
          onAddToCart={handleAddToCart}
          currentProductQuantity={
            cartItems[selectedUnit ? `${selectedProduct.id}-${selectedUnit}` : selectedProduct.id] || 0
          }
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  productName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  productDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#2e7d32',
    marginBottom: 12,
  },
  unitsContainer: {
    marginBottom: 16,
  },
  unitsTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  unitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: COLOR.orange,
    borderColor: COLOR.orange,
  },
  unitText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
  },
  selectedOptionText: {
    color: '#fff',
  },
  specsList: {
    marginBottom: 16,
  },
  specItem: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quantityButton: {
    backgroundColor: COLOR.orange,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    marginHorizontal: 20,
  },
  addButton: {
    backgroundColor: COLOR.orange,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ddd',
  },
  addButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  cartQuantityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLOR.orange,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cartQuantityText: {
    color: COLOR.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default BusinessHardwareContent;
