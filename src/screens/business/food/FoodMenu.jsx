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
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  updateLogoBusinessById,
  generateLogoUri,
} from '../../../services/BusinessService';
import {
  getProductsByBusiness,
  upsertProduct,
  deleteProduct,
  getProductImage,
} from '../../../services/ProductService';

// Categorías dinámicas para comida
const foodCategories = [
  { label: '🍕 Pizza', value: 'pizza' },
  { label: '🍔 Hamburguesas', value: 'burgers' },
  { label: '🌮 Tacos', value: 'tacos' },
  { label: '🍗 Pollo', value: 'chicken' },
  { label: '🥗 Ensaladas', value: 'salads' },
  { label: '🍝 Pastas', value: 'pasta' },
  { label: '🥨 Antojitos', value: 'snacks' },
  { label: '🍛 Platos Fuertes', value: 'main_courses' },
  { label: '🍤 Mariscos', value: 'seafood' },
  { label: '🥤 Bebidas', value: 'drinks' },
  { label: '🍰 Postres', value: 'desserts' },
  { label: '🫓 Panaderia', value: 'bakery' },
  { label: '🥩 Carnes', value: 'Meats' },
];

// Tiempos de preparación
const preparationTimes = [
  { label: '🕓 10 min', value: 10 },
  { label: '🕓 15 min', value: 15 },
  { label: '🕓 20 min', value: 20 },
  { label: '🕓 25 min', value: 25 },
  { label: '🕓 30 min', value: 30 },
  { label: '🕓 35 min', value: 35 },
  { label: '🕓 40 min', value: 40 },
  { label: '🕓 50 min', value: 50 },
  { label: '🕓 60 min', value: 60 },
];

// Genera ID único para variantes
const generateVariantId = () => `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Componente ProductItem memoizado
const ProductItem = React.memo(({ item, onView, onEdit, onDelete, onImageError, getImageUrl }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    onImageError(item.productId);
  };

  return (
    <TouchableOpacity style={styles.productCard} onPress={() => onView(item)}>
      {getImageUrl(item.productId) && !imageError ? (
        <Image
          source={{ uri: getImageUrl(item.productId) }}
          style={styles.productImage}
          onError={handleImageError}
        />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="fast-food-outline" size={32} color={COLORS.lightGray} />
          <Text style={styles.placeholderText}>Imagen no disponible</Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>
          {foodCategories.find((cat) => cat.value === item.category)?.label || item.category}
        </Text>
        <Text style={styles.productPrice}>${parseFloat(item.price).toFixed(2)}</Text>
        <Text style={styles.productStock}>
          {item.generalStock || 0} disponibles
        </Text>
        {item.preparationTime && (
          <Text style={styles.productTime}>⏱ {item.preparationTime} min</Text>
        )}
      </View>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onView(item)}
        >
          <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(item)}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(item.productId)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

// Modales reutilizables
const SuccessModal = ({ visible, message, onClose }) => (
  <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
    <View style={styles.alertModalOverlay}>
      <View style={styles.alertModalContent}>
        <View style={styles.alertIconSuccess}>
          <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
        </View>
        <Text style={styles.alertTitle}>Éxito</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <TouchableOpacity style={styles.alertButton} onPress={onClose}>
          <Text style={styles.alertButtonText}>Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const ErrorModal = ({ visible, message, onClose }) => (
  <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
    <View style={styles.alertModalOverlay}>
      <View style={styles.alertModalContent}>
        <View style={styles.alertIconError}>
          <Ionicons name="close-circle" size={48} color={COLORS.error} />
        </View>
        <Text style={styles.alertTitle}>Error</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <TouchableOpacity style={styles.alertButton} onPress={onClose}>
          <Text style={styles.alertButtonText}>Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const DeleteConfirmModal = ({ visible, onCancel, onConfirm }) => (
  <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
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
            onPress={onCancel}
          >
            <Text style={styles.cancelConfirmButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmButton, styles.deleteConfirmButton]}
            onPress={onConfirm}
          >
            <Text style={styles.deleteConfirmButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const PermissionModal = ({ visible, message, onClose }) => (
  <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
    <View style={styles.alertModalOverlay}>
      <View style={styles.alertModalContent}>
        <View style={styles.alertIconWarning}>
          <Ionicons name="alert-circle" size={48} color={COLORS.warning} />
        </View>
        <Text style={styles.alertTitle}>Permiso requerido</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <TouchableOpacity style={styles.alertButton} onPress={onClose}>
          <Text style={styles.alertButtonText}>Entendido</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const FoodMenu = ({ navigation, route }) => {
  const { sector } = route.params || {};

  const [logoUri, setLogo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    generalStock: '0',
    ingredients: '',
    preparationTime: '',
    variants: [],
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [invalidFields, setInvalidFields] = useState({});
  const [isNewLogoSelected, setIsNewLogoSelected] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Estados para modales
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [productToDelete, setProductToDelete] = useState(null);

  // Animaciones
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(300);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  // Función para el carrusel de imágenes
  const onImageScroll = useCallback((event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const currentIndex = event.nativeEvent.contentOffset.x / slideSize;
    setCurrentImageIndex(Math.round(currentIndex));
  }, []);

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

  const prepareImageData = (imageFile) => {
    if (!imageFile?.uri) {
      throw new Error('No se proporcionó la imagen');
    }

    const uriParts = imageFile.uri.split('/');
    const filename = imageFile.name || uriParts[uriParts.length - 1];
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
        mimeType = imageFile.type || 'image/jpeg';
    }

    return {
      uri: imageFile.uri,
      name: filename,
      type: mimeType,
    };
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const stored = await AsyncStorage.getItem('userInfo');
        const user = JSON.parse(stored);
        const id = user.businessId;
        setBusinessId(id);

        const logoUrl = generateLogoUri(id);
        setLogo(logoUrl);

        const data = await getProductsByBusiness(id);
        setProducts(data);
        setLoading(false);

        // Animaciones
        fadeAnim.value = withTiming(1, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        });
        slideAnim.value = withTiming(0, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        });
      } catch (error) {
        console.error('Error loading products:', error);
        setLoading(false);
        showErrorModal('Error al cargar los productos');
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (logoUri) {
      setLogoLoaded(false);
    }
  }, [logoUri]);

  // Handlers
  const handleLogoLoad = () => {
    setLogoLoaded(true);
    setLogoError(false);
  };

  const handleLogoError = () => {
    setLogoLoaded(false);
    setLogoError(true);
  };

  const handleImageError = useCallback((productId) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  }, []);

  // Para variantes
  const addVariant = () => {
    const hasEmptyVariant = form.variants.some(
      (variant) => !variant.variantType && !variant.variantValue,
    );

    if (!hasEmptyVariant) {
      setForm({
        ...form,
        variants: [
          ...form.variants,
          {
            id: generateVariantId(),
            variantType: '',
            variantValue: '',
            priceModifier: '0',
          },
        ],
      });
    } else {
      console.log('⚠️ Ya existe una variante vacía, completa esa primero');
    }
  };

  const removeVariant = (index) => {
    const newVariants = form.variants.filter((_, i) => i !== index);
    setForm({ ...form, variants: newVariants });
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...form.variants];

    if (field === 'priceModifier') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      newVariants[index][field] = numericValue;
    } else {
      newVariants[index][field] = value;
    }

    setForm({ ...form, variants: newVariants });
  };

  const handleStockChange = (value) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      setForm({ ...form, generalStock: numValue.toString() });
    }
  };

  const openModal = (product = null) => {
    if (product) {
      const formattedVariants = product.variants?.map((variant, index) => ({
        id: generateVariantId(),
        variantType: variant.variantType || '',
        variantValue: variant.variantValue || '',
        priceModifier: variant.priceModifier?.toString() || '0',
      })) || [];

      setForm({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category || '',
        generalStock: product.generalStock?.toString() || '0',
        ingredients: product.ingredients || '',
        preparationTime: product.preparationTime || '',
        variants: formattedVariants,
      });
      setEditingProductId(product.productId);

      // Precargar imagen existente si está disponible
      const existingImageUrl = getProductImage(product.productId);
      if (existingImageUrl) {
        setSelectedImage(existingImageUrl);
      } else {
        setSelectedImage(null);
      }
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const openViewModal = (product) => {
    setSelectedProduct(product);
    setViewModalVisible(true);
    setCurrentImageIndex(0);
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

  const showDeleteConfirmModal = (productId) => {
    setProductToDelete(productId);
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
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setSelectedImage(selectedImage.uri);
      }
    } catch (err) {
      console.error('Error al abrir galería:', err);
      showErrorModal(err.message || 'Error al abrir la galería');
    }
  };

  const prepareFormData = () => {
    const formData = new FormData();

    // Filtrar variantes vacías antes de eliminar duplicados
    const nonEmptyVariants = form.variants.filter(variant =>
      variant.variantType && variant.variantValue && variant.variantType.trim() !== '' && variant.variantValue.trim() !== ''
    );

    console.log('🔍 Variantes no vacías:', nonEmptyVariants.length);

    const uniqueVariantsMap = new Map();
    nonEmptyVariants.forEach(variant => {
      const key = `${variant.variantType.toLowerCase().trim()}|${variant.variantValue.toLowerCase().trim()}`;
      uniqueVariantsMap.set(key, variant);
    });

    const filteredVariants = Array.from(uniqueVariantsMap.values());

    const productDTO = {
      productId: editingProductId,
      sectorId: sector.sectorId,
      businessId: businessId,
      sectorName: sector.name,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      active: true,
      category: form.category,
      generalStock: parseInt(form.generalStock),
      ingredients: form.ingredients,
      preparationTime: parseInt(form.preparationTime) || null,
      brand: null,
      variants: filteredVariants.map(variant => ({
        variantType: variant.variantType.trim(),
        variantValue: variant.variantValue.trim(),
        priceModifier: parseFloat(variant.priceModifier) || 0
      }))
    };

    console.log('📤 Enviando ProductDTO:', productDTO);

    formData.append('productDTO', JSON.stringify(productDTO));

    if (selectedImage && !selectedImage.startsWith('http')) {
      const imageFile = prepareImageData({
        uri: selectedImage,
        name: `product_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      formData.append('file', imageFile);

      console.log('- New image file added to FormData');
    } else if (!editingProductId) {
      throw new Error('Los productos nuevos deben tener una imagen');
    } else {
      console.log('- No new image to upload, keeping existing image');
    }

    return formData;
  };

  const handleSave = async () => {
    const errors = {};

    if (!form.name.trim()) errors.name = true;
    if (!form.description.trim()) errors.description = true;
    if (!form.price.trim() || isNaN(form.price) || parseFloat(form.price) <= 0)
      errors.price = true;
    if (!form.category) errors.category = true;
    if (!selectedImage && !editingProductId) errors.image = true;
    if (!form.generalStock.trim() || parseInt(form.generalStock) < 0) errors.generalStock = true;

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

      const formData = prepareFormData();

      console.info(editingProductId ? 'Actualizando producto...' : 'Creando nuevo producto...');
      const savedProduct = await upsertProduct(formData);

      const updatedProducts = await getProductsByBusiness(businessId);
      setProducts(updatedProducts);
      
      setModalVisible(false);
      resetForm();
      setIsNewLogoSelected(false);
      showSuccessModal(editingProductId ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
    } catch (error) {
      console.error('Error al guardar producto:', error);
      showErrorModal(error.message || 'No se pudo guardar el producto. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback((productId) => {
    showDeleteConfirmModal(productId);
  }, []);

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setLoading(true);
    try {
      await deleteProduct(productToDelete);
      console.info('Producto eliminado con ID:', productToDelete);
      
      setProducts(prev => prev.filter(p => p.productId !== productToDelete));
      
      setDeleteConfirmModalVisible(false);
      showSuccessModal('Producto eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      showErrorModal(error.message || 'No se pudo eliminar el producto. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
      setProductToDelete(null);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      price: '',
      category: '',
      generalStock: '0',
      ingredients: '',
      preparationTime: '',
      variants: [],
    });
    setSelectedImage(null);
    setEditingProductId(null);
    setInvalidFields({});
  };

  const renderItem = useCallback(
    ({ item }) => (
      <ProductItem
        item={item}
        onView={openViewModal}
        onEdit={openModal}
        onDelete={handleDelete}
        onImageError={handleImageError}
        getImageUrl={getProductImage}
      />
    ),
    [handleDelete, handleImageError],
  );

  if (loading && products.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
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
      <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
        <Ionicons name="add-circle" size={24} color={COLORS.white} />
        <Text style={styles.addButtonText}>Nuevo producto</Text>
      </TouchableOpacity>

      {/* Lista de Productos */}
      {products.length > 0 ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.productId?.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="fast-food-outline" size={64} color={COLORS.lightGray} />
          <Text style={styles.emptyStateTitle}>No hay productos</Text>
          <Text style={styles.emptyStateText}>
            Comienza agregando tu primer producto
          </Text>
        </View>
      )}

      {/* Modal de Agregar/Editar Producto */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingProductId ? 'Editar Producto' : 'Nuevo Producto'}
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

              {/* Información Básica */}
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
                      onPress={() => handleStockChange(parseInt(form.generalStock) - 1)}
                      style={styles.stockButton}
                      disabled={parseInt(form.generalStock) <= 0}
                    >
                      <Ionicons
                        name="remove"
                        size={20}
                        color={
                          parseInt(form.generalStock) <= 0 ? COLORS.lightGray : COLORS.primary
                        }
                      />
                    </TouchableOpacity>
                    <TextInput
                      value={form.generalStock}
                      onChangeText={handleStockChange}
                      keyboardType="numeric"
                      style={styles.stockInput}
                    />
                    <TouchableOpacity
                      onPress={() => handleStockChange(parseInt(form.generalStock) + 1)}
                      style={styles.stockButton}
                    >
                      <Ionicons name="add" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                  {invalidFields.generalStock && (
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
                    {foodCategories.map((item) => (
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
                <Text style={styles.sectionTitle}>Imagen del Producto {!editingProductId && '*'}</Text>
                <TouchableOpacity
                  onPress={pickImage}
                  style={[
                    styles.imagePicker,
                    invalidFields.image && styles.invalidInput,
                  ]}
                >
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.placeholder}>
                      <Ionicons name="image-outline" size={48} color={COLORS.lightGray} />
                      <Text style={styles.placeholderText}>
                        {editingProductId ? 'Cambiar imagen del producto' : 'Seleccionar imagen del producto'}
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
                  <View key={variant.id} style={styles.variantCard}>
                    <View style={styles.variantHeader}>
                      <Text style={styles.variantNumber}>Variante {index + 1}</Text>
                      <TouchableOpacity
                        onPress={() => removeVariant(index)}
                        style={styles.removeVariantButton}
                      >
                        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.variantFields}>
                      <View style={styles.variantInputGroup}>
                        <Text style={styles.variantLabel}>Tipo de variante</Text>
                        <TextInput
                          placeholder="Ej: Tamaño, Color, Sabor..."
                          placeholderTextColor={COLORS.placeholder}
                          value={variant.variantType}
                          onChangeText={(text) => updateVariant(index, 'variantType', text)}
                          style={styles.input}
                        />
                      </View>

                      <View style={styles.variantInputGroup}>
                        <Text style={styles.variantLabel}>Valor de la variante</Text>
                        <TextInput
                          placeholder="Ej: Grande, Rojo, Chocolate..."
                          placeholderTextColor={COLORS.placeholder}
                          value={variant.variantValue}
                          onChangeText={(text) => updateVariant(index, 'variantValue', text)}
                          style={styles.input}
                        />
                      </View>

                      <View style={styles.variantInputGroup}>
                        <Text style={styles.variantLabel}>Precio adicional</Text>
                        <TextInput
                          placeholder="$ 0"
                          placeholderTextColor={COLORS.placeholder}
                          keyboardType="numeric"
                          value={variant.priceModifier}
                          onChangeText={(text) =>
                            updateVariant(index, 'priceModifier', text)
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
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingProductId ? 'Actualizar' : 'Crear Producto'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Vista ampliada */}
      <Modal
        visible={viewModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.viewModalOverlay}>
          <View style={styles.viewModalContent}>
            {selectedProduct && (
              <>
                <TouchableOpacity
                  style={styles.closeViewButton}
                  onPress={() => setViewModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Carrusel de Imágenes */}
                  {(() => {
                    const productImage = getProductImage(selectedProduct.productId);
                    const images = productImage ? [productImage] : [];
                    
                    return images.length > 0 ? (
                      <View style={styles.carouselContainer}>
                        <FlatList
                          data={images}
                          horizontal
                          pagingEnabled
                          showsHorizontalScrollIndicator={false}
                          keyExtractor={(item, index) => index.toString()}
                          renderItem={({ item }) => (
                            <Image
                              source={{ uri: item }}
                              style={styles.expandedImage}
                              resizeMode="cover"
                            />
                          )}
                          onMomentumScrollEnd={onImageScroll}
                        />
                        {/* Indicadores del carrusel */}
                        <View style={styles.carouselIndicators}>
                          {images.map((_, index) => (
                            <View
                              key={index}
                              style={[
                                styles.carouselIndicator,
                                index === currentImageIndex && styles.carouselIndicatorActive
                              ]}
                            />
                          ))}
                        </View>
                      </View>
                    ) : (
                      <View style={styles.expandedPlaceholder}>
                        <Ionicons name="fast-food-outline" size={64} color={COLORS.lightGray} />
                        <Text style={styles.expandedPlaceholderText}>
                          Imagen no disponible
                        </Text>
                      </View>
                    );
                  })()}

                  <View style={styles.productDetails}>
                    <Text style={styles.expandedProductName}>
                      {selectedProduct.name}
                    </Text>
                    <Text style={styles.expandedProductPrice}>
                      ${parseFloat(selectedProduct.price).toFixed(2)}
                    </Text>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Categoría</Text>
                      <Text style={styles.detailText}>
                        {foodCategories.find(
                          (cat) => cat.value === selectedProduct.category,
                        )?.label || selectedProduct.category}
                      </Text>
                    </View>

                    {selectedProduct.ingredients && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Ingredientes</Text>
                        <Text style={styles.detailText}>
                          {selectedProduct.ingredients}
                        </Text>
                      </View>
                    )}

                    {selectedProduct.preparationTime && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Tiempo de preparación</Text>
                        <Text style={styles.detailText}>
                          {selectedProduct.preparationTime} minutos
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Descripción</Text>
                      <Text style={styles.detailText}>
                        {selectedProduct.description}
                      </Text>
                    </View>

                    {/* Variantes Disponibles */}
                    {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>
                          Variantes Disponibles
                        </Text>
                        {selectedProduct.variants.map((variant, index) => (
                          <View key={index} style={styles.variantItem}>
                            <View style={styles.variantInfo}>
                              <Text style={styles.variantText}>
                                {variant.variantType}: {variant.variantValue}
                                {variant.priceModifier > 0 ? ` (+$${variant.priceModifier})` : ''}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Stock disponible</Text>
                      <Text style={styles.detailText}>
                        {selectedProduct.generalStock || 0} unidades
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modales de Estado */}
      <SuccessModal
        visible={successModalVisible}
        message={modalMessage}
        onClose={() => setSuccessModalVisible(false)}
      />

      <ErrorModal
        visible={errorModalVisible}
        message={modalMessage}
        onClose={() => setErrorModalVisible(false)}
      />

      <DeleteConfirmModal
        visible={deleteConfirmModalVisible}
        onCancel={() => setDeleteConfirmModalVisible(false)}
        onConfirm={confirmDelete}
      />

      <PermissionModal
        visible={permissionModalVisible}
        message={modalMessage}
        onClose={() => setPermissionModalVisible(false)}
      />
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
    fontFamily: 'Poppins-Regular',
  },
  changeLogoText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 8,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  productCategory: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  productStock: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
    fontFamily: 'Poppins-Regular',
  },
  productTime: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: 'Poppins-Regular',
  },
  productActions: {
    justifyContent: 'space-between',
  },
  actionButton: {
    padding: 8,
  },
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
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    padding: 4,
  },
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
    fontFamily: 'Poppins-SemiBold',
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
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-Medium',
  },
  inputGroup: {
    marginBottom: 12,
  },
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
    fontFamily: 'Poppins-Medium',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'Poppins-Regular',
  },
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
    fontFamily: 'Poppins-Regular',
  },
  pickerIcon: {
    position: 'absolute',
    right: 12,
    top: 15,
    pointerEvents: 'none',
  },
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
    fontFamily: 'Poppins-Medium',
  },
  variantCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    fontFamily: 'Poppins-SemiBold',
  },
  removeVariantButton: {
    padding: 4,
  },
  variantFields: {
    gap: 12,
  },
  variantInputGroup: {
    marginBottom: 8,
  },
  variantLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
    marginLeft: 4,
    fontFamily: 'Poppins-Medium',
  },
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
    fontFamily: 'Poppins-SemiBold',
  },
  saveButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
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
    top: 30,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  carouselContainer: {
    position: 'relative',
  },
  carouselIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  carouselIndicatorActive: {
    backgroundColor: COLORS.white,
  },
  expandedImage: {
    width: Dimensions.get('window').width,
    height: 380,
  },
  expandedPlaceholder: {
    width: '100%',
    height: 380,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedPlaceholderText: {
    color: COLORS.placeholder,
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  productDetails: {
    padding: 24,
  },
  expandedProductName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  expandedProductPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 24,
    fontFamily: 'Poppins-Bold',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  variantItem: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  variantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  variantText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'Poppins-Regular',
  },
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
    shadowOffset: { width: 0, height: 2 },
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
    fontFamily: 'Poppins-Bold',
  },
  alertMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: COLORS.textLight,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-SemiBold',
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
    fontFamily: 'Poppins-SemiBold',
  },
  deleteConfirmButton: {
    backgroundColor: COLORS.error,
  },
  deleteConfirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});

export default FoodMenu;
