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

const BusinessPharmacyContent = ({ business, sector, scrollY, handleScroll, handleViewableItemsChanged, }) => {
  const { cart, addToCart } = useCart();
  const cartItems = cart[business.businessId]?.items || {};
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = useCallback(
    (product, qty = 1) => {
      addToCart(business.businessId, product.id, qty, business);
      setQuantity(1);
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

          {item.requiresPrescription && (
            <View style={styles.prescriptionBadge}>
              <Text style={styles.prescriptionText}>Requiere receta</Text>
            </View>
          )}

          {item.details && (
            <View style={styles.detailsList}>
              <Text style={styles.detailsTitle}>Detalles del medicamento:</Text>
              {item.details.map((detail, index) => (
                <Text key={index} style={styles.detailItem}>
                  • {detail}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => quantity > 1 && setQuantity((q) => q - 1)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity((q) => q + 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddToCart(item, quantity)}
          >
            <Text style={styles.addButtonText}>Agregar al carrito</Text>
          </TouchableOpacity>

          {item.warnings && (
            <View style={styles.warningsContainer}>
              <Text style={styles.warningsTitle}>Advertencias:</Text>
              {item.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  ⚠️ {warning}
                </Text>
              ))}
            </View>
          )}
        </View>

        {cartItems[item.id] > 0 && (
          <View style={styles.cartQuantityBadge}>
            <Text style={styles.cartQuantityText}>{cartItems[item.id]}</Text>
          </View>
        )}
      </View>
    ),
    [quantity, cartItems, handleAddToCart],
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
          quantity={quantity}
          onQuantityChange={setQuantity}
          onAddToCart={handleAddToCart}
          currentProductQuantity={cartItems[selectedProduct.id] || 0}
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
  prescriptionBadge: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  prescriptionText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
  },
  detailsList: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  detailItem: {
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
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  warningsContainer: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
  },
  warningsTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#e65100',
    marginBottom: 8,
  },
  warningText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#e65100',
    marginBottom: 4,
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

export default BusinessPharmacyContent;
