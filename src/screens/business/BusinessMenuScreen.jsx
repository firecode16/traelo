import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR } from '../../constants/Color';
import { updateLogoBusinessById } from '../../services/BusinessService';
import {
  getMenusByBusiness,
  createMenu,
  updateMenu,
  deleteMenu,
} from '../../services/MenuService';

import { API } from '../../constants/ApiConfig';
import { categories } from '../../data/Categories';

const BusinessMenuScreen = () => {
  const [logoUri, setLogo] = useState(null);
  const [imageUri, setImage] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
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

  const generateLogoUri = (businessId) => {
    return `${API.BUSINESS.GET_BUSINESS_LOGO_BY_ID(businessId)}?ts=${Date.now()}`;
  };

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

  const openModal = (menu = null) => {
    if (menu) {
      setForm({
        name: menu.name,
        description: menu.description,
        price: menu.price.toString(),
      });
      setEditingMenuId(menu.menuId);
    } else {
      setForm({ name: '', description: '', price: '' });
      setEditingMenuId(null);
    }
    setModalVisible(true);
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: false,
      aspect: [4, 4],
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
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: false,
        aspect: [4, 4],
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
      Alert.alert('Error', err.message);
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
      console.warn(
        'Validación:',
        'Por favor completa todos los campos requeridos.',
      );
      return;
    }

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
      Alert.alert('Éxito', 'Menú guardado correctamente.');
    } catch (error) {
      console.error('Error al guardar menú:', error);
      Alert.alert('Error', 'No se pudo guardar el menú. Inténtalo de nuevo.');
      return;
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Confirmar', '¿Eliminar este menú?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteMenu(id);
          console.info('Menú eliminado con ID:', id);
          const updatedMenus = await getMenusByBusiness(businessId);
          setMenus(updatedMenus);
        },
      },
    ]);
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuName}>{item.name}</Text>
        <Text style={styles.menuDesc}>{item.description}</Text>
        <Text style={styles.menuPrice}>${item.price}</Text>
      </View>
      <TouchableOpacity
        onPress={() => openModal(item)}
        style={{ marginRight: 10 }}
      >
        <Ionicons name="create-outline" size={20} color={COLOR.orange} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.menuId)}>
        <Ionicons name="trash-outline" size={20} color={COLOR.red} />
      </TouchableOpacity>
    </View>
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
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingMenuId ? 'Editar Menú' : 'Agregar producto'}
            </Text>

            <TextInput
              placeholder="Nombre del producto"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              style={[styles.input, invalidFields.name && styles.invalidInput]}
            />
            <TextInput
              placeholder="Descripción"
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              style={[styles.input, invalidFields.name && styles.invalidInput]}
            />
            <TextInput
              placeholder="Precio"
              keyboardType="numeric"
              value={form.price}
              onChangeText={(text) => setForm({ ...form, price: text })}
              style={[styles.input, invalidFields.name && styles.invalidInput]}
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
                onValueChange={(value) => setForm({ ...form, category: value })}
                style={styles.picker}
              >
                <Picker.Item
                  label="Selecciona una categoría..."
                  value=""
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
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
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
  card: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuDesc: {
    color: '#555',
  },
  menuPrice: {
    color: COLOR.orange,
    marginTop: 4,
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
    width: '85%',
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
    marginTop: 10, // espacio inferior agregado
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
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 13,
  },
  picker: {
    height: 55,
    padding: 4,
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
});

export default BusinessMenuScreen;
