import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { COLOR } from '../../constants/Color';

const BusinessScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar animated={true} style="light" />
      <Text style={styles.title}>Pantalla del negocio</Text>

      <TouchableOpacity
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        }
      >
        <Text
          style={{ color: 'red', fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
        >
          Cerrar sesión
        </Text>
      </TouchableOpacity>
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
export default BusinessScreen;
