import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Ionicons } from '@expo/vector-icons';

import LogoTraelo from '../../assets/images/main_logo_traelo.png';
import CustomButton from '../../components/CustomButton';
import InputField from '../../components/InputField';
import { COLOR } from '../../constants/Color';
import { loginUser, getUserInfo } from '../../services/AuthService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Campo requerido';
    if (!password.trim()) newErrors.password = 'Campo requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const token = await loginUser({ identifier: email.trim(), password });
      const userData = await getUserInfo(token);
      
      const role = userData.roles?.[0]?.replace('ROLE_', '') || 'CUSTOMER';

      navigation.reset({
        index: 0,
        routes: [{ name: 'RoleRouter', params: { role } }],
      });
    } catch (err) {
      setErrorMessage(err.message || 'Usuario no encontrado');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeView}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              <StatusBar animated={true} style="light" />

              <View style={{ alignItems: 'center' }}>
                <Image source={LogoTraelo} style={styles.logo} />
              </View>

              <Text style={styles.subtitle}>Centro comercial</Text>

              <InputField
                label={'Email o usuario'}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors((prev) => ({ ...prev, email: null }));
                }}
                icon={
                  <AntDesign
                    name="user"
                    size={20}
                    color="#666"
                    style={{ marginRight: 5 }}
                  />
                }
                error={errors.email}
              />

              <InputField
                label={'Password'}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors((prev) => ({ ...prev, password: null }));
                }}
                icon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#666"
                    style={{ marginRight: 5 }}
                  />
                }
                inputType="password"
                error={errors.password}
              />

              {isLoading ? (
                <ActivityIndicator
                  size="large"
                  color={COLOR.green}
                  style={{ marginVertical: 20 }}
                />
              ) : (
                <CustomButton label={'Iniciar sesión'} onPress={handleLogin} />
              )}

              <View style={styles.registerPrompt}>
                <Text style={styles.promptText}>¿Eres nuevo usuario?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={styles.registerLink}> Regístrate</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.recoveryPrompt}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('RecoveryPassword')}
                >
                  <Text style={styles.recoveryLink}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        {showErrorModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Error</Text>
              <Text style={styles.modalMessage}>{errorMessage}</Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.modalButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeView: {
    flex: 1,
    backgroundColor: COLOR.lightGray,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    top: 20,
    resizeMode: 'contain',
  },
  subtitle: {
    fontFamily: 'Roboto-Medium',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '500',
    color: '#515151ff',
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: 2,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  recoveryPrompt: {
    alignItems: 'center',
    marginTop: 20,
  },
  promptText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 15,
    color: '#666',
  },
  registerLink: {
    fontSize: 16,
    color: '#3498DB',
    fontFamily: 'Roboto-Medium',
  },
  recoveryLink: {
    fontSize: 15,
    color: '#E74C3C',
    fontFamily: 'Roboto-Medium',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#E63946',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LoginScreen;
