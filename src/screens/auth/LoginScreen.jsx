import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  StatusBar,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';

import LogoTraelo from '../../assets/images/main_logo_traelo.png';

import CustomButton from '../../components/CustomButton';
import InputField from '../../components/InputField';
import { COLOR } from '../../constants/Color';

const LoginScreen = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState('Cliente');

  return (
    <SafeAreaView style={styles.safeView}>
      <View style={styles.container}>
        <StatusBar animated={true} style="light" />

        <View style={{ alignItems: 'center' }}>
          <Image
            source={LogoTraelo}
            style={{
              width: 250,
              height: 250,
              resizeMode: 'contain',
            }}
          />
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: 'Roboto-Medium',
              fontSize: 20,
              fontWeight: '500',
              color: '#333',
              marginBottom: 30,
            }}
          >
            Tu antojo, directo a tu casa
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Selecciona tu rol:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedRole}
              onValueChange={(itemValue) => setSelectedRole(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Cliente" value="Cliente" />
              <Picker.Item label="Negocio" value="Negocio" />
              <Picker.Item label="Repartidor" value="Repartidor" />
              <Picker.Item label="Administrador" value="Administrador" />
            </Picker>
          </View>
        </View>

        <InputField
          label={'Email'}
          icon={
            <MaterialIcons
              name="alternate-email"
              size={20}
              color="#666"
              style={{ marginRight: 5 }}
            />
          }
          keyboardType="email-address"
        />

        <InputField
          label={'Password'}
          icon={
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#666"
              style={{ marginRight: 5 }}
            />
          }
          inputType="password"
          fieldButtonLabel={'Lo olvidaste?'}
          fieldButtonFunction={() => {}}
        />

        <CustomButton
          label={'Iniciar sesión'}
          onPress={() => {
            navigation.replace('Home', { role: selectedRole });
          }}
        />

        <Text
          style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: 30,
            fontSize: 15,
            fontFamily: 'Roboto-Medium',
          }}
        >
          O, inicia sesión con...
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 30,
          }}
        >
          <TouchableOpacity
            onPress={() => {}}
            style={{
              borderColor: '#ddd',
              borderWidth: 2,
              borderRadius: 10,
              paddingHorizontal: 70,
              paddingVertical: 10,
            }}
          >
            <FontAwesome name="google" size={25} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {}}
            style={{
              borderColor: '#ddd',
              borderWidth: 2,
              borderRadius: 10,
              paddingHorizontal: 70,
              paddingVertical: 10,
            }}
          >
            <FontAwesome name="facebook-f" size={25} color="#039BE5" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 30,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              color: '#666',
              fontSize: 15,
              fontFamily: 'Roboto-Medium',
            }}
          >
            Eres nuevo usuario?
          </Text>
          <TouchableOpacity onPress={() => {}}>
            <Text
              style={{
                color: '#3498DB',
                fontWeight: '700',
                fontFamily: 'Roboto-Medium',
              }}
            >
              {' '}
              Registrate
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeView: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: COLOR.lightGray,
  },
  container: {
    backgroundColor: COLOR.lightGray,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 16,
  },

  picker: {
    height: 50,
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
