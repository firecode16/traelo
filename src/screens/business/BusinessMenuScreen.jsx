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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR } from '../../constants/Color';
import {
  getMenusByBusiness,
  createMenu,
  updateMenu,
  deleteMenu,
} from '../../services/MenuService';

const BusinessMenuScreen = () => {
  const [image, setImage] = useState(null); // base64
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '' });
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [businessId, setBusinessId] = useState(null);

  useEffect(() => {
    const loadMenus = async () => {
      const stored = await AsyncStorage.getItem('userInfo');
      const user = JSON.parse(stored);
      setBusinessId(user.userId);
      const data = await getMenusByBusiness(user.userId);
      setMenus(data);
      setLoading(false);
    };

    loadMenus();
  }, []);

  const openModal = (menu = null) => {
    if (menu) {
      setForm({
        name: menu.name,
        description: menu.description,
        price: menu.price.toString(),
      });
      setEditingMenuId(menu.id);
    } else {
      setForm({ name: '', description: '', price: '' });
      setEditingMenuId(null);
    }
    setModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permiso:', status);

      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.7,
      });

      console.log('Resultado galería:', result);

      if (!result.canceled && result.assets.length > 0) {
        setImage(result.assets[0].base64);
      }
    } catch (err) {
      console.error('Error al abrir galería:', err);
      Alert.alert('Error', err.message);
    }
  };

  const handleSave = async () => {
    const payload = {
      businessId,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      imageBase64: image,
    };

    try {
      if (editingMenuId) {
        await updateMenu(editingMenuId, payload);
      } else {
        await createMenu(payload);
      }

      const updatedMenus = await getMenusByBusiness(businessId);
      setMenus(updatedMenus);
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar el menú.');
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
          const updatedMenus = await getMenusByBusiness(businessId);
          setMenus(updatedMenus);
        },
      },
    ]);
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
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
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
      <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
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
              {editingMenuId ? 'Editar Menú' : 'Nuevo Menú'}
            </Text>

            <TextInput
              placeholder="Nombre"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              style={styles.input}
            />
            <TextInput
              placeholder="Descripción"
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              style={styles.input}
            />
            <TextInput
              placeholder="Precio"
              keyboardType="numeric"
              value={form.price}
              onChangeText={(text) => setForm({ ...form, price: text })}
              style={styles.input}
            />
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              <Text style={styles.imagePickerText}>
                {image ? 'Cambiar imagen' : 'Seleccionar imagen'}
              </Text>
            </TouchableOpacity>

            {image && (
              <Image
                source={{ uri: `data:image/jpeg;base64,${image}` }}
                style={{
                  width: '100%',
                  height: 150,
                  marginVertical: 10,
                  borderRadius: 8,
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
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
});

export default BusinessMenuScreen;
