import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableHighlight,
} from 'react-native';
import { COLOR } from '../../constants/Color';
import { API } from '../../constants/ApiConfig';
import { getAllBusinesses } from '../../services/BusinessService';

const HomeScreen = ({ navigation }) => {
  const [businesses, setBusinesses] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const defaultLogoUrl = 'https://img.icons8.com/ios-filled/500/shop.png';
  const PAGE_SIZE = 10;

  const loadBusinesses = async (pageNumber = 0, refresh = false) => {
    if (loading) return; // evitar cargas paralelas
    setLoading(true);
    try {
      const data = await getAllBusinesses(pageNumber, PAGE_SIZE);

      const businessesWithImages = data.content
        .filter((business) => business.menu && business.menu.length > 0)
        .map((business) => {
          const logoUrl = `${API.BUSINESS.GET_BUSINESS_LOGO_BY_ID(business.businessId)}?ts=${Date.now()}`;
          const menusWithImages = business.menu.map((menu) => ({
            ...menu,
            imageUrl: `${API.MENU.GET_IMAGE_BY_MENU_ID(menu.menuId)}?ts=${Date.now()}`,
          }));
          return { ...business, logoUrl, menus: menusWithImages };
        });

      if (refresh) {
        setBusinesses(businessesWithImages);
      } else {
        setBusinesses((prev) => [...prev, ...businessesWithImages]);
      }

      setPage(data.page);
      setHasMore(!data.last);
    } catch (error) {
      console.error('Error cargando negocios:', error);
    } finally {
      setLoading(false);
      if (refresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBusinesses(0, true);
  }, []);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadBusinesses(page + 1);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBusinesses(0, true);
  };

  const renderBusinessCard = ({ item: business }) => (
    <TouchableHighlight
      key={business.businessId}
      style={styles.businessCard}
      underlayColor="#e0e0e0"
      onPress={() => navigation.navigate('BusinessDetail', { business })}
    >
      <View>
        <Image
          source={{ uri: business.logoUrl || defaultLogoUrl }}
          style={styles.logo}
        />
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

        {(business.menus || []).slice(0, 2).map((menu) => (
          <View key={menu.menuId} style={styles.menuItem}>
            <Image source={{ uri: menu.imageUrl }} style={styles.menuImage} />
            <View style={styles.menuInfo}>
              <Text style={styles.menuName}>{menu.name}</Text>
              <Text style={styles.menuPrice}>${menu.price}</Text>
            </View>
          </View>
        ))}

        {(business.menus?.length || 0) > 2 && (
          <Text style={styles.moreText}>... y más</Text>
        )}
      </View>
    </TouchableHighlight>
  );

  if (loading && businesses.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00b894" />
        <Text>Cargando negocios...</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={businesses}
      renderItem={renderBusinessCard}
      keyExtractor={(item) => item.businessId.toString()}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? <ActivityIndicator size="small" color="#00b894" /> : null
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: COLOR.lightGray,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessCard: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    backgroundColor: '#fff',
    // shadow iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logo: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 8,
  },
  businessName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    lineHeight: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusText: {
    fontFamily: 'Poppins-Regular',
    color: '#fff',
    fontSize: 11,
  },

  description: {
    marginBottom: 8,
    color: '#555',
  },
  menuItem: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'center',
  },
  menuImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuPrice: {
    fontSize: 14,
    color: '#888',
  },
  moreText: {
    marginTop: 4,
    fontStyle: 'italic',
    color: '#888',
    fontSize: 14,
  },
});

export default HomeScreen;
