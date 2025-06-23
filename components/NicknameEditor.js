import React, { useState } from 'react';
import { View, TextInput, Button, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedView, ThemedText } from './ThemedView';
import axiosInstance from '../app/lib/axios';

/**
 * 닉네임 편집 컴포넌트
 * @param {Object} props
 * @param {string} props.initialNickname - 초기 닉네임
 * @param {Function} props.onSave - 저장 성공 시 콜백 함수
 * @param {Function} props.onCancel - 취소 시 콜백 함수
 */
const NicknameEditor = ({ initialNickname, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState(initialNickname || '');
  const [isLoading, setIsLoading] = useState(false);

  // 랜덤 닉네임 생성
  const generateRandomNickname = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get('/users/random_nickname');
      setNickname(res.data.nickname);
    } catch (err) {
      console.log('랜덤 닉네임 생성 실패:', err.response?.data);
      Alert.alert(t('common.error'), t('profile.generateNicknameError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 닉네임 변경
  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert(t('common.error'), t('profile.nicknameRequired'));
      return;
    }

    try {
      setIsLoading(true);
      const res = await axiosInstance.post('/users/change_nickname', {
        nickname
      });
      
      Alert.alert(t('common.success'), t('profile.changeNicknameSuccess'));
      
      // 부모 컴포넌트에 저장 성공 알림
      if (onSave) {
        onSave(res.data.user.nickname);
      }
    } catch (err) {
      console.log('닉네임 변경 실패:', err.response?.data);
      Alert.alert(t('common.error'), t('profile.changeNicknameError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder={t('profile.enterNickname')}
        disabled={isLoading}
      />
      
      <TouchableOpacity 
        style={styles.randomButton}
        onPress={generateRandomNickname}
        disabled={isLoading}
      >
        <ThemedText>{t('profile.generateRandomNickname')}</ThemedText>
      </TouchableOpacity>
      
      <ThemedView style={styles.buttonRow}>
        <Button 
          title={t('common.cancel')} 
          onPress={onCancel} 
          disabled={isLoading} 
        />
        <Button 
          title={isLoading ? t('common.processing') : t('common.save')} 
          onPress={handleSave} 
          disabled={isLoading || !nickname.trim()} 
        />
      </ThemedView>
      
      <ThemedText style={styles.paymentNotice}>
        {t('profile.paymentNotice')}
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  randomButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  paymentNotice: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default NicknameEditor; 