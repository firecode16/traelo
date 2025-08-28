// TermsScreen.jsx
import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { COLOR } from '../../constants/Color';

const TermsScreen = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Términos y Condiciones de Traelo</Text>
      <Text style={styles.effectiveDate}>Última actualización: 08/19/2025</Text>

      <Text style={styles.sectionTitle}>1. Aceptación de los Términos</Text>
      <Text style={styles.paragraph}>
        Al acceder y utilizar la aplicación móvil Traelo (en adelante, la
        "App"), usted acepta estar legalmente obligado por estos Términos y
        Condiciones de Uso (los "Términos"). Si no está de acuerdo con alguno de
        estos Términos, no podrá usar la App.
      </Text>

      <Text style={styles.sectionTitle}>2. Descripción del Servicio</Text>
      <Text style={styles.paragraph}>
        Traelo es una plataforma que conecta a negocios de comida con clientes
        finales, ofreciendo lo mejor de servicios de entrega a domicilio y menús
        digitales. Los restaurantes y establecimientos de comida (en adelante,
        "Negocios") pueden publicar sus productos y menús, y los clientes (en
        adelante, "Usuarios") pueden realizar pedidos a través de la App,
        eligiendo entre entrega a domicilio o recoger en el local.
      </Text>

      <Text style={styles.sectionTitle}>3. Registro</Text>
      <Text style={styles.paragraph}>
        Para utilizar ciertas funcionalidades de la App, deberá registrarse
        creando una cuenta. Usted se compromete a:
        {'\n\n'}a) Proporcionar información veraz, exacta y completa.
        {'\n\n'}b) Mantener la confidencialidad de su contraseña.
        {'\n\n'}c) Ser responsable de todas las actividades que ocurran bajo su
        cuenta.
      </Text>

      <Text style={styles.sectionTitle}>4. Pedidos y Pagos</Text>
      <Text style={styles.paragraph}>
        Los Usuarios pueden realizar pedidos a través de la App. Los precios de
        los productos son establecidos por los Negocios. Traelo no interviene en
        la fijación de precios. Los pagos se realizan a través de los métodos
        disponibles en la App (tarjeta de crédito/débito, efectivo, etc.).
        Traelo no se responsabiliza por la calidad de los productos, que es
        responsabilidad exclusiva del Negocio.
      </Text>

      <Text style={styles.sectionTitle}>5. Entregas</Text>
      <Text style={styles.paragraph}>
        Los Negocios son responsables de la entrega de los pedidos, ya sea a
        través de sus propios repartidores o servicios de entrega contratados
        por ellos. Traelo actúa únicamente como intermediario. Cualquier retraso
        o incidencia en la entrega debe ser gestionada directamente con el
        Negocio.
      </Text>

      <Text style={styles.sectionTitle}>6. Conducta Prohibida</Text>
      <Text style={styles.paragraph}>
        Usted se compromete a no:
        {'\n\n'}a) Usar la App con fines ilegales o no autorizados.
        {'\n\n'}b) Publicar contenido ofensivo, fraudulento o engañoso.
        {'\n\n'}c) Realizar pedidos falsos o con intención de estafar.
      </Text>

      <Text style={styles.sectionTitle}>7. Propiedad Intelectual</Text>
      <Text style={styles.paragraph}>
        Todos los derechos de propiedad intelectual sobre la App y su contenido
        son propiedad de Traelo o sus licenciantes. Queda prohibida la
        reproducción, distribución o modificación sin autorización expresa.
      </Text>

      <Text style={styles.sectionTitle}>
        8. Tarifas y Limitación de Responsabilidad
      </Text>
      <Text style={styles.paragraph}>
        Los Negocios pagan una tarifa mensual de $350 MXN por el uso de la
        plataforma. Traelo no será responsable por daños indirectos,
        incidentales o consecuentes derivados del uso de la App. En ningún caso
        la responsabilidad total de Traelo excederá el monto equivalente a 6
        meses de la tarifa mensual ($2,100 MXN).
      </Text>

      <Text style={styles.sectionTitle}>9. Modificaciones</Text>
      <Text style={styles.paragraph}>
        Traelo se reserva el derecho de modificar estos Términos en cualquier
        momento. Las versiones actualizadas se publicarán en la App. El uso
        continuado de la App después de dichas modificaciones constituirá su
        consentimiento.
      </Text>

      <Text style={styles.sectionTitle}>10. Ley Aplicable</Text>
      <Text style={styles.paragraph}>
        Estos Términos se regirán por las leyes de México. Cualquier disputa se
        someterá a los tribunales competentes de la Ciudad de México.
      </Text>

      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Contacto</Text>
        <Text style={styles.paragraph}>
          Si tienes preguntas sobre estos Términos y Condiciones, puedes
          escribirnos a:
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
    paddingHorizontal: 25,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 10,
    color: COLOR.black,
    marginHorizontal: 10,
  },
  effectiveDate: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 15,
    marginBottom: 5,
    color: COLOR.black,
    marginHorizontal: 5,
  },
  paragraph: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginBottom: 15,
    color: '#333',
    lineHeight: 20,
    marginHorizontal: 5,
    textAlign: 'justify',
  },
  contactSection: {
    marginTop: 10,
    marginBottom: 30,
    marginHorizontal: 5,
  },
  contactEmail: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: COLOR.orange,
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 5,
  },
});

export default TermsScreen;
