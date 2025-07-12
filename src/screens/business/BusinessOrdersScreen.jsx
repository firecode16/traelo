import { View, Text, StyleSheet, StatusBar } from 'react-native';

import { COLOR } from '../../constants/Color';

const BusinessOrdersScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar animated={true} style="light" />
      <Text style={styles.title}>Pantalla de pedidos</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.lightGray,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    lineHeight: 22,
  },
});
export default BusinessOrdersScreen;
