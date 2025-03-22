import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminSettings() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>관리자 설정</Text>
      <Text style={styles.subtitle}>여기에서 관리자 설정을 변경할 수 있습니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 