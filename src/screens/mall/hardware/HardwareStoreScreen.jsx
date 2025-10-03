import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import { COLOR } from '../../../constants/Color';

const HardwareStoreScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar animated={true} style="light" />
      <Text style={styles.title}>🧱 🛠 Ferreteria, proximamente...</Text>
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
export default HardwareStoreScreen;
