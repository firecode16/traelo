import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { COLOR } from '../../constants/Color';

const PrivacyScreen = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Política de Privacidad - Traelo</Text>
      <Text style={styles.effectiveDate}>Última actualización: 08/19/2025</Text>

      <Text style={styles.paragraph}>
        En Traelo, respetamos tu privacidad y nos comprometemos a proteger la
        información personal que compartes con nosotros. Esta política describe
        cómo recopilamos, usamos y protegemos tus datos.
      </Text>

      <Text style={styles.sectionTitle}>Información que recopilamos</Text>
      <Text style={styles.paragraph}>
        • Datos personales que proporcionas al registrarte en la aplicación
        (nombre, correo electrónico, etc.).
        {'\n'}• Datos de uso, como interacciones dentro de la aplicación.
        {'\n'}• Datos de ubicación, solo cuando son necesarios para el
        funcionamiento de la app (por ejemplo, entregas).
      </Text>

      <Text style={styles.sectionTitle}>Uso de la información</Text>
      <Text style={styles.paragraph}>
        Utilizamos la información recopilada para:
        {'\n\n'}• Proporcionar y mejorar nuestros servicios.
        {'\n'}• Procesar pedidos y entregas.
        {'\n'}• Enviar notificaciones relacionadas con el servicio.
      </Text>

      <Text style={styles.sectionTitle}>Compartir información</Text>
      <Text style={styles.paragraph}>
        No compartimos tu información personal con terceros, excepto cuando sea
        necesario para cumplir con la ley o para prestar el servicio (por
        ejemplo, con negocios).
      </Text>

      <Text style={styles.sectionTitle}>Seguridad</Text>
      <Text style={styles.paragraph}>
        Implementamos medidas de seguridad para proteger tus datos personales
        contra accesos no autorizados.
      </Text>

      <Text style={styles.sectionTitle}>Cambios en esta política</Text>
      <Text style={styles.paragraph}>
        Podemos actualizar esta política en el futuro. Notificaremos cualquier
        cambio importante a través de la aplicación.
      </Text>

      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Contacto</Text>
        <Text style={styles.paragraph}>
          Si tienes preguntas sobre esta política, puedes escribirnos a:
        </Text>
        <Text style={styles.contactEmail}>hfredi35@gmail.com</Text>
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
    color: COLOR.orange,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default PrivacyScreen;
