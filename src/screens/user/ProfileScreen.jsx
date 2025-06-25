import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { COLOR } from '../../constants/Color';

const ProfileScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar animated={true} style="light" />
      <Text style={styles.title}>Pantalla del perfil del usuario</Text>
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
export default ProfileScreen;
