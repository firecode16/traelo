import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { COLOR } from '../../constants/Color';

const TermsScreen = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Términos y Condiciones - Traelo App</Text>
      <Text style={styles.effectiveDate}>Última actualización: 12/08/2025</Text>

      <Text style={styles.sectionTitle}>1. Aceptación</Text>
      <Text style={styles.paragraph}>
        Al usar Traelo App aceptas estos Términos y Condiciones. Si no estás de
        acuerdo, no podrás utilizar la plataforma.
      </Text>

      <Text style={styles.sectionTitle}>2. Descripción del servicio</Text>
      <Text style={styles.paragraph}>
        Traelo App es un centro comercial digital multisectorial donde negocios
        pueden publicar productos y servicios. Los usuarios pueden realizar
        pedidos para recoger, recibir a domicilio o recibir en puntos definidos
        por el negocio.
        {'\n\n'}
        Cada negocio administra su catálogo, precios, zonas de cobertura y logística.
        Traelo App solo provee la plataforma tecnológica.
      </Text>

      <Text style={styles.sectionTitle}>3. Registro</Text>
      <Text style={styles.paragraph}>
        Para usar ciertas funciones debes crear una cuenta. Aceptas proporcionar
        información verdadera y mantener la seguridad de tus credenciales.
      </Text>

      <Text style={styles.sectionTitle}>4. Pedidos y pagos</Text>
      <Text style={styles.paragraph}>
        Los precios y disponibilidad son establecidos por cada negocio.
        Traelo App no modifica precios ni interviene en la relación comercial.
        Los pagos se realizan mediante los métodos habilitados dentro de la app
        o según indicación del negocio.
      </Text>

      <Text style={styles.sectionTitle}>5. Entregas</Text>
      <Text style={styles.paragraph}>
        Las entregas son responsabilidad del negocio, ya sea con su propio
        personal o repartidores independientes. Cualquier incidencia debe ser
        gestionada directamente con el negocio.
      </Text>

      <Text style={styles.sectionTitle}>6. Conducta del usuario</Text>
      <Text style={styles.paragraph}>
        No puedes usar la app para actividades ilegales, publicar información
        falsa o realizar pedidos con intención de fraude.
      </Text>

      <Text style={styles.sectionTitle}>7. Propiedad intelectual</Text>
      <Text style={styles.paragraph}>
        Todo el contenido y marca de Traelo App pertenece a sus respectivos
        propietarios. No está permitido copiar, modificar o distribuir el
        contenido sin permiso.
      </Text>

      <Text style={styles.sectionTitle}>8. Tarifas</Text>
      <Text style={styles.paragraph}>
        Los negocios pagan una membresía mensual de $369 MXN por el uso de la
        plataforma. No se cobran comisiones por venta ni comisiones por envío.
      </Text>

      <Text style={styles.sectionTitle}>9. Responsabilidad</Text>
      <Text style={styles.paragraph}>
        Traelo App no es responsable por la calidad de productos, retrasos,
        entregas, precios, errores en pedidos o daños derivados del uso de la
        plataforma. Cada negocio es responsable de su operación.
      </Text>

      <Text style={styles.sectionTitle}>10. Modificaciones</Text>
      <Text style={styles.paragraph}>
        Podemos actualizar estos términos. Cualquier cambio importante será
        informado dentro de la app.
      </Text>

      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Contacto</Text>
        <Text style={styles.paragraph}>
          Si tienes preguntas sobre estos términos:
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
    textAlign: 'justify',
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

export default TermsScreen;
