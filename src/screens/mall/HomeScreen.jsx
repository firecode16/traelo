import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Share,
} from 'react-native';
import Header from '../../components/Header';
import CategoryCard from '../../components/CategoryCard';
import useScrollHandler from '../../components/HandleScroll';
import { COLOR } from '../../constants/Color';
import { Ionicons } from '@expo/vector-icons';

// Datos estáticos para las categorías
const allCategories = [
  { id: 1, title: 'Comida & Bebidas', emoji: '🍔🥤', sector: 'food', color: '#FF6B6B' },
  { id: 2, title: 'Moda & Calzado', emoji: '👟👕', sector: 'fashion', color: '#4ECDC4' },
  { id: 3, title: 'Electrónica & Tecnología', emoji: '📱💻', sector: 'technology', color: '#45B7D1' },
  { id: 4, title: 'Ferretería', emoji: '🧱🛠️', sector: 'hardware', color: '#96CEB4' },
  /*{ id: 5, title: 'Farmacia', emoji: '💊📝', sector: 'pharmacy', color: '#FFEAA7' },
  { id: 6, title: 'Hogar & Decoración', emoji: '🏠🛋️', sector: 'home', color: '#DDA0DD' },*/
];

const BOTTOM_TAB_HEIGHT = 80;
const EXTRA_SAFE_SPACE = Platform.OS === 'ios' ? 40 : 20;
const FOOTER_PADDING = BOTTOM_TAB_HEIGHT + EXTRA_SAFE_SPACE;

const APP_STORE_LINK = Platform.OS === 'ios' ? 'https://apps.apple.com/app/id=com.traelo.app' : 'https://play.google.com/store/apps/details?id=com.company.app';

const FooterSections = ({ onShare }) => (
  <View>
    {/* Featured Section */}
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Más populares</Text>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>Ver todos</Text>
          <Ionicons name="chevron-forward" size={16} color={COLOR.green} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9}>
        <View style={styles.featuredContent}>
          <View style={styles.featuredEmojiContainer}>
            <Text style={styles.featuredEmoji}>🎯</Text>
          </View>
          <View style={styles.featuredText}>
            <Text style={styles.featuredTitle}>Ofertas especiales del día</Text>
            <Text style={styles.featuredSubtitle}>
              Hasta un 50% de descuento en artículos seleccionados. ¡Solo hoy!
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={24} color={COLOR.green} />
        </View>
      </TouchableOpacity>
    </View>

    {/* Quick Actions */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.9}>
          <View style={styles.quickActionContent}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFE5E5' }]}>
              <Text style={styles.quickActionEmoji}>🚀</Text>
            </View>
            <View style={styles.quickActionText}>
              <Text style={styles.quickActionTitle}>Entrega Rápida</Text>
              <Text style={styles.quickActionSubtitle}>Menos de 30 min</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.9}>
          <View style={styles.quickActionContent}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E5F7FF' }]}>
              <Text style={styles.quickActionEmoji}>💰</Text>
            </View>
            <View style={styles.quickActionText}>
              <Text style={styles.quickActionTitle}>Mejores Ofertas</Text>
              <Text style={styles.quickActionSubtitle}>Ahorra más</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>

    {/* Share Section */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🤝 Compartir</Text>
      <TouchableOpacity
        style={styles.shareCard} 
        activeOpacity={0.9}
        onPress={onShare}
      >
        <View style={styles.shareContent}>
          <View style={styles.shareIconContainer}>
            <Ionicons name="share-social-outline" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.shareText}>
            <Text style={styles.shareTitle}>¡Comparte TRAELO!</Text>
            <Text style={styles.shareSubtitle}>
              Ayuda a otros a descubrir los mejores sectores cerca de ti
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={24} color={COLOR.green} />
        </View>
      </TouchableOpacity>
    </View>

    <View style={{ height: FOOTER_PADDING }} />
  </View>
);

export default function HomeScreen({ navigation }) {
  const { handleScroll, cleanup } = useScrollHandler();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(allCategories);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    return cleanup;
  }, []);

  // Filtrar categorías basado en la búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCategories(allCategories);
      return;
    }

    const filtered = allCategories.filter(category =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.sector.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setCategories(filtered);
  }, [searchQuery]);

  // Para compartir la app
  const handleShare = async () => {
    try {
      const categoriesList = categories.map(cat => `• ${cat.emoji} ${cat.title}`).join('\n');
      
      const shareMessage = `🌟 ¡Descubre TRAELO! 🌟\n\n¡Encuentra todo lo que necesitas cerca de ti! 🛍️\n\n📌 Categorías disponibles:\n${categoriesList}\n\n✨ Beneficios:\n✅ Entrega rápida en minutos\n✅ Mejores precios\n✅ Negocios locales\n✅ Promociones exclusivas\n\n📲 Descarga la app: ${APP_STORE_LINK}\n\n#TRAELO #CentroComercial #ComprasLocales`;
      
      const shareOptions = {
        message: shareMessage,
        title: '¡Descubre TRAELO - Todo cerca de ti!',
        url: APP_STORE_LINK,
        subject: 'Compartir TRAELO App',
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        console.log('Compartido exitosamente');
      }
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  // Para manejar la búsqueda
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  // Para refrescar
  const onRefresh = () => {
    setRefreshing(true);
    // Simular carga
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <Header
            navigation={navigation}
            onSearchChange={handleSearch}
            onSearchClear={handleSearchClear}
            searchQuery={searchQuery}
          />
        }
        ListFooterComponent={<FooterSections onShare={handleShare} />}
        ListFooterComponentStyle={{ paddingBottom: 0 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No se encontraron categorías</Text>
            <Text style={styles.emptyText}>
              No hay categorías que coincidan con "{searchQuery}"
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleSearchClear}
            >
              <Text style={styles.emptyButtonText}>Ver todas las categorías</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <CategoryCard
            emoji={item.emoji}
            title={item.title}
            onClick={() => navigation.navigate('MallOrchestrator', { sector: item.sector })}
          />
        )}
        windowSize={5}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={100}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={styles.contentContainer}
        scrollEventThrottle={100}
        onScroll={handleScroll}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: FOOTER_PADDING,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 18,
    color: '#111827',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: COLOR.green,
    marginRight: 4,
  },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredEmojiContainer: {
    backgroundColor: '#FFF5E6',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
  },
  featuredEmoji: {
    fontSize: 24,
  },
  featuredText: {
    flex: 1,
  },
  featuredTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flex: 0.48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 15,
    color: '#111827',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 13,
    color: '#6B7280',
  },
  shareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLOR.green + '20',
  },
  shareContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareIconContainer: {
    backgroundColor: COLOR.green,
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
  },
  shareText: {
    flex: 1,
  },
  shareTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  shareSubtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    backgroundColor: '#F3F4F6',
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 18,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLOR.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
