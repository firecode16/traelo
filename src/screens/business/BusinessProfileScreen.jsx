import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Switch,
  Modal,
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
    acceptCash: false,
    acceptTransfer: false,
    bankClabe: '',
    bankCard: '',
  });
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(true);

  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('userInfo');
        if (stored) {
          const user = JSON.parse(stored);
          console.log('user ID:', user.userId);

          setProfile(user);
          setForm({
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            description: user.description || '',
            address: user.address || '',
            updatedAt: new Date().toISOString(),

            acceptCash: user.acceptCash || false,
            acceptTransfer: user.acceptTransfer || false,
            bankClabe: user.bankClabe || '',
            bankCard: user.bankCard || '',
          });
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleEditToggle = () => {
    setEditable(!editable);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentMethodChange = (method, value) => {
    setForm((prev) => ({
      ...prev,
      [method === 'cash' ? 'acceptCash' : 'acceptTransfer']: value,
    }));

    // If the transfer is disabled, clear the bank fields
    if (method === 'transfer' && !value) {
      setForm((prev) => ({
        ...prev,
        bankClabe: '',
        bankCard: '',
      }));
    }
  };

  const showValidationModal = (message) => {
    setModalMessage(message);
    setValidationModalVisible(true);
  };

  const showSuccessModal = (message) => {
    setModalMessage(message);
    setSuccessModalVisible(true);
  };

  const showErrorModal = (message) => {
    setModalMessage(message);
    setErrorModalVisible(true);
  };

  const validateForm = () => {
    if (form.acceptTransfer && !form.bankClabe.trim()) {
      showValidationModal('La CLABE es requerida cuando se acepta transferencia bancaria.');
      return false;
    }
    
    // Validate CLABE format (18 dígitos)
    if (form.acceptTransfer && form.bankClabe.trim() && !/^\d{18}$/.test(form.bankClabe.trim())) {
      showValidationModal('La CLABE debe tener exactamente 18 dígitos.');
      return false;
    }
    
    // Validate card format (16 dígitos, optional)
    if (form.bankCard && !/^\d{16}$/.test(form.bankCard.trim())) {
      showValidationModal('El número de tarjeta debe tener exactamente 16 dígitos.');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const updated = { ...profile, ...form };
      await AsyncStorage.setItem('userInfo', JSON.stringify(updated));
      setProfile(updated);

      await updateUser(profile.userId, {
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
      });

      await updateBusinessByUser(profile.userId, updated);

      setEditable(false);
      showSuccessModal('Los cambios han sido guardados.');
    } catch (err) {
      showErrorModal('No se pudieron guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ marginTop: 10 }}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.title}>👤 Perfil del Negocio</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nombre del negocio</Text>
              <TextInput
                style={[styles.input, { color: "#000" }, !editable && styles.disabled]}
                editable={editable}
                value={form.fullName}
                onChangeText={(text) => handleChange('fullName', text)}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={[styles.input, { color: "#000" }, !editable && styles.disabled]}
                editable={editable}
                keyboardType="email-address"
                value={form.email}
                onChangeText={(text) => handleChange('email', text)}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Número de Celular</Text>
              <TextInput
                style={[styles.input, { color: "#000" }, !editable && styles.disabled]}
                editable={editable}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(text) => handleChange('phone', text)}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Descripción del negocio</Text>
              <TextInput
                style={[styles.input, { color: "#000" }, !editable && styles.disabled]}
                editable={editable}
                placeholder="Eje. Somos un negocio familiar..."
                placeholderTextColor="#a7a7a7ff"
                value={form.description}
                onChangeText={(text) => handleChange('description', text)}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Dirección del negocio</Text>
              <TextInput
                style={[styles.input, { color: "#000" }, !editable && styles.disabled]}
                editable={editable}
                value={form.address}
                onChangeText={(text) => handleChange('address', text)}
              />
            </View>

            {/* Payment Methods Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💳 Métodos de Pago Aceptados</Text>
              
              <View style={styles.paymentMethod}>
                <View style={styles.paymentMethodRow}>
                  <Text style={styles.paymentMethodLabel}>Efectivo</Text>
                  <Switch
                    value={form.acceptCash}
                    onValueChange={(value) => handlePaymentMethodChange('cash', value)}
                    disabled={!editable}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={form.acceptCash ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>
              </View>
              
              <View style={styles.paymentMethod}>
                <View style={styles.paymentMethodRow}>
                  <Text style={styles.paymentMethodLabel}>Transferencia Bancaria</Text>
                  <Switch
                    value={form.acceptTransfer}
                    onValueChange={(value) => handlePaymentMethodChange('transfer', value)}
                    disabled={!editable}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={form.acceptTransfer ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>
                
                {form.acceptTransfer && (
                  <View style={styles.bankDetails}>
                    <Text style={styles.label}>CLABE Interbancaria *</Text>
                    <TextInput
                      style={[styles.input, { color: "#000" }, !editable && styles.disabled]}
                      editable={editable}
                      placeholder="18 dígitos"
                      placeholderTextColor="#9e9e9e"
                      keyboardType="numeric"
                      value={form.bankClabe}
                      onChangeText={(text) => handleChange('bankClabe', text)}
                      maxLength={18}
                    />
                    
                    <Text style={styles.label}>Número de Tarjeta (Opcional)</Text>
                    <TextInput
                      style={[styles.input, { color: "#000" }, !editable && styles.disabled]}
                      editable={editable}
                      placeholder="16 dígitos"
                      placeholderTextColor="#9e9e9e"
                      keyboardType="numeric"
                      value={form.bankCard}
                      onChangeText={(text) => handleChange('bankCard', text)}
                      maxLength={16}
                    />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.buttonEdit}
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
                <TouchableOpacity style={styles.buttonSave} onPress={handleSave}>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Guardar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Validation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={validationModalVisible}
        onRequestClose={() => setValidationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={24} color="#f59e0b" />
              <Text style={styles.modalTitle}>Validación</Text>
            </View>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.validationButton]}
              onPress={() => setValidationModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.modalTitle}>Éxito</Text>
            </View>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
              <Text style={styles.modalTitle}>Error</Text>
            </View>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.errorButton]}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    padding: 20,
    backgroundColor: '#fff',
    minHeight: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 30,
    textAlign: 'center',
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  disabled: {
    backgroundColor: '#f4f4f4',
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    marginBottom: 40,
  },
  buttonEdit: {
    flexDirection: 'row',
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSave: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  paymentMethod: {
    marginBottom: 15,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentMethodLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  bankDetails: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalMessage: {
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
  validationButton: {
    backgroundColor: '#f59e0b',
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  errorButton: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BusinessProfileScreen;