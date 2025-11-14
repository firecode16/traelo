import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';

import { updateUser } from '../../services/AuthService';
import { updateBusinessByUser } from '../../services/BusinessService';

const BusinessProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    description: '',
    address: '',
    updatedAt: '',
  });
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('userInfo');
      if (stored) {
        const user = JSON.parse(stored);
        setProfile(user);
        setForm({
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          description: user.description || '',
          address: user.address || '',
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    Keyboard.dismiss();
    setEditable(!editable);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const showModal = (message, type = 'success') => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleSave = async () => {
    setLoading(true);
    Keyboard.dismiss();

    try {
      const updated = { ...profile, ...form };
      await AsyncStorage.setItem('userInfo', JSON.stringify(updated));
      setProfile(updated);

      await updateUser(profile.userId, {
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
      });

      const businessData = {
        fullName: updated.fullName,
        description: updated.description,
        address: updated.address,
        isActive: true,
        updatedAt: new Date().toISOString(),
      };

      await updateBusinessByUser(profile.userId, businessData);

      setEditable(false);
      showModal('Los cambios han sido guardados.', 'success');
    } catch (err) {
      showModal('No se pudieron guardar los cambios.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CC86" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>👤 Perfil del Negocio</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre del negocio</Text>
          <TextInput
            style={[styles.input, !editable && styles.disabled]}
            editable={editable}
            value={form.fullName}
            onChangeText={(text) => handleChange('fullName', text)}
            onBlur={() => Keyboard.dismiss()}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={[styles.input, !editable && styles.disabled]}
            editable={editable}
            keyboardType="email-address"
            value={form.email}
            onChangeText={(text) => handleChange('email', text)}
            onBlur={() => Keyboard.dismiss()}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Número de Celular</Text>
          <TextInput
            style={[styles.input, !editable && styles.disabled]}
            editable={editable}
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(text) => handleChange('phone', text)}
            onBlur={() => Keyboard.dismiss()}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descripción del negocio</Text>
          <TextInput
            style={[styles.input, !editable && styles.disabled]}
            editable={editable}
            placeholder="Eje. Somos un negocio familiar..."
            placeholderTextColor="#a7a7a7ff"
            value={form.description}
            onChangeText={(text) => handleChange('description', text)}
            onBlur={() => Keyboard.dismiss()}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Dirección del negocio</Text>
          <TextInput
            style={[styles.input, !editable && styles.disabled]}
            editable={editable}
            value={form.address}
            onChangeText={(text) => handleChange('address', text)}
            onBlur={() => Keyboard.dismiss()}
          />
        </View>

        {/* Botones dentro del ScrollView */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, editable ? styles.cancelButton : styles.editButton]}
            onPress={handleEditToggle}
          >
            <Ionicons
              name={editable ? 'close' : 'create-outline'}
              size={20}
              color="#fff"
            />
            <Text style={styles.buttonText}>
              {editable ? 'Cancelar' : 'Editar'}
            </Text>
          </TouchableOpacity>

          {editable && (
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Espacio extra para asegurar visibilidad */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal único y simple */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons 
                name={modalType === 'success' ? "checkmark-circle" : "close-circle"} 
                size={32} 
                color={modalType === 'success' ? "#00CC86" : "#EF4444"} 
              />
              <Text style={styles.modalTitle}>
                {modalType === 'success' ? 'Éxito' : 'Error'}
              </Text>
            </View>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, modalType === 'success' ? styles.successButton : styles.errorButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
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
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 150, // Espacio extra para los botones
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
    color: '#00CC86',
    marginBottom: 30,
    textAlign: 'center',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#000',
    backgroundColor: '#fff',
  },
  disabled: {
    backgroundColor: '#f4f4f4',
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  editButton: {
    backgroundColor: '#00CC86',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#00CC86',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
    fontSize: 16,
  },
  bottomSpacer: {
    height: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 12,
    color: '#111827',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 24,
    color: '#6B7280',
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: '#00CC86',
  },
  errorButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
});

export default BusinessProfileScreen;
