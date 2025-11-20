import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  updateLogoBusinessById,
  generateLogoUri,
} from '../../../services/BusinessService';
import {
  getMenusByBusiness,
  createMenu,
  updateMenu,
  deleteMenu,
  getImageByMenuId,
} from '../../../services/MenuService';

import { categories } from '../../../data/Categories';
import { preloadImage } from '../../../components/ImageCache';
import useScrollHandler from '../../../components/HandleScroll';
import { MenuItem } from '../../../components/MenuItem';

// Opciones para el tiempo de preparación
const preparationTimes = [
  { label: '🕓 10 min', value: '10' },
  { label: '🕓 15 min', value: '15' },
  { label: '🕓 20 min', value: '20' },
  { label: '🕓 25 min', value: '25' },
  { label: '🕓 30 min', value: '30' },
  { label: '🕓 35 min', value: '35' },
  { label: '🕓 40 min', value: '40' },
  { label: '🕓 50 min', value: '50' },
  { label: '🕓 60 min', value: '60' },
];

const FoodMenu = ({ navigation, route }) => {
  const { sector } = route.params || {};
  const [logoUri, setLogo] = useState(null);
  const [imageUri, setImage] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '0',
    ingredients: '',
    preparationTime: '',
    variants: [],
  });
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [invalidFields, setInvalidFields] = useState({});
  const [imageMeta, setImageMeta] = useState(null);
  const [isNewLogoSelected, setIsNewLogoSelected] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [menuToDelete, setMenuToDelete] = useState(null);
  const [visibleItems, setVisibleItems] = useState(new Set());
  const { handleScroll, isScrolling, cleanup } = useScrollHandler();

  // Animaciones
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(300))[0];

  useEffect(() => {
    const loadMenus = async () => {
      const stored = await AsyncStorage.getItem('userInfo');
      const user = JSON.parse(stored);

      const id = user.businessId;
      setBusinessId(id);

      const logoUrl = generateLogoUri(id);
      console.log('Logo URI:', logoUrl);
      setLogo(logoUrl);

      const data = await getMenusByBusiness(id);
      setMenus(data);
      setLoading(false);

      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    };

    loadMenus();
  }, []);

  useEffect(() => {
    if (logoUri) {
      setLogoLoaded(false);
    }
  }, [logoUri]);

  useEffect(() => {
    if (!isScrolling && visibleItems.size > 0) {
      const preloadImages = async () => {
        await Promise.all(
          Array.from(visibleItems).map(async (menuId) => {
            const imageUrl = getImageByMenuId(menuId);
            return preloadImage(imageUrl);
          }),
        );
      };
      preloadImages();
    }
  }, [visibleItems, isScrolling]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    const newVisibleItems = new Set();
    viewableItems.forEach(({ item }) => {
      newVisibleItems.add(item.menuId);
    });
    setVisibleItems(newVisibleItems);
  }, []);

  const handleLogoLoad = () => {
    setLogoLoaded(true);
    setLogoError(false);
  };

  const handleLogoError = () => {
    setLogoLoaded(false);
    setLogoError(true);
  };

  const handleImageError = useCallback((menuId) => {
    setImageErrors((prev) => ({ ...prev, [menuId]: true }));
  }, []);

  const openModal = (menu = null) => {
    if (menu) {
      setForm({
        name: menu.name,
        description: menu.description,
        price: menu.price.toString(),
        category: menu.category || '',
        stock: menu.stock?.toString() || '0',
        ingredients: menu.ingredients || '',
        preparationTime: menu.preparationTime || '',
        variants: menu.variants || [],
      });
      setEditingMenuId(menu.menuId);
    } else {
      setForm({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '0',
        ingredients: '',
        preparationTime: '',
        variants: [],
      });
      setEditingMenuId(null);
    }
    setModalVisible(true);
  };

  const openViewModal = (menu, imageUri = null) => {
    const imageToUse = imageUri || getImageByMenuId(menu.menuId);
    setSelectedMenu({ ...menu, imageUri: imageToUse });
    setViewModalVisible(true);
  };

  const showPermissionDeniedModal = () => {
    setModalMessage('Se necesita acceso a la galería para seleccionar imágenes.');
    setPermissionModalVisible(true);
  };

  const showErrorModal = (message) => {
    setModalMessage(message);
    setErrorModalVisible(true);
  };

  const showSuccessModal = (message) => {
    setModalMessage(message);
    setSuccessModalVisible(true);
  };

  const showDeleteConfirmModal = (menuId) => {
    setMenuToDelete(menuId);
    setDeleteConfirmModalVisible(true);
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showPermissionDeniedModal();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [3, 2],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      setLogoError(false);
      setLogoLoaded(false);
      setLogo(selectedImage.uri);
      setIsNewLogoSelected(true);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        showPermissionDeniedModal();
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setImage(selectedImage.uri);
        setImageMeta({
          uri: selectedImage.uri,
          name: selectedImage.fileName || `image_${Date.now()}.jpg`,
          type: selectedImage.type || 'image/jpeg',
        });
      }
    } catch (err) {
      console.error('Error al abrir galería:', err);
      showErrorModal(err.message || 'Error al abrir la galería');
    }
  };

  const addVariant = () => {
    setForm({
      ...form,
      variants: [...form.variants, { name: '', additionalPrice: '0' }],
    });
  };

  const removeVariant = (index) => {
    const newVariants = [...form.variants];
    newVariants.splice(index, 1);
    setForm({ ...form, variants: newVariants });
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...form.variants];
    newVariants[index][field] = value;
    setForm({ ...form, variants: newVariants });
  };

  const handleStockChange = (value) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      setForm({ ...form, stock: numValue.toString() });
    }
  };

  const prepareLogoData = (logoData) => {
    if (!logoData) {
      throw new Error('No se proporcionó el logoUri');
    }

    const uriParts = logoData.split('/');
    const filename = uriParts[uriParts.length - 1];
    const extensionMatch = /\.(\w+)$/.exec(filename);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : null;

    let mimeType;
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      default:
        throw new Error('Formato de imagen no soportado. Usa JPG o PNG.');
    }

    const formData = new FormData();
    formData.append('logo', {
      uri: logoData,
      name: filename,
      type: mimeType,
    });

    return formData;
  };

  const prepareImageData = (imageMeta) => {
    if (!imageMeta?.uri) {
      throw new Error('No se proporcionó la imagen');
    }

    const uriParts = imageMeta.uri.split('/');
    const filename = imageMeta.name || uriParts[uriParts.length - 1];
    const extensionMatch = /\.(\w+)$/.exec(filename);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : null;

    let mimeType;
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      default:
        throw new Error('Formato de imagen no soportado. Usa JPG o PNG.');
    }

    const formData = new FormData();
    formData.append('imagen', {
      uri: imageMeta.uri,
      name: filename,
      type: mimeType,
    });

    return formData;
  };

  const handleSave = async () => {
    const errors = {};

    if (!form.name.trim()) errors.name = true;
    if (!form.description.trim()) errors.description = true;
    if (!form.price.trim() || isNaN(form.price) || parseFloat(form.price) <= 0)
      errors.price = true;
    if (!form.category) errors.category = true;
    if (!imageUri) errors.image = true;
    if (!form.stock.trim() || parseInt(form.stock) < 0) errors.stock = true;

    setInvalidFields(errors);

    if (Object.keys(errors).length > 0) {
      showErrorModal('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    try {
      if (isNewLogoSelected) {
        const logoFormData = prepareLogoData(logoUri);
        await updateLogoBusinessById(businessId, logoFormData);
      }

      const formData = new FormData();

      formData.append('menuId', editingMenuId || Date.now());
      formData.append('businessId', businessId);
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('category', form.category);
      formData.append('stock', form.stock);
      formData.append('ingredients', form.ingredients);
      formData.append('preparationTime', form.preparationTime);
      formData.append('variants', JSON.stringify(form.variants));

      const imageFormData = prepareImageData(imageMeta);
      formData.append('imagen', imageFormData.get('imagen'));

      if (editingMenuId) {
        console.info('Actualizando menú con ID:', editingMenuId);
        await updateMenu(editingMenuId, formData);
      } else {
        console.info('Creando nuevo menú...');
        await createMenu(formData);
      }

      const updatedMenus = await getMenusByBusiness(businessId);
      setMenus(updatedMenus);
      setModalVisible(false);
      resetForm();
      setIsNewLogoSelected(false);
      showSuccessModal('Producto guardado correctamente.');
    } catch (error) {
      console.error('Error al guardar menú:', error);
      showErrorModal('No se pudo guardar el producto. Inténtalo de nuevo.');
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback((id) => {
    showDeleteConfirmModal(id);
  }, []);

  const confirmDelete = async () => {
    if (!menuToDelete) return;

    setLoading(true);
    try {
      await deleteMenu(menuToDelete);
      console.info('Menú eliminado con ID:', menuToDelete);
      const updatedMenus = await getMenusByBusiness(businessId);
      setMenus(updatedMenus);
      setDeleteConfirmModalVisible(false);
      showSuccessModal('Producto eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar menú:', error);
      showErrorModal('No se pudo eliminar el producto. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
      setMenuToDelete(null);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '0',
      ingredients: '',
      preparationTime: '',
      variants: [],
    });
    setImage(null);
    setEditingMenuId(null);
    setInvalidFields({});
  };

  const renderItem = useCallback(
    ({ item }) => (
      <MenuItem
        item={item}
        onView={openViewModal}
        onEdit={openModal}
        onDelete={handleDelete}
        onImageError={handleImageError}
      />
    ),
    [],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Header con Logo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={pickLogo} style={styles.logoWrapper}>
          {logoUri && !logoError ? (
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: logoUri }}
                style={styles.logo}
                onLoad={handleLogoLoad}
                onError={handleLogoError}
              />
              {!logoLoaded && (
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                  style={styles.logoSpinner}
                />
              )}
              <View style={styles.logoOverlay}>
                <Ionicons name="camera-outline" size={20} color={COLORS.white} />
              </View>
            </View>
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="restaurant-outline" size={32} color={COLORS.gray} />
              <Text style={styles.logoText}>Logo del negocio</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.changeLogoText}>Toca para cambiar logo</Text>
      </View>

      {/* Botón Principal */}
      <TouchableOpacity
        style={[styles.addButton, !logoLoaded && styles.addButtonDisabled]}
        onPress={() => openModal()}
        disabled={!logoLoaded}
      >
        <Ionicons name="add-circle" size={24} color={COLORS.white} />
        <Text style={styles.addButtonText}>Nuevo producto</Text>
      </TouchableOpacity>

      {/* Lista de Productos */}
      <FlatList
        data={menus}
        keyExtractor={(item) => item.menuId.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 70,
          waitForInteraction: false,
        }}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        initialNumToRender={10}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal de Agregar/Editar Producto */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingMenuId ? 'Editar Producto' : 'Nuevo Producto'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              {/* Campos Principales */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Información Básica</Text>

                <TextInput
                  placeholder="Nombre del producto *"
                  placeholderTextColor={COLORS.placeholder}
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                  style={[
                    styles.input,
                    invalidFields.name && styles.invalidInput,
                  ]}
                />

                <TextInput
                  placeholder="Descripción *"
                  placeholderTextColor={COLORS.placeholder}
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  multiline
                  style={[
                    styles.input,
                    styles.textArea,
                    invalidFields.description && styles.invalidInput,
                  ]}
                />

                {/* Precio */}
                <View style={styles.inputGroup}>
                  <TextInput
                    placeholder="Precio *"
                    placeholderTextColor={COLORS.placeholder}
                    keyboardType="numeric"
                    value={form.price}
                    onChangeText={(text) => setForm({ ...form, price: text })}
                    style={[
                      styles.input,
                      invalidFields.price && styles.invalidInput,
                    ]}
                  />
                </View>

                {/* Stock disponible */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Stock disponible *</Text>
                  <View style={styles.stockContainer}>
                    <TouchableOpacity
                      onPress={() => handleStockChange(parseInt(form.stock) - 1)}
                      style={styles.stockButton}
                      disabled={parseInt(form.stock) <= 0}
                    >
                      <Ionicons
                        name="remove"
                        size={20}
                        color={
                          parseInt(form.stock) <= 0 ? COLORS.lightGray : COLORS.primary
                        }
                      />
                    </TouchableOpacity>
                    <TextInput
                      value={form.stock}
                      onChangeText={handleStockChange}
                      keyboardType="numeric"
                      style={styles.stockInput}
                    />
                    <TouchableOpacity
                      onPress={() => handleStockChange(parseInt(form.stock) + 1)}
                      style={styles.stockButton}
                    >
                      <Ionicons name="add" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                  {invalidFields.stock && (
                    <Text style={styles.errorText}>El stock no puede ser negativo</Text>
                  )}
                </View>

                {/* Categoría */}
                <Text style={styles.label}>Categoría *</Text>
                <View
                  style={[
                    styles.pickerContainer,
                    invalidFields.category && styles.invalidInput,
                  ]}
                >
                  <Picker
                    selectedValue={form.category}
                    onValueChange={(value) => setForm({ ...form, category: value })}
                    style={styles.picker}
                  >
                    <Picker.Item
                      label="Selecciona una categoría..."
                      value=""
                      style={{ color: COLORS.placeholder }}
                      enabled={false}
                    />
                    {categories.map((item) => (
                      <Picker.Item
                        key={item.value}
                        label={item.label}
                        value={item.value}
                      />
                    ))}
                  </Picker>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={COLORS.gray}
                    style={styles.pickerIcon}
                  />
                </View>
              </View>

              {/* Imagen del producto */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Imagen del Producto *</Text>
                <TouchableOpacity
                  onPress={pickImage}
                  style={[
                    styles.imagePicker,
                    invalidFields.image && styles.invalidInput,
                  ]}
                >
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.placeholder}>
                      <Ionicons name="image-outline" size={48} color={COLORS.lightGray} />
                      <Text style={styles.placeholderText}>
                        Seleccionar imagen del producto
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Información Adicional */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Información Adicional</Text>

                <TextInput
                  placeholder="Ingredientes y alérgenos..."
                  placeholderTextColor={COLORS.placeholder}
                  value={form.ingredients}
                  onChangeText={(text) => setForm({ ...form, ingredients: text })}
                  multiline
                  style={[styles.input, styles.textArea]}
                />

                {/* Tiempo estimado de preparación */}
                <Text style={styles.label}>Tiempo estimado de preparación</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.preparationTime}
                    onValueChange={(value) =>
                      setForm({ ...form, preparationTime: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item
                      label="Selecciona tiempo de preparación..."
                      value=""
                      style={{ color: COLORS.placeholder }}
                      enabled={false}
                    />
                    {preparationTimes.map((time) => (
                      <Picker.Item
                        key={time.value}
                        label={time.label}
                        value={time.value}
                      />
                    ))}
                  </Picker>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={COLORS.gray}
                    style={styles.pickerIcon}
                  />
                </View>
              </View>

              {/* Variantes */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Variantes</Text>
                  <TouchableOpacity onPress={addVariant} style={styles.addOptionButton}>
                    <Ionicons name="add" size={20} color={COLORS.primary} />
                    <Text style={styles.addOptionText}>Añadir variante</Text>
                  </TouchableOpacity>
                </View>

                {form.variants.map((variant, index) => (
                  <View key={index} style={styles.variantCard}>
                    {/* Header de la variante con botón eliminar */}
                    <View style={styles.variantHeader}>
                      <Text style={styles.variantNumber}>Variante {index + 1}</Text>
                      <TouchableOpacity
                        onPress={() => removeVariant(index)}
                        style={styles.removeVariantButton}
                      >
                        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>

                    {/* Campos apilados verticalmente */}
                    <View style={styles.variantFields}>
                      {/* Nombre de la variante */}
                      <View style={styles.variantInputGroup}>
                        <Text style={styles.variantLabel}>Nombre de la variante</Text>
                        <TextInput
                          placeholder="Eje: Tamaño grande, Extra queso..."
                          placeholderTextColor={COLORS.placeholder}
                          value={variant.name}
                          onChangeText={(text) => updateVariant(index, 'name', text)}
                          style={styles.input}
                        />
                      </View>

                      {/* Precio adicional */}
                      <View style={styles.variantInputGroup}>
                        <Text style={styles.variantLabel}>Precio adicional</Text>
                        <TextInput
                          placeholder="$ 0"
                          placeholderTextColor={COLORS.placeholder}
                          keyboardType="numeric"
                          value={variant.additionalPrice}
                          onChangeText={(text) =>
                            updateVariant(index, 'additionalPrice', text)
                          }
                          style={styles.input}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Botones de Acción */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>
                    {editingMenuId ? 'Actualizar' : 'Crear Producto'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Vista del Producto */}
      <Modal
        visible={viewModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.viewModalOverlay}>
          <View style={styles.viewModalContent}>
            {selectedMenu && (
              <>
                <TouchableOpacity
                  style={styles.closeViewButton}
                  onPress={() => setViewModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {selectedMenu.imageUri ? (
                    <Image
                      source={{ uri: selectedMenu.imageUri }}
                      style={styles.expandedImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.expandedPlaceholder}>
                      <Ionicons name="image-outline" size={64} color={COLORS.lightGray} />
                      <Text style={styles.expandedPlaceholderText}>
                        Imagen no disponible
                      </Text>
                    </View>
                  )}

                  <View style={styles.menuDetails}>
                    <Text style={styles.expandedMenuName}>{selectedMenu.name}</Text>
                    <Text style={styles.expandedMenuCategory}>
                      {selectedMenu.category}
                    </Text>
                    <Text style={styles.expandedMenuDesc}>
                      {selectedMenu.description}
                    </Text>

                    {selectedMenu.ingredients && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Ingredientes</Text>
                        <Text style={styles.detailText}>{selectedMenu.ingredients}</Text>
                      </View>
                    )}

                    {selectedMenu.preparationTime && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Tiempo de preparación</Text>
                        <Text style={styles.detailText}>
                          {selectedMenu.preparationTime} minutos
                        </Text>
                      </View>
                    )}

                    <View style={styles.priceContainer}>
                      <Text style={styles.expandedMenuPrice}>${selectedMenu.price}</Text>
                      <Text style={styles.stockText}>
                        {selectedMenu.stock || 0} disponibles
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modales de Estado (éxito, error, confirmación) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContent}>
            <View style={styles.alertIconSuccess}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            </View>
            <Text style={styles.alertTitle}>Éxito</Text>
            <Text style={styles.alertMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.alertButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContent}>
            <View style={styles.alertIconError}>
              <Ionicons name="close-circle" size={48} color={COLORS.error} />
            </View>
            <Text style={styles.alertTitle}>Error</Text>
            <Text style={styles.alertMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.alertButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteConfirmModalVisible}
        onRequestClose={() => setDeleteConfirmModalVisible(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContent}>
            <View style={styles.alertIconWarning}>
              <Ionicons name="warning" size={48} color={COLORS.warning} />
            </View>
            <Text style={styles.alertTitle}>Confirmar</Text>
            <Text style={styles.alertMessage}>
              ¿Estás seguro de que deseas eliminar este producto?
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelConfirmButton]}
                onPress={() => setDeleteConfirmModalVisible(false)}
              >
                <Text style={styles.cancelConfirmButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteConfirmButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteConfirmButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Permission Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={permissionModalVisible}
        onRequestClose={() => setPermissionModalVisible(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContent}>
            <View style={styles.alertIconWarning}>
              <Ionicons name="alert-circle" size={48} color={COLORS.warning} />
            </View>
            <Text style={styles.alertTitle}>Permiso requerido</Text>
            <Text style={styles.alertMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setPermissionModalVisible(false)}
            >
              <Text style={styles.alertButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const COLORS = {
  primary: '#00CC86',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#E5E7EB',
  placeholder: '#9CA3AF',
  background: '#F9FAFB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  card: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
  },
  logo: {
    width: 350,
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  logoOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 6,
    borderRadius: 8,
  },
  logoSpinner: {
    position: 'absolute',
    top: '40%',
    left: '45%',
  },
  logoPlaceholder: {
    width: 350,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  logoText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'center',
  },
  changeLogoText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 8,
    fontWeight: '500',
  },

  // Botón Principal
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },

  // Lista
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },

  // Modal Principal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },

  // Formulario
  formSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  invalidInput: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },

  // Stock Controls
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  stockButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockInput: {
    flex: 1,
    textAlign: 'center',
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  // Picker
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  picker: {
    height: 55,
    color: COLORS.text,
    paddingLeft: 12,
  },
  pickerIcon: {
    position: 'absolute',
    right: 12,
    top: 15,
    pointerEvents: 'none',
  },

  // Image Picker
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: 150,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  placeholderText: {
    color: COLORS.placeholder,
    fontSize: 12,
    marginTop: 8,
  },

  // Variantes
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addOptionText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  variantCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  variantNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  removeVariantButton: {
    padding: 4,
  },
  variantFields: {
    gap: 12,
  },
  variantLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
    marginLeft: 4,
  },

  // Botones de Acción
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.gray,
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },

  // Vista Ampliada
  viewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  viewModalContent: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  closeViewButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  expandedImage: {
    width: '100%',
    height: 300,
  },
  expandedPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedPlaceholderText: {
    color: COLORS.placeholder,
    marginTop: 16,
    fontSize: 16,
  },
  menuDetails: {
    padding: 24,
  },
  expandedMenuName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  expandedMenuCategory: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 16,
  },
  expandedMenuDesc: {
    fontSize: 16,
    color: COLORS.textLight,
    lineHeight: 24,
    marginBottom: 24,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  expandedMenuPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stockText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  // Modales de Alerta
  alertModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  alertIconSuccess: {
    marginBottom: 16,
  },
  alertIconError: {
    marginBottom: 16,
  },
  alertIconWarning: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  alertButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    width: '100%',
    alignItems: 'center',
  },
  alertButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelConfirmButton: {
    backgroundColor: COLORS.lightGray,
  },
  cancelConfirmButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
  },
  deleteConfirmButton: {
    backgroundColor: COLORS.error,
  },
  deleteConfirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default FoodMenu;
