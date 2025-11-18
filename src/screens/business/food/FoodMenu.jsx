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
  TouchableHighlight,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR } from '../../../constants/Color';
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
        // Precargar en paralelo
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
      cleanup(); // cleanup on unmount
    };
  }, []);

  // Handle scroll to track visible items
  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    const newVisibleItems = new Set();
    viewableItems.forEach(({ item }) => {
      newVisibleItems.add(item.menuId);
    });
    setVisibleItems(newVisibleItems);
  }, []);

  // callback se activa cuando la imagen se carga correctamente
  const handleLogoLoad = () => {
    setLogoLoaded(true);
    setLogoError(false);
  };

  // callback se activa si falla la carga de imagen
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
      });
      setEditingMenuId(menu.menuId);
    } else {
      setForm({ name: '', description: '', price: '', category: '' });
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
      base64: false,
      quality: 1,
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
        base64: false,
        quality: 1,
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

  const prepareLogoData = (logoData) => {
    if (!logoData) {
      throw new Error('No se proporcionó el logoUri');
    }

    // Extraer nombre del archivo desde el uri
    const uriParts = logoData.split('/');
    const filename = uriParts[uriParts.length - 1];

    // Extraer la extensión del archivo
    const extensionMatch = /\.(\w+)$/.exec(filename);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : null;

    // Determinar el tipo MIME según la extensión
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

    // Obtener extensión desde el nombre o la URI
    const uriParts = imageMeta.uri.split('/');
    const filename = imageMeta.name || uriParts[uriParts.length - 1];
    const extensionMatch = /\.(\w+)$/.exec(filename);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : null;

    // Validar extensión
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

    setInvalidFields(errors); // 🔴 actualiza los errores visuales

    if (Object.keys(errors).length > 0) {
      showErrorModal('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    try {
      if (isNewLogoSelected) {
        // ✅ Solo si pasa la validación, se actualiza el logo
        const logoFormData = prepareLogoData(logoUri);
        await updateLogoBusinessById(businessId, logoFormData);
      }

      // Lógica para guardar el menú (crear o actualizar)
      const formData = new FormData();

      formData.append('menuId', editingMenuId || Date.now());
      formData.append('businessId', businessId);
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('category', form.category);

      const imageFormData = prepareImageData(imageMeta);
      formData.append('imagen', imageFormData.get('imagen'));

      // Crear o actualizar según el caso
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
      setIsNewLogoSelected(false); // Reiniciar el estado del logo
      showSuccessModal('Menú guardado correctamente.');
    } catch (error) {
      console.error('Error al guardar menú:', error);
      showErrorModal('No se pudo guardar el menú. Inténtalo de nuevo.');
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
      showSuccessModal('Menú eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar menú:', error);
      showErrorModal('No se pudo eliminar el menú. Inténtalo de nuevo.');
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
    });
    setImage(null);
    setEditingMenuId(null);
    setInvalidFields({});
  };

  // Optimized renderItem
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
        <ActivityIndicator size="large" color={COLOR.orange} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickLogo} style={styles.logoWrapper}>
        {logoUri && !logoError ? (
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: logoUri }}
              style={styles.logo}
              onLoad={handleLogoLoad}
              onError={handleLogoError}
            />
            {!logoLoaded && (
              <ActivityIndicator
                size="large"
                color={COLOR.orange}
                style={styles.logoSpinner}
              />
            )}
          </View>
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="image-outline" size={48} color="#ccc" />
            <Text style={styles.logoText}>Seleccionar logo del negocio</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.addButton, !logoLoaded && { backgroundColor: '#ccc' }]}
        onPress={() => openModal()}
        disabled={!logoLoaded}
      >
        <Text style={styles.addButtonText}>+ Nuevo menú</Text>
      </TouchableOpacity>

      <FlatList
        data={menus}
        keyExtractor={(item) => item.menuId.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
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
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingMenuId ? 'Editar Menú' : 'Agregar producto'}
              </Text>

              <TextInput
                placeholder="Nombre del producto"
                placeholderTextColor="#9e9e9eff"
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
                style={[
                  [styles.input, { color: '#000' }],
                  invalidFields.name && styles.invalidInput,
                ]}
              />
              <TextInput
                placeholder="Descripción"
                placeholderTextColor="#9e9e9eff"
                value={form.description}
                onChangeText={(text) => setForm({ ...form, description: text })}
                style={[
                  [styles.input, { color: '#000' }],
                  invalidFields.name && styles.invalidInput,
                ]}
              />
              <TextInput
                placeholder="Precio"
                placeholderTextColor="#9e9e9eff"
                keyboardType="numeric"
                value={form.price}
                onChangeText={(text) => setForm({ ...form, price: text })}
                style={[
                  [styles.input, { color: '#000' }],
                  invalidFields.name && styles.invalidInput,
                ]}
              />

              <Text style={styles.label}>Categoría:</Text>
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
                    style={{ color: '#b8b8b8ff' }}
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
                  color="#555"
                  style={styles.pickerIcon}
                />
              </View>

              {/* Picker de imagen */}
              <TouchableOpacity
                onPress={pickImage}
                style={[
                  styles.imagePicker,
                  invalidFields.image && styles.invalidInput,
                ]}
              >
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreview}
                  />
                ) : (
                  <View style={styles.placeholder}>
                    <Ionicons name="image-outline" size={48} color="#ccc" />
                    <Text style={styles.placeholderText}>
                      Seleccionar imagen del producto
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* botones */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave}>
                  <Text style={styles.save}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal for enlarged view of the image */}
      <Modal
        visible={viewModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.viewModalOverlay}>
          <View style={styles.viewModalContent}>
            {selectedMenu && (
              <>
                {selectedMenu.imageUri ? (
                  <Image
                    source={{ uri: selectedMenu.imageUri }}
                    style={styles.expandedImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.expandedPlaceholder}>
                    <Ionicons name="image-outline" size={64} color="#ccc" />
                    <Text style={styles.expandedPlaceholderText}>
                      Imagen no disponible
                    </Text>
                  </View>
                )}

                <View style={styles.menuDetails}>
                  <Text style={styles.expandedMenuName}>
                    {selectedMenu.name}
                  </Text>
                  <Text style={styles.expandedMenuDesc}>
                    {selectedMenu.description}
                  </Text>
                  <Text style={styles.expandedMenuPrice}>
                    ${selectedMenu.price}
                  </Text>
                </View>

                <TouchableHighlight
                  style={styles.okButton}
                  underlayColor="#c5c6c5ff"
                  onPress={() => setViewModalVisible(false)}
                >
                  <Text style={styles.okButtonText}>OK</Text>
                </TouchableHighlight>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Success modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              <Text style={styles.customModalTitle}>Éxito</Text>
            </View>
            <Text style={styles.customModalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.successButton]}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="close-circle" size={32} color="#ef4444" />
              <Text style={styles.customModalTitle}>Error</Text>
            </View>
            <Text style={styles.customModalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.errorButton]}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Deletion confirmation mode */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteConfirmModalVisible}
        onRequestClose={() => setDeleteConfirmModalVisible(false)}
      >
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={32} color="#f59e0b" />
              <Text style={styles.customModalTitle}>Confirmar</Text>
            </View>
            <Text style={styles.customModalMessage}>
              ¿Estás seguro de que deseas eliminar este menú?
            </Text>
            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={() => setDeleteConfirmModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.modalButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Permission mode denied */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={permissionModalVisible}
        onRequestClose={() => setPermissionModalVisible(false)}
      >
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={32} color="#f59e0b" />
              <Text style={styles.customModalTitle}>Permiso requerido</Text>
            </View>
            <Text style={styles.customModalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.warningButton]}
              onPress={() => setPermissionModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLOR.white,
  },
  addButton: {
    backgroundColor: COLOR.orange,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLOR.white,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLOR.white,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLOR.orange,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: 170,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f2f2',
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 5,
  },
  cancel: {
    color: COLOR.gray,
    fontWeight: 'bold',
  },
  save: {
    color: '#09a309ff',
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
  },
  pickerContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
    elevation: 1,
  },
  picker: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    height: 56,
    width: '100%',
    color: '#000',
    paddingLeft: 10,
  },
  pickerIcon: {
    position: 'absolute',
    right: 12,
    top: 15,
    pointerEvents: 'none',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4f4',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 80,
    resizeMode: 'cover',
  },
  logoText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
  logoSpinner: {
    position: 'absolute',
    top: '40%',
    left: '40%',
  },
  invalidInput: {
    borderColor: COLOR.red,
    borderWidth: 2,
  },
  viewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  viewModalContent: {
    width: '95%',
    maxHeight: '85%',
    backgroundColor: COLOR.white,
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    elevation: 3,
  },
  okButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  okButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  expandedImage: {
    width: '100%',
    height: 330,
    borderRadius: 12,
    marginBottom: 16,
  },
  expandedPlaceholder: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  expandedPlaceholderText: {
    color: '#888',
    marginTop: 10,
    fontSize: 16,
  },
  menuDetails: {
    width: '100%',
    alignItems: 'center',
  },
  expandedMenuName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  expandedMenuDesc: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
    textAlign: 'center',
  },
  expandedMenuPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLOR.orange,
  },

  customModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  customModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  customModalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  errorButton: {
    backgroundColor: '#ef4444',
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
});

export default FoodMenu;
