import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { COLOR } from '../../constants/Color';

import { registerUser } from '../../services/RegisterService';

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    role: '',
    fullName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState(null);

  const showModal = (title, message, action = null) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalAction(() => action);
    setModalVisible(true);
  };

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
    setErrors({ ...errors, [key]: null }); // limpiamos error al escribir
  };

  const validateForm = () => {
    let newErrors = {};

    if (!form.role) newErrors.role = 'Selecciona un rol válido';
    if (!form.fullName.trim()) newErrors.fullName = 'Nombre requerido';
    if (!form.username.trim()) newErrors.username = 'Usuario requerido';
    if (!form.email.trim()) newErrors.email = 'Email requerido';
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      newErrors.email = 'Email inválido';
    if (!form.phone.trim()) newErrors.phone = 'Número de Celular requerido';
    else if (!/^\d{10,}$/.test(form.phone))
      newErrors.phone = 'Número inválido (mínimo 10 dígitos)';
    if (!form.password) newErrors.password = 'Contraseña requerida';
    else if (form.password.length < 6)
      newErrors.password = 'Mínimo 6 caracteres';
    if (form.role === 'ROLE_BUSINESS' && !form.address.trim()) {
      newErrors.address = 'La dirección es obligatoria';
    }
    if (!acceptedTerms) {
      newErrors.terms = 'Debes aceptar los términos y política de privacidad';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (validateForm()) {
      console.log('Formulario válido:', form);
      setIsLoading(true);

      try {
        const userData = {
          userId: Date.now(),
          roles: [form.role],
          fullName: form.fullName,
          username: form.username,
          email: form.email,
          phone: form.phone,
          password: form.password,
          address: form.role === 'ROLE_BUSINESS' ? form.address : null,
          createdAt: new Date().toISOString(),
        };

        const result = await registerUser(userData);
        showModal('Éxito', 'Usuario registrado. Inicia sesión.', () => navigation.navigate('Login'));
      } catch (err) {
        showModal('Error', err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('Formulario inválido');
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLOR.lightGray }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.contentWrapper}>
            <Text style={styles.title}>Crea tu cuenta</Text>

            <Text style={styles.label}>Selecciona tu rol:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.role}
                onValueChange={(value) => handleChange('role', value)}
                style={styles.picker}
              >
                <Picker.Item
                  label="Selecciona tu rol..."
                  value=""
                  style={{ color: '#9e9e9eff' }}
                  enabled={false}
                />
                <Picker.Item label="Cliente" value="ROLE_CUSTOMER" />
                <Picker.Item label="Negocio" value="ROLE_BUSINESS" />
              </Picker>
              <Ionicons
                name="chevron-down"
                size={20}
                color="#555"
                style={styles.pickerIcon}
              />
            </View>
            {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}

            <TextInput
              style={[styles.input, { color: '#000' }]}
              placeholder={
                form.role === 'ROLE_BUSINESS' ? 'Nombre del negocio' : 'Nombre completo'
              }
              placeholderTextColor="#9e9e9eff"
              value={form.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}

            <TextInput
              style={[styles.input, { color: '#000' }]}
              placeholder="Usuario"
              placeholderTextColor="#9e9e9eff"
              value={form.username}
              onChangeText={(text) => handleChange('username', text)}
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}

            <TextInput
              style={[styles.input, { color: '#000' }]}
              placeholder="Correo electrónico"
              placeholderTextColor="#9e9e9eff"
              value={form.email}
              keyboardType="email-address"
              onChangeText={(text) => handleChange('email', text)}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            <TextInput
              style={[styles.input, { color: '#000' }]}
              placeholder="Número de Celular"
              placeholderTextColor="#9e9e9eff"
              value={form.phone}
              keyboardType="phone-pad"
              onChangeText={(text) => handleChange('phone', text)}
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, { color: '#000' }]}
                placeholder="Contraseña"
                placeholderTextColor="#9e9e9eff"
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(text) => handleChange('password', text)}
              />
              <TouchableOpacity
                onPress={toggleShowPassword}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {form.role === 'ROLE_BUSINESS' && (
              <>
                <Text style={styles.label}>Dirección del negocio</Text>
                <TextInput
                  placeholder="Ej. Calle 123, Col. Centro"
                  placeholderTextColor="#9e9e9eff"
                  value={form.address}
                  onChangeText={(text) => handleChange('address', text)}
                  style={[styles.input, { color: '#000' }]}
                />
                {errors.address && (
                  <Text style={styles.errorText}>{errors.address}</Text>
                )}
              </>
            )}

            <View style={styles.termsContainer}>
              <TouchableOpacity
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                style={styles.checkboxContainer}
              >
                <View
                  style={[styles.checkbox, acceptedTerms && styles.checked]}
                >
                  {acceptedTerms && (
                    <Ionicons name="checkmark" size={18} color="white" />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                Acepto los{' '}
                <Text
                  style={styles.link}
                  onPress={() => navigation.navigate('Terms')}
                >
                  Términos y Condiciones
                </Text>{' '}
                y la{' '}
                <Text
                  style={styles.link}
                  onPress={() => navigation.navigate('Privacy')}
                >
                  Política de Privacidad
                </Text>
              </Text>
            </View>
            {errors.terms && (
              <Text style={styles.errorText}>{errors.terms}</Text>
            )}

            {isLoading ? (
              <ActivityIndicator
                size="large"
                color={COLOR.orange}
                style={{ marginTop: 20, marginBottom: 30 }}
              />
            ) : (
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
              >
                <Text style={styles.registerButtonText}>Registrarme</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                if (modalAction) modalAction();
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
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
    paddingBottom: 40,
  },
  contentWrapper: {
    padding: 20,
    backgroundColor: COLOR.lightGray,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 20,
    color: COLOR.black,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLOR.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    elevation: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR.white,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 5,
    color: COLOR.black,
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
  registerButton: {
    backgroundColor: COLOR.orange,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  registerButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: COLOR.white,
    fontSize: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
    marginBottom: 5,
  },
  checkboxContainer: {
    marginRight: 10,
    marginTop: 3,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checked: {
    backgroundColor: COLOR.orange,
    borderColor: COLOR.orange,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLOR.black,
  },
  link: {
    color: COLOR.orange,
    textDecorationLine: 'underline',
    fontFamily: 'Poppins-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  modalButton: {
    backgroundColor: COLOR.orange,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
