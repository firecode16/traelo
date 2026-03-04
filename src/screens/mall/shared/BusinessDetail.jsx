import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableHighlight,
  Share,
  TouchableOpacity,
  Platform,
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

const APP_STORE_LINK = Platform.OS === 'ios' ? 'https://apps.apple.com/app/idTU_APP_ID' : 'https://play.google.com/store/apps/details?id=com.company.app';

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
  
  const getCartItems = () => {
    try {
      if (!business || !business.businessId) return {};
      const cartData = cart[business.businessId];
      if (!cartData || !cartData.items) return {};
      
      // Verificar que items sea un objeto
      return typeof cartData.items === 'object' && !Array.isArray(cartData.items) ? cartData.items : {};
    } catch (error) {
      console.warn('Error getting cart items:', error);
      return {};
    }
  };

  const cartItems = getCartItems();
  
  const [visibleItems, setVisibleItems] = useState(new Set());
  const { handleScroll, isScrolling, cleanup } = useScrollHandler();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => cleanup, []);

  useEffect(() => {
    if (!business) return;
    
    if (!isScrolling && visibleItems.size > 0) {
      const preloadImagesAsync = async () => {
        const itemsToPreload = [];
        
        // Recolecta todas las URLs primero
        for (const itemId of visibleItems) {
          let item = null;
          
          // Buscar en productos
          if (business.products && Array.isArray(business.products)) {
            item = business.products.find(p => p.productId === itemId || p.id === itemId);
          }
          
          if (item?.imageUrl) {
            itemsToPreload.push(item.imageUrl);
          }
        }
        
        // Precargar todas las imágenes
        for (const url of itemsToPreload) {
          await preloadImage(url);
        }
      };
      
      preloadImagesAsync();
    }
  }, [visibleItems, isScrolling, business]);

  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    const newVisibleItems = new Set();
    viewableItems.forEach(({ item }) => {
      if (item?.productId || item?.id) {
        newVisibleItems.add(item.productId || item.id);
      }
    });
    setVisibleItems(newVisibleItems);
  }, []);

  const handleShareBusiness = async () => {
    try {
      if (!business) {
        console.error('No hay información del negocio para compartir');
        return;
      }

      // Crear mensaje personalizado para compartir
      const shareMessage = `🏪 **${business.fullName || 'Negocio'}**\n\n` +
        `📍 ${business.address || 'Ubicación no disponible'}\n\n` +
        `📱 **¿Qué ofrece?**\n` +
        `✅ Catálogo completo de productos\n` +
        `✅ Pedidos en línea\n` +
        `✅ Entrega rápida\n\n` +
        `🌟 **Descarga TRAELO para ver:**\n` +
        `• Menú completo y precios\n` +
        `• Promociones exclusivas\n` +
        `• Realizar pedidos fácilmente\n\n` +
        `📲 Descarga la app: ${APP_STORE_LINK}\n\n` +
        `#${sector || 'negocio'} #TRAELO #CentroComercial #ComprasLocales`;

      const shareOptions = {
        message: shareMessage,
        title: `¡Mira ${business.fullName || 'este negocio'} en TRAELO!`,
        url: APP_STORE_LINK,
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Compartido con:', result.activityType);
        }
        console.log('Negocio compartido exitosamente');
      } else if (result.action === Share.dismissedAction) {
        console.log('Compartir cancelado');
      }
    } catch (error) {
      console.error('Error al compartir el negocio:', error);
    }
  };

  const getTotalItems = (items) => {
    try {
      if (!items || typeof items !== 'object') {
        return 0;
      }
      
      if (Array.isArray(items)) {
        return 0;
      }
      
      // Verificar que items tenga propiedades enumerables
      const values = Object.values(items);
      
      // Si Object.values devuelve undefined o null
      if (!values) {
        return 0;
      }
      
      // Asegurar que values sea un array
      if (!Array.isArray(values)) {
        return 0;
      }
      
      // Reducción segura
      return values.reduce((total, quantity) => {
        const num = Number(quantity);
        return total + (isNaN(num) ? 0 : num);
      }, 0);
      
    } catch (error) {
      console.warn('Error in getTotalItems:', error, 'items:', items);
      return 0;
    }
  };

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

  // Si no hay negocio, mostrar error inmediatamente
  if (!business) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color={COLOR.gray} />
          <Text style={styles.errorText}>No se pudo cargar el negocio</Text>
        </View>
      </View>
    );
  }

  // Calcular total solo una vez
  let totalCartItems = 0;
  try {
    totalCartItems = getTotalItems(cartItems);
  } catch (error) {
    console.error('Fatal error calculating cart items:', error);
    totalCartItems = 0;
  }

  return (
    <View style={styles.container}>
      {/* Header con imagen y botón compartir */}
      <Animated.View
        style={[styles.headerContainer, { transform: [{ translateY: headerTranslate }] }]}
      >
        <Animated.View style={{ transform: [{ scale: imageScale }] }}>
          <ImageWithFallback
            src={business.logoUrl}
            style={styles.coverImage}
            resizeMode="cover"
            fallbackComponent={
              <View style={[styles.coverImage, styles.fallbackImage]}>
                <Ionicons name="business" size={60} color={COLOR.gray} />
              </View>
            }
          />

          {/* Botón compartir en el header */}
          <TouchableOpacity
            style={styles.shareHeaderButton}
            onPress={handleShareBusiness}
            activeOpacity={0.8}
          >
            <View style={styles.shareHeaderButtonIcon}>
              <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Info Container */}
      <Animated.View
        style={[
          styles.infoContainer,
          {
            transform: [{ translateY: infoTranslate }], opacity: infoOpacity
          }
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.businessNameContainer}>
            <Ionicons name="business-outline" size={20} color="#555" style={styles.icon} />
            <Text style={styles.businessName} numberOfLines={1}>
              {business.fullName || 'Negocio sin nombre'}
            </Text>
          </View>

          <View style={styles.statusContainer}>
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

        {business.description && (
          <View style={styles.rowInfo}>
            <Ionicons name="information-circle-outline" size={20} color="#555" style={styles.icon} />
            <Text style={styles.businessDescription} numberOfLines={2}>
              {business.description}
            </Text>
          </View>
        )}

        {business.address && (
          <View style={styles.rowInfo}>
            <Ionicons name="location-outline" size={20} color="#555" />
            <Text style={styles.addressText} numberOfLines={1}>
              {business.address}
            </Text>
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

      {/* Botón flotante de carrito - Solo si hay items */}
      {totalCartItems > 0 && (
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
                {totalCartItems}
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
  fallbackImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
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
  businessNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  businessName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    flex: 1,
  },
  businessDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
  },
  addressText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 6,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: COLOR.gray,
    marginTop: 16,
    textAlign: 'center',
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

  shareHeaderButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 16,
    zIndex: 20,
  },
  shareHeaderButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    // Efecto de brillo sutil
    overflow: 'hidden',
  },
  // Efecto de brillo interno (pseudo-elemento)
  shareHeaderButtonIconInner: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ rotate: '45deg' }],
  },
});

export default BusinessDetail;
