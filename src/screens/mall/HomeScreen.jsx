import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import Header from '../../components/Header';
import CategoryCard from '../../components/CategoryCard';
import useScrollHandler from '../../components/HandleScroll';
import { COLOR } from '../../constants/Color';

// Datos estáticos para las categorías
const allCategories = [
  { id: 1, title: 'Comida & Bebidas', emoji: '🍔🥤', sector: 'food' },
  { id: 2, title: 'Moda & Calzado', emoji: '👟👕', sector: 'fashion' },
  { id: 3, title: 'Electrónica & Tecnología', emoji: '📱💻', sector: 'technology' },
  { id: 4, title: 'Ferretería', emoji: '🧱🛠️', sector: 'hardware' },
  //{ id: 5, title: 'Farmacia', emoji: '💊📝', sector: 'pharmacy' },
];

const BOTTOM_TAB_HEIGHT = 80;
const EXTRA_SAFE_SPACE = Platform.OS === 'ios' ? 40 : 20;
const FOOTER_PADDING = BOTTOM_TAB_HEIGHT + EXTRA_SAFE_SPACE;

const FooterSections = () => (
  <View>
    {/* Featured Section */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Más populares</Text>
      <TouchableOpacity style={styles.featuredCard}>
        <View style={styles.featuredContent}>
          <Text style={styles.featuredEmoji}>🔥</Text>
          <View style={styles.featuredText}>
            <Text style={styles.featuredTitle}>Ofertas especiales</Text>
            <Text style={styles.featuredSubtitle}>
              Hasta un 50% de descuento en artículos seleccionados
            </Text>
          </View>
          <Text style={styles.featuredAction}>Ver todos</Text>
        </View>
      </TouchableOpacity>
    </View>

    {/* Quick Actions */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.quickActionCard}>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionEmoji}>⚡</Text>
            <View>
              <Text style={styles.quickActionTitle}>Entrega Rápida</Text>
              <Text style={styles.quickActionSubtitle}>Menos de 30 minutos</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard}>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionEmoji}>💰</Text>
            <View>
              <Text style={styles.quickActionTitle}>Mejores Ofertas</Text>
              <Text style={styles.quickActionSubtitle}>Ahorra más</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>

    <View style={{ height: FOOTER_PADDING }} />
  </View>
);

export default function HomeScreen({ navigation }) {
  const { handleScroll, cleanup } = useScrollHandler();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(allCategories);

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

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          marginBottom: 16,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Header
            navigation={navigation}
            onSearchChange={handleSearch}
            onSearchClear={handleSearchClear}
            searchQuery={searchQuery}
          />
        }
        ListFooterComponent={<FooterSections />}
        ListFooterComponentStyle={{ paddingBottom: 0 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No se encontraron categorías</Text>
            <Text style={styles.emptyText}>
              No hay categorías que coincidan con "{searchQuery}"
            </Text>
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
        contentContainerStyle={{
          paddingBottom: FOOTER_PADDING,
        }}
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
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 18,
    marginBottom: 12,
    color: '#111827',
    paddingLeft: 16,
  },

  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    marginHorizontal: 16,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  featuredText: {
    flex: 1,
  },
  featuredTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: '#111827',
  },
  featuredSubtitle: {
    fontFamily: 'Poppins-Light',
    fontSize: 13,
    color: '#373737ff',
  },
  featuredAction: {
    fontWeight: 'bold',
    fontSize: 14,
    color: COLOR.green,
  },

  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    padding: 12,
    flex: 0.48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  quickActionTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: '#111827',
  },
  quickActionSubtitle: {
    fontFamily: 'Poppins-Light',
    fontSize: 12,
    color: '#525252ff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
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
  },
});
