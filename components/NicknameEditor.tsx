import React, { useState, useEffect } from 'react';
import { TextInput, Button, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import axiosInstance from '../app/lib/axios';
import { Ionicons } from '@expo/vector-icons';

interface NicknameEditorProps {
  initialNickname?: string;
  onSave: (nickname: string) => void;
  onCancel: () => void;
}

interface ApiResponse {
  user: {
    nickname: string;
    [key: string]: any;
  };
  [key: string]: any;
}

const NicknameEditor: React.FC<NicknameEditorProps> = ({ 
  initialNickname, 
  onSave, 
  onCancel 
}) => {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState<string>(initialNickname || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [randomNicknameGenerated, setRandomNicknameGenerated] = useState<boolean>(false);

  // 랜덤 닉네임 생성
  const generateRandomNickname = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get<{ nickname: string }>('/api/generate_random_nickname');
      
      // 랜덤 닉네임 설정 및 상태 업데이트
      setNickname(res.data.nickname);
      setRandomNicknameGenerated(true);
      
      // 사용자에게 피드백 제공
      Alert.alert(
        t('common.success'),
        t('profile.randomNicknameGenerated', { nickname: res.data.nickname }),
        [{ text: t('common.ok') }]
      );
    } catch (err: any) {
      console.log('랜덤 닉네임 생성 실패:', err.response?.data);
      Alert.alert(t('common.error'), t('profile.generateNicknameError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 닉네임 변경
  const handleSave = async (): Promise<void> => {
    if (!nickname.trim()) {
      Alert.alert(t('common.error'), t('profile.nicknameRequired'));
      return;
    }

    try {
      setIsLoading(true);
      const res = await axiosInstance.post<ApiResponse>('/api/change_nickname', {
        nickname
      });
      
      // 성공 메시지와 함께 변경된 닉네임 표시
      Alert.alert(
        t('common.success'), 
        t('profile.nicknameChangedTo', { nickname: res.data.user.nickname }),
        [{ text: t('common.ok') }]
      );
      
      // 부모 컴포넌트에 저장 성공 알림
      onSave(res.data.user.nickname);
    } catch (err: any) {
      console.log('닉네임 변경 실패:', err.response?.data);
      Alert.alert(t('common.error'), t('profile.changeNicknameError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={[
          styles.input, 
          randomNicknameGenerated && styles.highlightedInput
        ]}
        value={nickname}
        onChangeText={(text) => {
          setNickname(text);
          setRandomNicknameGenerated(false);
        }}
        placeholder={t('profile.enterNickname')}
        editable={!isLoading}
      />
      
      <TouchableOpacity 
        style={styles.randomButton}
        onPress={generateRandomNickname}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <ThemedView style={styles.buttonContent}>
            <Ionicons name="shuffle" size={16} color="#333" />
            <ThemedText style={styles.buttonText}>{t('profile.generateRandomNickname')}</ThemedText>
          </ThemedView>
        )}
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
  highlightedInput: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  randomButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    marginLeft: 8,
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