import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableHighlight,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLOR } from '../../../constants/Color';
import { API } from '../../../constants/ApiConfig';
import { getAllBusinesses } from '../../../services/BusinessService';
import SearchBar from '../../../components/SearchBar';
import ImageWithFallback from '../../../components/ImageWithFallback';
import { preloadImage } from '../../../components/ImageCache';
import useScrollHandler from '../../../components/HandleScroll';
import { useLocation } from '../../../contexts/LocationContext';

const FoodAndDrinkScreen = ({ navigation, route }) => {
  const { sector } = route.params || {};
  const {
    userLocation,
    isLoading: locationLoading,
    getCurrentLocation,
    locationError: contextLocationError,
  } = useLocation();

  const [businesses, setBusinesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [zoneError, setZoneError] = useState(null);

  const { handleScroll, isScrolling, cleanup } = useScrollHandler();
  const PAGE_SIZE = 10;

  // Cargar negocios automáticamente cuando hay ubicación
  useEffect(() => {
    console.log('🚀 mounted - sector:', sector);

    if (userLocation) {
      loadBusinesses(0, true);
    } else {
      // Si no hay ubicación, obtenerla automáticamente
      getCurrentLocationAutomatically();
    }

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [sector, userLocation]);

  const getCurrentLocationAutomatically = async () => {
    try {
      console.log('📍 Obteniendo ubicación automáticamente...');
      await getCurrentLocation();
    } catch (error) {
      console.error('Error obteniendo ubicación automática:', error);
      setZoneError('No se pudo obtener tu ubicación automáticamente');
      // Cargar negocios sin filtro de ubicación como fallback
      loadBusinesses(0, true);
    }
  };

  const loadBusinesses = async (pageNumber = 0, refresh = false) => {
    if (loading) return;
    setLoading(true);

    try {
      // 🎯 Usar GPS cuando esté disponible
      const filters = {};

      if (userLocation) {
        filters.lat = userLocation.latitude;
        filters.lng = userLocation.longitude;
        console.log(`🎯 Filtrando por GPS automático: (${filters.lat}, ${filters.lng})`,);
      } else {
        console.log('🎯 Sin filtro de ubicación - mostrando todos los negocios',);
      }

      const data = await getAllBusinesses(sector, pageNumber, PAGE_SIZE, filters);

      if (!data || !data.content) {
        console.error('❌ Data o data.content es undefined');
        setBusinesses([]);
        return;
      }

      console.log(`📦 Datos recibidos: ${data.content.length} negocios`);

      // Solo filtrar por productos
      const businessesWithUrls = data.content
        .filter((business) => {
          if (!business) {
            console.log('⚠️ Business undefined en data.content');
            return false;
          }

          if (!business.products || !Array.isArray(business.products) || business.products.length === 0) {
            console.log(`⚠️ Negocio sin productos: ${business.fullName}`);
            return false;
          }

          return true;
        })
        .map((business) => {
          const logoUrl = `${API.BUSINESS.GET_BUSINESS_LOGO_BY_ID(business.businessId)}?v=${business.updatedAt}`;

          const productsWithImages = business.products.map((product) => ({
            ...product,
            imageUrl: `${API.PRODUCTS.GET_IMAGE_BY_PRODUCT(product.productId)}?v=${product.updatedAt}`,
          }));

          return { ...business, logoUrl, products: productsWithImages };
        });

      console.log(`✅ Negocios disponibles: ${businessesWithUrls.length}`);

      if (refresh) {
        setBusinesses(businessesWithUrls);
      } else {
        setBusinesses((prev) => [...prev, ...businessesWithUrls]);
      }

      setPage(data.page || 0);
      setHasMore(!data.last);
      setZoneError(null);

      // Prefetch imágenes
      setTimeout(() => {
        const urls = [];
        businessesWithUrls.forEach((b) => {
          if (b.logoUrl) urls.push(b.logoUrl);
          if (b.products) {
            b.products.forEach((p) => {
              if (p.imageUrl) urls.push(p.imageUrl);
            });
          }
        });
        if (urls.length > 0) {
          Promise.all(urls.map((u) => preloadImage(u))).catch(() => {});
        }
      }, 0);
    } catch (error) {
      console.error('Error loading businesses:', error);
      setZoneError('Error cargando negocios. Por favor, intenta de nuevo.');
      setBusinesses([]);
    } finally {
      setLoading(false);
      if (refresh) setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Al refrescar, también actualizar la ubicación
    getCurrentLocationAutomatically();
  }, [userLocation]);

  const handleLoadMore = () => {
    if (hasMore && !loading && !isScrolling) {
      loadBusinesses(page + 1);
    }
  };

  const filteredBusinesses = businesses.filter((business) => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    const productItems = business.products || [];

    const matchesProduct = productItems.some(
      (item) =>
        item.name?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term),
    );

    return (
      business.fullName?.toLowerCase().includes(term) ||
      business.description?.toLowerCase().includes(term) ||
      business.category?.toLowerCase().includes(term) ||
      matchesProduct
    );
  });

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>
        {userLocation ? 'No hay negocios cerca de tu ubicación actual' : 'No se pudo determinar tu ubicación'}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={getCurrentLocationAutomatically}
      >
        <Text style={styles.retryButtonText}>Reintentar ubicación</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBusinessCard = ({ item: business }) => (
    <TouchableHighlight
      key={business.businessId}
      style={styles.businessCard}
      underlayColor="#e0e0e0"
      onPress={() => navigation.navigate('BusinessDetail', { business, sector })}
    >
      <View>
        <ImageWithFallback src={business.logoUrl} style={styles.logo} />

        <View style={styles.headerRow}>
          <Text style={styles.businessName}>{business.fullName}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: business.scheduler?.isActive ? '#4CAF50' : '#F44336',
              },
            ]}
          >
            <Text style={styles.statusText}>
              {business.scheduler?.isActive ? 'Abierto' : 'Cerrado'}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{business.description}</Text>

        {/* Mostrar productos */}
        {business.products.slice(0, 2).map((product) => (
          <View key={product.productId} style={styles.productItem}>
            <ImageWithFallback
              src={product.imageUrl}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDescription}>
                {product.description}
              </Text>
              <Text style={styles.productPrice}>${product.price}</Text>
            </View>
          </View>
        ))}

        {business.products.length > 2 && (
          <Text style={styles.moreText}>
            ... y {business.products.length - 2} productos más
          </Text>
        )}
      </View>
    </TouchableHighlight>
  );

  const LocationHeader = () => (
    <View style={styles.locationHeader}>
      <View style={styles.locationRow}>
        <Ionicons name="location" size={18} color={COLOR.green} />
        <Text style={styles.locationText}>
          {businesses.length} negocio(s) disponible(s), cerca de ti
        </Text>
      </View>

      {(zoneError || contextLocationError) && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={14} color={COLOR.orange} />
          <Text style={styles.zoneError}>
            {zoneError || contextLocationError}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading && businesses.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLOR.green} />
        <Text style={styles.loadingText}>
          {userLocation ? 'Cargando negocios...' : 'Obteniendo tu ubicación...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Buscar negocios, productos..."
        onClear={() => setSearchTerm('')}
      />

      <LocationHeader />

      <FlatList
        data={filteredBusinesses}
        renderItem={renderBusinessCard}
        keyExtractor={(item) => item.businessId.toString()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          loading && businesses.length > 0 ? (
            <ActivityIndicator
              size="small"
              color={COLOR.green}
              style={styles.footerLoader}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLOR.green]}
            tintColor={COLOR.green}
          />
        }
        ListEmptyComponent={!loading && <EmptyList />}
        windowSize={5} // Reduces the number of off-screen rendered items
        maxToRenderPerBatch={5} // Limits the number of rendered items per batch
        updateCellsBatchingPeriod={100} // Group UI updates
        removeClippedSubviews={Platform.OS === 'android'} // Delete off-screen views
        initialNumToRender={5} // Initial items to render
        onScroll={handleScroll}
        scrollEventThrottle={150} // Throttle scroll events for better performance
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.lightGray,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR.background,
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: COLOR.gray,
    marginTop: 16,
  },
  listContent: {
    padding: 15,
    paddingBottom: 170,
    flexGrow: 1,
  },
  businessCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 12,
  },
  businessName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: COLOR.darkGray,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusText: {
    fontFamily: 'Poppins-Medium',
    color: '#fff',
    fontSize: 12,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  productItem: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: COLOR.darkGray,
    marginBottom: 2,
  },
  productDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: COLOR.green,
  },
  moreText: {
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLOR.green,
    borderRadius: 20,
  },
  retryButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: COLOR.white,
  },
  locationHeader: {
    padding: 15,
    paddingBottom: 10,
    backgroundColor: COLOR.white,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.lightGray,
    alignItems: 'center',
    elevation: 2,
    marginStart: 16,
    marginInlineEnd: 16,
    borderRadius: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: COLOR.darkGray,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF9F5',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLOR.orange,
  },
  zoneError: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: COLOR.orange,
    marginLeft: 6,
    flex: 1,
  },
  footerLoader: {
    marginVertical: 20,
  },
});

export default FoodAndDrinkScreen;
