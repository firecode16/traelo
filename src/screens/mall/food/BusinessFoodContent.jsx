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

const BusinessFoodContent = ({ business, sector, scrollY, handleScroll, handleViewableItemsChanged }) => {
  const { cart, addToCart } = useCart();
  const cartItems = cart[business.businessId]?.items || {};
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleAddToCart = useCallback(
    (product, quantity) => {
      addToCart(business.businessId, product.menuId, quantity, business);
    },
    [business, addToCart],
  );

  const handleOpenProduct = useCallback((menuItem) => {
    setSelectedProduct(menuItem);
  }, []);

  const handleCloseProduct = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const groupedMenus = business.menus.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const renderCategoryItem = useCallback(
    ({ item: [category, items] }) => (
      <View style={styles.categoryContainer} key={category}>
        <Text style={styles.categoryTitle}>{category}</Text>
        {items.map((menuItem) => (
          <View key={menuItem.menuId} style={styles.card}>
            <TouchableOpacity onPress={() => handleOpenProduct(menuItem)} activeOpacity={0.9}>
              <ImageWithFallback
                src={menuItem.imageUrl}
                style={styles.productImage}
                resizeMode="cover"
              />
            </TouchableOpacity>

            <View style={styles.cardContent}>
              <Text style={styles.menuName} numberOfLines={1} ellipsizeMode="tail">
                {menuItem.name}
              </Text>
              <Text style={styles.menuDescription} numberOfLines={2} ellipsizeMode="tail">
                {menuItem.description}
              </Text>
              <Text style={styles.menuPrice}>💲{menuItem.price}</Text>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleOpenProduct(menuItem)}
            >
              <Ionicons name="add-circle" size={32} color={COLOR.green} />
            </TouchableOpacity>
            {cartItems[menuItem.menuId] > 0 && (
              <View style={styles.cartQuantityBadge}>
                <Text style={styles.cartQuantityText}>
                  {cartItems[menuItem.menuId]}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    ),
    [handleOpenProduct, cartItems],
  );

  return (
    <>
      <AnimatedFlatList
        data={Object.entries(groupedMenus)}
        keyExtractor={([category]) => category}
        renderItem={renderCategoryItem}
        contentContainerStyle={{
          paddingTop: 320, // HEADER_MAX_HEIGHT + INFO_CONTAINER_HEIGHT
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
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        initialNumToRender={10}
      />

      {/* Modal de producto */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          sector={sector}
          isVisible={!!selectedProduct}
          onClose={handleCloseProduct}
          onAddToCart={handleAddToCart}
          currentProductQuantity={cartItems[selectedProduct?.menuId] || 0}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  categoryContainer: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    marginBottom: 6,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 100,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  menuName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#555',
  },
  menuDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#555',
    marginVertical: 2,
  },
  menuPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#2e7d32',
    marginTop: 2,
  },
  addButton: {
    position: 'absolute',
    top: 4,
    right: 7,
  },
  cartQuantityBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
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

export default BusinessFoodContent;
