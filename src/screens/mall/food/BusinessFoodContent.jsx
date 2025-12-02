import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR } from '../../../constants/Color';
import ImageWithFallback from '../../../components/ImageWithFallback';
import ProductFoodDetail from '../food/ProductFoodDetail';
import { useCart } from '../../../contexts/CartContext';

const AnimatedFlatList = Animated.createAnimatedComponent(Animated.FlatList);

// Mapeo de categorías a nombres legibles
const CATEGORY_LABELS = {
  'pizza': 'Pizzas',
  'burgers': 'Hamburguesas',
  'tacos': 'Tacos',
  'chicken': 'Pollos',
  'salads': 'Ensaladas',
  'pasta': 'Pastas',
  'snacks': 'Antojitos',
  'main_courses': 'Platos Fuertes',
  'seafood': 'Mariscos',
  'drinks': 'Bebidas',
  'desserts': 'Postres',
  'bakery': 'Panadería',
  'meats': 'Carnes',
};

const BusinessFoodContent = ({ business, sector, scrollY, handleScroll, handleViewableItemsChanged }) => {
  const { cart, addToCart } = useCart();
  const cartItems = cart[business.businessId]?.items || {};
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleAddToCart = useCallback(
    (product, quantity) => {
      addToCart(business.businessId, product.productId, quantity, business);
    },
    [business, addToCart],
  );

  const handleOpenProduct = useCallback((product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  }, []);

  const handleCloseProduct = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => {
      setSelectedProduct(null);
    }, 300); // Pequeño delay para la animación
  }, []);

  // Asegurar que products exista y sea un array
  const products = business.products || [];
  
  // Agrupar productos por categoría
  const groupedProducts = products.reduce((acc, product) => {
    if (!product.category) return acc;
    
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  // Obtine el nombre legible de las categorías
  const getCategoryLabel = (category) => {
    // Convertir a minúsculas para coincidencia insensible a mayúsculas/minúsculas
    const lowerCategory = category.toLowerCase();
    return CATEGORY_LABELS[lowerCategory] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Si no existe, capitalizar la primera letra de cada palabra
  };

  const renderCategoryItem = useCallback(
    ({ item: [category, items] }) => (
      <View style={styles.categoryContainer} key={category}>
        <Text style={styles.categoryTitle}>
          {getCategoryLabel(category)}
        </Text>
        {items.map((product) => (
          <View key={product.productId} style={styles.card}>
            <TouchableOpacity
              onPress={() => handleOpenProduct(product)}
              activeOpacity={0.9}
              style={styles.imageTouchable}
            >
              <ImageWithFallback
                src={product.imageUrl}
                style={styles.productImage}
                resizeMode="cover"
              />
            </TouchableOpacity>

            <View style={styles.cardContent}>
              <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
                {product.name}
              </Text>
              <Text style={styles.productDescription} numberOfLines={2} ellipsizeMode="tail">
                {product.description}
              </Text>
              <Text style={styles.productPrice}>💲{product.price}</Text>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleOpenProduct(product)}
            >
              <Ionicons name="add-circle" size={32} color={COLOR.green} />
            </TouchableOpacity>
            
            {cartItems[product.productId] > 0 && (
              <View style={styles.cartQuantityBadge}>
                <Text style={styles.cartQuantityText}>
                  {cartItems[product.productId]}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    ),
    [handleOpenProduct, cartItems],
  );

  // Si no hay productos, mostrar mensaje
  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay productos disponibles</Text>
      </View>
    );
  }

  // Ordenar las categorías según un orden específico para mejor presentación
  const sortedCategories = Object.entries(groupedProducts).sort((a, b) => {
    const order = [
      'main_courses', 'pizza', 'burgers', 'tacos', 'chicken',
      'seafood', 'meats', 'salads', 'pasta', 'snacks',
      'bakery', 'desserts', 'drinks'
    ];
    
    const indexA = order.indexOf(a[0]);
    const indexB = order.indexOf(b[0]);
    
    // Si ambas categorías están en el orden definido, ordenar por ese índice
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // Si solo una está en el orden, poner primero la que está en el orden
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // Si ninguna está en el orden, ordenar alfabéticamente
    return a[0].localeCompare(b[0]);
  });

  return (
    <>
      <AnimatedFlatList
        data={sortedCategories}
        keyExtractor={([category]) => category}
        renderItem={renderCategoryItem}
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
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        initialNumToRender={10}
      />

      {/* Modal del producto */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseProduct}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedProduct && (
              <ProductFoodDetail
                product={selectedProduct}
                onClose={handleCloseProduct}
                onAddToCart={handleAddToCart}
                currentProductQuantity={cartItems[selectedProduct.productId] || 0}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 320,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#666',
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    marginBottom: 6,
    color: COLOR.darkGray,
    textTransform: 'capitalize',
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
  imageTouchable: {
    width: 100,
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
  productName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#555',
  },
  productDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#555',
    marginVertical: 2,
  },
  productPrice: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLOR.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    overflow: 'hidden',
  },
});

export default BusinessFoodContent;
