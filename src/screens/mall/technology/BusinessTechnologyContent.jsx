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

const BusinessTechnologyContent = ({ business, sector, scrollY, handleScroll, handleViewableItemsChanged }) => {
  const { cart, addToCart } = useCart();
  const cartItems = cart[business.businessId]?.items || {};
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedWarranty, setSelectedWarranty] = useState(null);

  const handleAddToCart = useCallback(
    (product, warranty) => {
      const productId = warranty ? `${product.id}-${warranty}` : product.id;
      const finalPrice = warranty ? product.price + product.warrantyOptions.find((w) => w.period === warranty).price : product.price;

      addToCart(business.businessId, productId, 1, business);
      setSelectedWarranty(null);
    },
    [business, addToCart],
  );

  const renderProductItem = useCallback(
    ({ item }) => (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => setSelectedProduct(item)}
          activeOpacity={0.9}
        >
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

          {item.warrantyOptions && (
            <View style={styles.warrantyContainer}>
              <Text style={styles.warrantyTitle}>Garantía:</Text>
              {item.warrantyOptions.map((warranty) => (
                <TouchableOpacity
                  key={warranty.period}
                  style={[
                    styles.warrantyButton, selectedWarranty === warranty.period && styles.selectedOption,
                  ]}
                  onPress={() => setSelectedWarranty(warranty.period)}
                >
                  <Text
                    style={[
                      styles.warrantyText, selectedWarranty === warranty.period && styles.selectedOptionText,
                    ]}
                  >
                    {warranty.period} (+💲{warranty.price})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.specsList}>
            {item.specs?.map((spec, index) => (
              <Text key={index} style={styles.specItem}>
                • {spec}
              </Text>
            ))}
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddToCart(item, selectedWarranty)}
          >
            <Text style={styles.addButtonText}>Agregar al carrito</Text>
          </TouchableOpacity>
        </View>

        {cartItems[
          selectedWarranty ? `${item.id}-${selectedWarranty}` : item.id
        ] > 0 && (
          <View style={styles.cartQuantityBadge}>
            <Text style={styles.cartQuantityText}>
              {
                cartItems[selectedWarranty ? `${item.id}-${selectedWarranty}` : item.id]
              }
            </Text>
          </View>
        )}
      </View>
    ),
    [selectedWarranty, cartItems, handleAddToCart],
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
          selectedWarranty={selectedWarranty}
          onWarrantySelect={setSelectedWarranty}
          onAddToCart={handleAddToCart}
          currentProductQuantity={
            cartItems[selectedWarranty ? `${selectedProduct.id}-${selectedWarranty}` : selectedProduct.id] || 0
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
  warrantyContainer: {
    marginBottom: 16,
  },
  warrantyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  warrantyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: COLOR.orange,
    borderColor: COLOR.orange,
  },
  warrantyText: {
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
  addButton: {
    backgroundColor: COLOR.orange,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
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

export default BusinessTechnologyContent;
