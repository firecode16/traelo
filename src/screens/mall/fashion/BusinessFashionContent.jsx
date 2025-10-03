import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR } from '../../../constants/Color';
import ImageWithFallback from '../../../components/ImageWithFallback';
import ProductDetail from '../shared/ProductDetail';
import { useCart } from '../../../contexts/CartContext';

const AnimatedFlatList = Animated.createAnimatedComponent(Animated.FlatList);

const BusinessFashionContent = ({ business, sector, scrollY, handleScroll, handleViewableItemsChanged, }) => {
  const { cart, addToCart } = useCart();
  const cartItems = cart[business.businessId]?.items || {};
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const handleAddToCart = useCallback(
    (product, variant) => {
      const variantId = `${product.id}-${variant.size}-${variant.color}`;
      addToCart(business.businessId, variantId, 1, business);
      setSelectedSize(null);
      setSelectedColor(null);
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
          <Text style={styles.productPrice}>💲{item.price}</Text>

          <View style={styles.variantsContainer}>
            {/* Selector de tallas */}
            <View style={styles.sizesContainer}>
              {item.sizes?.map((size) => (
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

            {/* Selector de colores */}
            <View style={styles.colorsContainer}>
              {item.colors?.map((color) => (
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
              styles.addButton,
              (!selectedSize || !selectedColor) && styles.addButtonDisabled,
            ]}
            onPress={() =>
              handleAddToCart(item, {
                size: selectedSize,
                color: selectedColor,
              })
            }
            disabled={!selectedSize || !selectedColor}
          >
            <Text style={styles.addButtonText}>Agregar al carrito</Text>
          </TouchableOpacity>
        </View>

        {cartItems[`${item.id}-${selectedSize}-${selectedColor}`] > 0 && (
          <View style={styles.cartQuantityBadge}>
            <Text style={styles.cartQuantityText}>
              {cartItems[`${item.id}-${selectedSize}-${selectedColor}`]}
            </Text>
          </View>
        )}
      </View>
    ),
    [selectedSize, selectedColor, cartItems, handleAddToCart],
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
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          onSizeSelect={setSelectedSize}
          onColorSelect={setSelectedColor}
          onAddToCart={handleAddToCart}
          currentProductQuantity={
            cartItems[`${selectedProduct.id}-${selectedSize}-${selectedColor}`] || 0
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
  variantsContainer: {
    marginBottom: 16,
  },
  sizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  sizeButton: {
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
  sizeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
  },
  selectedOptionText: {
    color: '#fff',
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedColorButton: {
    borderWidth: 2,
    borderColor: COLOR.orange,
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

export default BusinessFashionContent;
