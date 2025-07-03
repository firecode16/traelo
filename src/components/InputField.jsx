import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InputField({
  label,
  icon,
  inputType,
  keyboardType = 'default',
  fieldButtonLabel,
  fieldButtonFunction,
  value,
  onChangeText,
  error,
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = inputType === 'password';

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, error && styles.inputErrorBorder]}>
        {icon && <View style={styles.icon}>{icon}</View>}

        <TextInput
          style={styles.input}
          placeholder={label}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={isPassword && !isPasswordVisible}
          placeholderTextColor="#999"
        />

        {/* Mostrar botón 👁 para contraseñas */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={{ marginLeft: 5 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        )}

        {/* Botón adicional al final del campo, si se define */}
        {fieldButtonLabel && (
          <TouchableOpacity onPress={fieldButtonFunction}>
            <Text style={styles.fieldButtonText}>{fieldButtonLabel}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error visible */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.3,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  icon: {
    marginRight: 8,
  },
  fieldButtonText: {
    color: '#3498DB',
    fontWeight: '700',
    fontSize: 13,
  },
  errorText: {
    color: '#E63946',
    fontSize: 13,
    marginTop: 4,
  },
  inputErrorBorder: {
    borderColor: '#E63946',
  },
});
