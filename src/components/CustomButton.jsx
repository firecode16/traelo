import { Text, TouchableHighlight } from 'react-native';
import { COLOR } from '../constants/Color';

export default function CustomButton({ label, onPress }) {
  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={'#00df73da'}
      style={{
        backgroundColor: COLOR.green,
        padding: 20,
        borderRadius: 10,
        marginBottom: 30,
      }}
    >
      <Text
        style={{
          textAlign: 'center',
          fontWeight: '700',
          fontSize: 16,
          color: '#FFF',
          fontFamily: 'Roboto-Medium',
        }}
      >
        {label}
      </Text>
    </TouchableHighlight>
  );
}
