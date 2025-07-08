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
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
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

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
    if (!form.phone.trim()) newErrors.phone = 'Teléfono requerido';
    else if (!/^\d{10,}$/.test(form.phone))
      newErrors.phone = 'Teléfono inválido (mínimo 10 dígitos)';
    if (!form.password) newErrors.password = 'Contraseña requerida';
    else if (form.password.length < 6)
      newErrors.password = 'Mínimo 6 caracteres';
    if (form.role === 'ROLE_BUSINESS' && !form.address.trim()) {
      newErrors.address = 'La dirección es obligatoria';
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
        Alert.alert(
          'Éxito',
          'Usuario registrado. Inicia sesión.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ],
          { cancelable: false },
        );
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('Formulario inválido');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLOR.lightGray }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
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
                style={{ color: '#a6a6a6' }}
                enabled={false}
              />
              <Picker.Item label="Cliente" value="ROLE_CUSTOMER" />
              <Picker.Item label="Negocio" value="ROLE_BUSINESS" />
              <Picker.Item label="Repartidor" value="ROLE_RIDER" />
              <Picker.Item label="Administrador" value="ROLE_ADMIN" />
            </Picker>
          </View>
          {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}

          <TextInput
            style={styles.input}
            placeholder={
              form.role === 'ROLE_BUSINESS'
                ? 'Nombre del negocio'
                : 'Nombre completo'
            }
            value={form.fullName}
            onChangeText={(text) => handleChange('fullName', text)}
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Usuario"
            value={form.username}
            onChangeText={(text) => handleChange('username', text)}
          />
          {errors.username && (
            <Text style={styles.errorText}>{errors.username}</Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={form.email}
            keyboardType="email-address"
            onChangeText={(text) => handleChange('email', text)}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            value={form.phone}
            keyboardType="phone-pad"
            onChangeText={(text) => handleChange('phone', text)}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            secureTextEntry
            value={form.password}
            onChangeText={(text) => handleChange('password', text)}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {form.role === 'ROLE_BUSINESS' && (
            <>
              <Text style={styles.label}>Dirección del negocio</Text>
              <TextInput
                placeholder="Ej. Calle 123, Col. Centro"
                value={form.address}
                onChangeText={(text) => handleChange('address', text)}
                style={styles.input}
              />
              {errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}
            </>
          )}

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={COLOR.orange}
              style={{ marginTop: 20 }}
            />
          ) : (
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
            >
              <Text style={styles.registerButtonText}>Registrarme</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: COLOR.white,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 1,
  },
  picker: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  registerButton: {
    backgroundColor: COLOR.orange,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    fontFamily: 'Poppins-SemiBold',
    color: COLOR.white,
    fontSize: 16,
  },
});

export default RegisterScreen;
