import { Text, TouchableHighlight } from 'react-native';

export default function CustomButton({ label, onPress }) {
  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={'#F44336'}
      style={{
        backgroundColor: '#FF5722',
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
