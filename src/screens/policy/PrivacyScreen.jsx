import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { COLOR } from '../../constants/Color';

const PrivacyScreen = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Política de Privacidad - Traelo App</Text>
      <Text style={styles.effectiveDate}>Última actualización: 12/08/2025</Text>

      <Text style={styles.paragraph}>
        En Traelo App cuidamos tu información. Esta política explica de forma clara
        qué datos recopilamos y cómo los usamos para brindar nuestros servicios.
      </Text>

      <Text style={styles.sectionTitle}>Información que recopilamos</Text>
      <Text style={styles.paragraph}>
        • Datos que proporcionas al registrarte: nombre, correo electrónico y número telefónico.
        {'\n'}• Datos de ubicación cuando son necesarios para pedidos, entregas o mostrar negocios cercanos.
        {'\n'}• Datos de uso dentro de la app para mejorar su funcionamiento.
      </Text>

      <Text style={styles.sectionTitle}>Cómo usamos tu información</Text>
      <Text style={styles.paragraph}>
        Usamos la información únicamente para:
        {'\n\n'}• Operar la plataforma.
        {'\n'}• Procesar pedidos y entregas.
        {'\n'}• Mostrar negocios cercanos según tu zona.
        {'\n'}• Mejorar la experiencia dentro de la app.
      </Text>

      <Text style={styles.sectionTitle}>Con quién compartimos tus datos</Text>
      <Text style={styles.paragraph}>
        Traelo App no vende ni comparte tu información con terceros. Solo se
        comparte con negocios o repartidores cuando es necesario para completar un pedido.
      </Text>

      <Text style={styles.sectionTitle}>Seguridad</Text>
      <Text style={styles.paragraph}>
        Aplicamos medidas razonables para proteger tus datos. Aunque ningún sistema
        es 100% infalible, trabajamos para mantener tu información segura.
      </Text>

      <Text style={styles.sectionTitle}>Cambios en esta política</Text>
      <Text style={styles.paragraph}>
        Cualquier actualización importante será informada dentro de la aplicación.
      </Text>

      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Contacto</Text>
        <Text style={styles.paragraph}>
          Si tienes dudas sobre esta política, escríbenos:
        </Text>
        <Text style={styles.contactEmail}>usuario@gmail.com</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.lightGray,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 10,
    color: COLOR.black,
  },
  effectiveDate: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 15,
    marginBottom: 5,
    color: COLOR.black,
  },
  paragraph: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginBottom: 15,
    color: '#333',
    lineHeight: 20,
  },
  contactSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  contactEmail: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: COLOR.green,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default PrivacyScreen;
