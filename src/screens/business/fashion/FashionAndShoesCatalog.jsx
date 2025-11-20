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

// Datos para categorías de moda
const fashionCategories = [
  { label: '👗 Vestidos', value: 'dresses' },
  { label: '👕 Camisas', value: 'shirts' },
  { label: '👚 Blusas', value: 'blouses' },
  { label: '🩳 Pantalones', value: 'pants' },
  { label: '👖 Jeans', value: 'jeans' },
  { label: '👟 Zapatillas', value: 'sneakers' },
  { label: '👠 Zapatos', value: 'shoes' },
  { label: '👜 Bolsos', value: 'bags' },
  { label: '🧥 Abrigos', value: 'coats' },
  { label: '🎽 Ropa Deportiva', value: 'sportswear' },
];

// Tallas disponibles
const sizes = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  shoes: ['22', '23', '24', '25', '26', '27', '28', '29', '30'],
};

// Colores predefinidos
const predefinedColors = [
  { name: 'Negro', value: '#000000' },
  { name: 'Blanco', value: '#FFFFFF' },
  { name: 'Rojo', value: '#FF0000' },
  { name: 'Azul', value: '#0000FF' },
  { name: 'Verde', value: '#008000' },
  { name: 'Amarillo', value: '#FFFF00' },
  { name: 'Rosa', value: '#FFC0CB' },
  { name: 'Gris', value: '#808080' },
  { name: 'Beige', value: '#F5F5DC' },
  { name: 'Marrón', value: '#A52A2A' },
];

const ProductItem = React.memo(({ item, onView, onEdit, onDelete }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity style={styles.productCard} onPress={() => onView(item)}>
      {item.images && item.images.length > 0 && !imageError ? (
        <Image
          source={{ uri: item.images[0] }}
          style={styles.productImage}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="image-outline" size={32} color={COLORS.lightGray} />
          <Text style={styles.placeholderText}>Imagen no disponible</Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>
          {fashionCategories.find((cat) => cat.value === item.category) ?.label || item.category}
        </Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <Text style={styles.productVariants}>
          {item.variants.length} variantes disponibles
        </Text>
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
          onPress={() => onDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

// Componentes de Modal reutilizables
const SuccessModal = ({ visible, message, onClose }) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
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
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
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
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onCancel}
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
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
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

const FashionAndShoesCatalog = ({ navigation, route }) => {
  const { sector } = route.params || {};
  const [logoUri, setLogo] = useState(null);
  const [images, setImages] = useState([]);
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
    brand: '',
    material: '',
    category: '',
    subcategory: '',
    variants: [],
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [invalidFields, setInvalidFields] = useState({});
  const [isNewLogoSelected, setIsNewLogoSelected] = useState(false);

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

  // useAnimatedStyle para crear estilos animados
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const onImageScroll = useCallback((event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const currentIndex = event.nativeEvent.contentOffset.x / slideSize;
    setCurrentImageIndex(Math.round(currentIndex));
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      const stored = await AsyncStorage.getItem('userInfo');
      const user = JSON.parse(stored);
      const id = user.businessId;
      setBusinessId(id);

      // Simular carga de productos
      setTimeout(() => {
        setProducts([]);
        setLoading(false);

        // withTiming de Reanimated
        fadeAnim.value = withTiming(1, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        });

        slideAnim.value = withTiming(0, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        });
      }, 1000);
    };

    loadProducts();
  }, []);

  const handleLogoLoad = () => {
    setLogoLoaded(true);
    setLogoError(false);
  };

  const handleLogoError = () => {
    setLogoLoaded(false);
    setLogoError(true);
  };

  const openModal = (product = null) => {
    if (product) {
      const productImages = product.images ? product.images.map((img, index) => {
        if (typeof img === 'string') {
          return { uri: img, name: `image_${index}.jpg`, type: 'image/jpeg' };
        }
        return img;
      }) : [];

      setForm({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        brand: product.brand || '',
        material: product.material || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        variants: product.variants || [],
      });
      setEditingProductId(product.id);
      setImages(productImages);
    } else {
      setForm({
        name: '',
        description: '',
        price: '',
        brand: '',
        material: '',
        category: '',
        subcategory: '',
        variants: [],
      });
      setEditingProductId(null);
      setImages([]);
    }
    setModalVisible(true);
  };

  const openViewModal = (product) => {
    setSelectedProduct(product);
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

  const pickImages = async () => {
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
        allowsMultipleSelection: true,
        selectionLimit: 3,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`,
          type: asset.type || 'image/jpeg',
        }));
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (err) {
      console.error('Error al abrir galería:', err);
      showErrorModal(err.message || 'Error al abrir la galería');
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Sistema de Variantes
  const addVariant = () => {
    setForm({
      ...form,
      variants: [...form.variants, { color: '#000000', size: 'M', stock: '0' }],
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

  const getAvailableSizes = () => {
    return form.category === 'sneakers' || form.category === 'shoes'
      ? sizes.shoes
      : sizes.clothing;
  };

  const handleSave = async () => {
    const errors = {};

    if (!form.name.trim()) errors.name = true;
    if (!form.description.trim()) errors.description = true;
    if (!form.price.trim() || isNaN(form.price) || parseFloat(form.price) <= 0)
      errors.price = true;
    if (!form.category) errors.category = true;
    if (images.length === 0) errors.images = true;

    setInvalidFields(errors);

    if (Object.keys(errors).length > 0) {
      showErrorModal('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    try {
      const processedImages = images.map((img) => {
        if (typeof img === 'string') {
          return img; // Ya es una URI
        }
        return img.uri;
      });

      // Simular guardado
      const newProduct = {
        id: editingProductId || Date.now().toString(),
        ...form,
        price: parseFloat(form.price),
        images: processedImages,
        variants: form.variants.map((v) => ({
          ...v,
          stock: parseInt(v.stock) || 0,
        })),
      };

      if (editingProductId) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProductId ? newProduct : p)),
        );
      } else {
        setProducts((prev) => [...prev, newProduct]);
      }

      setModalVisible(false);
      resetForm();
      showSuccessModal('Producto guardado correctamente.');
    } catch (error) {
      console.error('Error al guardar producto:', error);
      showErrorModal('No se pudo guardar el producto. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback((id) => {
    showDeleteConfirmModal(id);
  }, []);

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setLoading(true);
    try {
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete));
      setDeleteConfirmModalVisible(false);
      showSuccessModal('Producto eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      showErrorModal('No se pudo eliminar el producto. Inténtalo de nuevo.');
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
      brand: '',
      material: '',
      category: '',
      subcategory: '',
      variants: [],
    });
    setImages([]);
    setEditingProductId(null);
    setInvalidFields({});
  };

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
                <Ionicons
                  name="camera-outline"
                  size={20}
                  color={COLORS.white}
                />
              </View>
            </View>
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="image-outline" size={32} color={COLORS.gray} />
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
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductItem
              item={item}
              onView={openViewModal}
              onEdit={openModal}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="image-outline" size={64} color={COLORS.lightGray} />
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
                  onChangeText={(text) =>
                    setForm({ ...form, description: text })
                  }
                  multiline
                  style={[
                    styles.input,
                    styles.textArea,
                    invalidFields.description && styles.invalidInput,
                  ]}
                />

                <View style={styles.row}>
                  <View style={[styles.inputGroup, styles.flex1]}>
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

                  <View style={[styles.inputGroup, styles.flex1]}>
                    <TextInput
                      placeholder="Marca"
                      placeholderTextColor={COLORS.placeholder}
                      value={form.brand}
                      onChangeText={(text) => setForm({ ...form, brand: text })}
                      style={styles.input}
                    />
                  </View>
                </View>

                <TextInput
                  placeholder="Material (ej: Algodón, Cuero, sintético, Poliéster)"
                  placeholderTextColor={COLORS.placeholder}
                  value={form.material}
                  onChangeText={(text) => setForm({ ...form, material: text })}
                  style={styles.input}
                />

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
                    onValueChange={(value) =>
                      setForm({ ...form, category: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item
                      label="Selecciona una categoría..."
                      value=""
                      style={{ color: COLORS.placeholder }}
                      enabled={false}
                    />
                    {fashionCategories.map((item) => (
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

              {/* Galería de Imágenes */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Galería de Imágenes *</Text>
                <View style={styles.imageGrid}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image
                        source={{ uri: image.uri || image }}
                        style={styles.imagePreview}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close" size={16} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={pickImages}
                    style={[
                      styles.imagePicker,
                      invalidFields.images && styles.invalidInput,
                    ]}
                  >
                    <Ionicons name="add" size={32} color={COLORS.primary} />
                    <Text style={styles.addImageText}>Añadir foto</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sistema de Variantes */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Variantes (Talla y Color)
                  </Text>
                  <TouchableOpacity
                    onPress={addVariant}
                    style={styles.addOptionButton}
                  >
                    <Ionicons name="add" size={20} color={COLORS.primary} />
                    <Text style={styles.addOptionText}>Añadir variante</Text>
                  </TouchableOpacity>
                </View>

                {form.variants.map((variant, index) => (
                  <View key={index} style={styles.variantCard}>
                    <View style={styles.variantHeader}>
                      <Text style={styles.variantNumber}>
                        Variante {index + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeVariant(index)}
                        style={styles.removeVariantButton}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={COLORS.error}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.variantFields}>
                      {/* Selector de Color */}
                      <View style={styles.variantInputGroup}>
                        <Text style={styles.variantLabel}>Color</Text>
                        <View style={styles.colorGrid}>
                          {predefinedColors.map((color, colorIndex) => (
                            <TouchableOpacity
                              key={colorIndex}
                              style={[
                                styles.colorOption, { backgroundColor: color.value },
                                variant.color === color.value && styles.colorSelected,
                              ]}
                              onPress={() => updateVariant(index, 'color', color.value)}
                            />
                          ))}
                        </View>
                      </View>

                      {/* Selector de Talla */}
                      <View style={styles.variantInputGroup}>
                        <Text style={styles.variantLabel}>Talla</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={variant.size}
                            onValueChange={(value) => updateVariant(index, 'size', value)}
                            style={styles.picker}
                          >
                            {getAvailableSizes().map((size) => (
                              <Picker.Item
                                key={size}
                                label={size}
                                value={size}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>

                      {/* Stock */}
                      <View style={styles.variantInputGroup}>
                        <Text style={styles.variantLabel}>Stock</Text>
                        <TextInput
                          placeholder="0"
                          placeholderTextColor={COLORS.placeholder}
                          keyboardType="numeric"
                          value={variant.stock}
                          onChangeText={(text) =>
                            updateVariant(index, 'stock', text)
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
                <TouchableOpacity
                  onPress={handleSave}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>
                    {editingProductId ? 'Actualizar' : 'Crear Producto'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Vista Ampliada del Producto */}
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
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <View style={styles.carouselContainer}>
                      <FlatList
                        data={selectedProduct.images}
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
                        {selectedProduct.images.map((_, index) => (
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
                      <Ionicons name="image-outline" size={64} color={COLORS.lightGray} />
                      <Text style={styles.expandedPlaceholderText}>
                        Imagen no disponible
                      </Text>
                    </View>
                  )}

                  <View style={styles.productDetails}>
                    <Text style={styles.expandedProductName}>
                      {selectedProduct.name}
                    </Text>
                    <Text style={styles.expandedProductPrice}>
                      ${selectedProduct.price.toFixed(2)}
                    </Text>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Categoría</Text>
                      <Text style={styles.detailText}>
                        {fashionCategories.find(
                          (cat) => cat.value === selectedProduct.category,
                        )?.label || selectedProduct.category}
                      </Text>
                    </View>

                    {selectedProduct.brand && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Marca</Text>
                        <Text style={styles.detailText}>
                          {selectedProduct.brand}
                        </Text>
                      </View>
                    )}

                    {selectedProduct.material && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Material</Text>
                        <Text style={styles.detailText}>
                          {selectedProduct.material}
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
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>
                        Variantes Disponibles
                      </Text>
                      {selectedProduct.variants.map((variant, index) => (
                        <View key={index} style={styles.variantItem}>
                          <View style={styles.variantInfo}>
                            <View
                              style={[
                                styles.colorCircle, { backgroundColor: variant.color },
                              ]}
                            />
                            <Text style={styles.variantText}>
                              Talla {variant.size}
                            </Text>
                            <Text style={styles.variantText}>
                              Stock: {variant.stock}
                            </Text>
                          </View>
                        </View>
                      ))}
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
  },
  changeLogoText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 8,
    fontWeight: '500',
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
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
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
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  productVariants: {
    fontSize: 12,
    color: COLORS.gray,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
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
  },
  pickerIcon: {
    position: 'absolute',
    right: 12,
    top: 15,
    pointerEvents: 'none',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageItem: {
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePicker: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 4,
    textAlign: 'center',
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
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: COLORS.primary,
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
  },
  productDetails: {
    padding: 24,
  },
  expandedProductName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  expandedProductPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
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
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  variantText: {
    fontSize: 14,
    color: COLORS.text,
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

export default FashionAndShoesCatalog;
