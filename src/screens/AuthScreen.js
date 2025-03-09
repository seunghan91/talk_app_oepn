import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function AuthScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleRequestCode = () => {
    // TODO: call /auth/request_code
    // on success, prompt user to input code or navigate
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Enter Phone Number</Text>
      <TextInput
        style={{ borderWidth: 1, width: 200 }}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />
      <Button title="Request Code" onPress={handleRequestCode} />
    </View>
  );
}