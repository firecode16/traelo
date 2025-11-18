import { View, Text, StyleSheet, StatusBar } from 'react-native';

import { COLOR } from '../../../constants/Color';

const TechnologyCatalog = ({ navigation, route }) => {
  const { sector } = route.params || {};
  console.log('Sector recibido:', sector);

  return (
    <View style={styles.container}>
      <StatusBar animated={true} style="light" />
      <Text style={styles.title}>📱💻 Tecnología</Text>
      <Text style={styles.subtitle}>Sector: {sector?.name}</Text>
      <Text style={styles.subtitle}>
        Display Name: {sector?.displayNameProductTab}
      </Text>
      <Text style={styles.comingSoon}>Próximamente...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.white,
    padding: 20,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
    color: COLOR.gray,
  },
  comingSoon: {
    fontFamily: 'Poppins-Regular',
    fontSize: 18,
    marginTop: 20,
    color: COLOR.orange,
    textAlign: 'center',
  },
});

export default TechnologyCatalog;
