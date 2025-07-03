import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import { logoutUser } from '../../services/AuthService';
import { COLOR } from '../../constants/Color';

const RiderScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar animated={true} style="light" />
      <Text style={styles.title}>Pantalla del repartidor</Text>

      <TouchableOpacity onPress={() => logoutUser(navigation)}>
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
export default RiderScreen;
