import React, { useState, useEffect, useRef } from 'react';
import { TextInput, Button, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, View } from 'react-native';
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
  message: string;
  user: {
    id: number;
    nickname: string;
  };
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
  const inputRef = useRef<TextInput>(null);

  // 랜덤 닉네임 생성 함수
  const generateRandomNicknameLocally = (): string => {
    const adjectives = ['행복한', '즐거운', '신나는', '멋진', '귀여운', '용감한', '똑똑한', '친절한', '재미있는', '활발한'];
    const nouns = ['고양이', '강아지', '토끼', '여우', '사자', '호랑이', '판다', '코끼리', '기린', '원숭이'];
    const randomNum = Math.floor(Math.random() * 1000);
    
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${randomAdj}${randomNoun}${randomNum}`;
  };

  // 랜덤 닉네임 생성
  const generateRandomNickname = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      let newNickname = '';
      
      try {
        // 서버에서 랜덤 닉네임 가져오기 시도
        const res = await axiosInstance.get<{ nickname: string }>('/api/generate_random_nickname');
        newNickname = res.data.nickname;
        console.log('서버에서 랜덤 닉네임 생성됨:', newNickname);
      } catch (error) {
        // 서버 요청 실패 시 로컬에서 생성
        console.log('서버 요청 실패, 로컬에서 랜덤 닉네임 생성');
        newNickname = generateRandomNicknameLocally();
        console.log('로컬에서 랜덤 닉네임 생성됨:', newNickname);
      }
      
      // 랜덤 닉네임 설정 및 상태 업데이트
      setNickname(newNickname);
      setRandomNicknameGenerated(true);
      
      // 입력 필드에 포커스 주기
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      // 사용자에게 피드백 제공
      Alert.alert(
        t('common.success'),
        t('profile.randomNicknameGenerated').replace('%{nickname}', newNickname),
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
      console.log('닉네임 변경 요청:', nickname);
      
      let savedNickname = nickname;
      
      try {
        // 서버에 닉네임 변경 요청
        const res = await axiosInstance.post<ApiResponse>('/api/change_nickname', {
          nickname
        });
        
        // 서버에서 반환된 닉네임 (서버에서 변경된 경우를 대비)
        savedNickname = res.data.user.nickname;
        console.log('닉네임 변경 성공 (서버):', savedNickname);
      } catch (error) {
        // 서버 요청 실패 시 로컬에서만 처리
        console.log('서버 요청 실패, 로컬에서만 닉네임 변경');
      }
      
      // 성공 메시지와 함께 변경된 닉네임 표시
      Alert.alert(
        t('common.success'), 
        t('profile.nicknameChangedTo').replace('%{nickname}', savedNickname),
        [{ 
          text: t('common.ok'),
          onPress: () => {
            // 부모 컴포넌트에 저장 성공 알림
            onSave(savedNickname);
          }
        }]
      );
    } catch (err: any) {
      console.log('닉네임 변경 실패:', err.response?.data);
      Alert.alert(t('common.error'), t('profile.changeNicknameError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder={t('profile.enterNickname')}
          editable={!isLoading}
          autoFocus
        />
        
        {isLoading && (
          <ActivityIndicator 
            style={styles.loadingIndicator} 
            size="small" 
            color="#007AFF" 
          />
        )}
      </ThemedView>
      
      <TouchableOpacity 
        style={[styles.randomButton, isLoading && styles.disabledButton]}
        onPress={generateRandomNickname}
        disabled={isLoading}
      >
        <Ionicons name="shuffle" size={16} color="#FFFFFF" style={styles.buttonIcon} />
        <ThemedText style={styles.buttonText}>{t('profile.generateRandomNickname')}</ThemedText>
      </TouchableOpacity>
      
      <ThemedView style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.cancelButton, isLoading && styles.disabledButton]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <ThemedText style={styles.cancelButtonText}>{t('common.cancel')}</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            (isLoading || !nickname.trim()) && styles.disabledButton
          ]}
          onPress={handleSave}
          disabled={isLoading || !nickname.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save" size={16} color="#FFFFFF" style={styles.buttonIcon} />
              <ThemedText style={styles.saveButtonText}>{t('common.save')}</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedText style={styles.infoText}>
        {t('profile.paymentNotice')}
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
  },
  randomButton: {
    backgroundColor: '#5856D6',
    padding: 10,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});

export default NicknameEditor; 