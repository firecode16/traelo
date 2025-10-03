import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableHighlight,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR } from '../../../constants/Color';
import ImageWithFallback from '../../../components/ImageWithFallback';
import { preloadImage } from '../../../components/ImageCache';
import useScrollHandler from '../../../components/HandleScroll';
import { useCart } from '../../../contexts/CartContext';

import BusinessFoodContent from '../food/BusinessFoodContent';
import BusinessFashionContent from '../fashion/BusinessFashionContent';
import BusinessTechnologyContent from '../technology/BusinessTechnologyContent';
import BusinessHardwareContent from '../hardware/BusinessHardwareContent';
import BusinessPharmacyContent from '../pharmacy/BusinessPharmacyContent';

const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 60;
const INFO_CONTAINER_HEIGHT = 120;

const sectorComponents = {
  food: BusinessFoodContent,
  fashion: BusinessFashionContent,
  technology: BusinessTechnologyContent,
  hardware: BusinessHardwareContent,
  pharmacy: BusinessPharmacyContent,
};

const BusinessDetail = ({ route, navigation }) => {
  const { business, sector } = route.params ?? {};
  const { cart } = useCart();
  const cartItems = cart[business.businessId]?.items || {};
  const [visibleItems, setVisibleItems] = useState(new Set());
  const { handleScroll, isScrolling, cleanup } = useScrollHandler();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => cleanup, []);

  useEffect(() => {
    if (!isScrolling && visibleItems.size > 0) {
      const preloadImagesAsync = async () => {
        for (const itemId of visibleItems) {
          const item =
            business.menus?.find((menu) => menu.menuId === itemId) ||
            business.products?.find((product) => product.id === itemId) ||
            business.medicines?.find((medicine) => medicine.id === itemId);
            
          if (item?.imageUrl) {
            await preloadImage(item.imageUrl);
          }
        }
      };
      preloadImagesAsync();
    }
  }, [visibleItems, isScrolling, business]);

  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    const newVisibleItems = new Set();
    viewableItems.forEach(({ item }) => {
      if (item?.menuId || item?.id) newVisibleItems.add(item.menuId || item.id);
    });
    setVisibleItems(newVisibleItems);
  }, []);

  const getTotalItems = useCallback((items) => {
    if (!items) return 0;
    return Object.values(items).reduce(
      (total, quantity) => total + quantity,
      0,
    );
  }, []);

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [0, -(HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT)],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0, HEADER_MAX_HEIGHT],
    outputRange: [1.2, 1, 1],
    extrapolate: 'clamp',
  });

  const infoTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT],
    outputRange: [0, -HEADER_MAX_HEIGHT / 2],
    extrapolate: 'clamp',
  });

  const infoOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT / 2, HEADER_MAX_HEIGHT],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const SectorContent = sectorComponents[sector];

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[styles.headerContainer, { transform: [{ translateY: headerTranslate }] }]}
      >
        <Animated.View style={{ transform: [{ scale: imageScale }] }}>
          <ImageWithFallback
            src={business.logoUrl}
            style={styles.coverImage}
            resizeMode="cover"
          />
        </Animated.View>
      </Animated.View>

      {/* Info */}
      <Animated.View
        style={[styles.infoContainer, { transform: [{ translateY: infoTranslate }], opacity: infoOpacity }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="business-outline" size={20} color="#555" style={styles.icon} />
            <Text style={styles.businessName}>{business.fullName}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={business.scheduler?.isActive ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={business.scheduler?.isActive ? '#4CAF50' : '#f44336'}
            />
            <Text style={styles.statusText}>
              {business.scheduler?.isActive ? ' Abierto' : ' Cerrado'}
            </Text>
          </View>
        </View>

        <View style={styles.rowInfo}>
          <Ionicons name="information-circle-outline" size={20} color="#555" style={styles.icon} />
          <Text style={styles.businessDescription}>{business.description}</Text>
        </View>

        {business.address && (
          <View style={styles.rowInfo}>
            <Ionicons name="location-outline" size={20} color="#555" />
            <Text style={styles.addressText}> {business.address}</Text>
          </View>
        )}
      </Animated.View>

      {/* Contenido específico del sector */}
      {SectorContent ? (
        <SectorContent
          business={business}
          sector={sector}
          scrollY={scrollY}
          handleScroll={handleScroll}
          handleViewableItemsChanged={handleViewableItemsChanged}
          navigation={navigation}
        />
      ) : (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>
            Este tipo de negocio aún no está soportado
          </Text>
        </View>
      )}

      {/* Botón flotante de carrito */}
      {getTotalItems(cartItems) > 0 && (
        <TouchableHighlight
          style={styles.floatingCartButton}
          underlayColor="#ff7f07ff"
          onPress={() => {
            navigation.navigate('ShoppingCart', {
              businessId: business.businessId,
              sector: sector,
              cartItems: cartItems,
              business: business
            });
          }}
        >
          <View style={styles.floatingCartButtonContent}>
            <Ionicons name="cart-outline" size={28} color="#fff" />
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>
                {getTotalItems(cartItems)}
              </Text>
            </View>
          </View>
        </TouchableHighlight>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.lightGray,
  },
  headerContainer: {
    position: 'absolute',
    width: '100%',
    zIndex: 1,
  },
  coverImage: {
    width: '100%',
    height: HEADER_MAX_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLOR.lightGray,
    elevation: 2,
  },
  infoContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  businessName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    marginBottom: 2,
  },
  businessDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  statusText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
  },
  addressText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#555',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 6,
    bottom: 2,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: HEADER_MAX_HEIGHT + INFO_CONTAINER_HEIGHT,
  },
  fallbackText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#666',
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: COLOR.orange,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 50,
  },
  floatingCartButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartBadge: {
    position: 'absolute',
    top: -11,
    right: -5,
    backgroundColor: COLOR.green,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  floatingCartBadgeText: {
    color: COLOR.white,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
  },
});

export default BusinessDetail;
