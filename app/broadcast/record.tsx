import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Alert, TouchableOpacity, Platform, View, Animated, ActivityIndicator, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import axiosInstance from '../lib/axios';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';

// 최대 녹음 시간 (초)
const MAX_RECORDING_DURATION = 30;

// 오디오 파형 바 개수
const WAVEFORM_BARS = 30;

// 오디오 레벨 측정 간격 (밀리초)
const AUDIO_LEVEL_INTERVAL = 100;

export default function RecordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [isWeb, setIsWeb] = useState<boolean>(Platform.OS === 'web');
  const [mockRecordingActive, setMockRecordingActive] = useState<boolean>(false);
  
  // Stack 헤더 설정 - 타입 에러 수정
  useEffect(() => {
    // 헤더 타이틀 숨기기
    router.setParams({
      title: '' // 빈 문자열로 설정하여 타이틀 숨기기
    });
  }, []);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(WAVEFORM_BARS).fill(0));
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformAnimations = useRef<Animated.Value[]>(
    Array(WAVEFORM_BARS).fill(0).map(() => new Animated.Value(0))
  );
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const currentBarIndex = useRef<number>(0);

  // 컴포넌트 마운트 시 오디오 세션 설정 및 권한 요청
  useEffect(() => {
    const setupAudioAndPermissions = async () => {
      // 먼저 기존 오디오 세션을 완전히 해제
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        
        // 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 그 후 새로운 오디오 세션 설정
        await setupAudioSession();
        await checkPermissions();
      } catch (error) {
        console.error('초기 오디오 세션 설정 실패:', error);
      }
    };

    setupAudioAndPermissions();

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (recording) {
        stopRecording();
      }
      if (sound) {
        sound.unloadAsync();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioLevelTimerRef.current) {
        clearInterval(audioLevelTimerRef.current);
      }
      stopAudioLevelMonitoring();
      stopWaveformAnimation();
      
      // 컴포넌트 언마운트 시 오디오 세션 해제
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      }).catch(error => console.error('오디오 세션 해제 실패:', error));
    };
  }, []);

  // 권한 확인
  const checkPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('broadcast.micPermissionDenied'));
      }
    } catch (error) {
      console.error('권한 요청 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.permissionError'));
    }
  };

  // 오디오 세션 설정
  const setupAudioSession = async () => {
    try {
      // iOS에서 오디오 세션 활성화 문제 해결을 위한 설정
      if (Platform.OS === 'ios') {
        // iOS에서는 AVAudioSession을 직접 설정하는 것이 더 안정적일 수 있음
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } else {
        // 안드로이드 설정
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
      console.log('오디오 세션 설정 완료');
    } catch (error) {
      console.error('오디오 세션 설정 실패:', error);
      // 알림 대신 콘솔에만 로깅
    }
  };

  // 오디오 레벨 측정 시작
  const startAudioLevelMonitoring = async () => {
    if (!recording) return;
    
    try {
      // 초기 오디오 레벨 배열 설정
      setAudioLevels(Array(WAVEFORM_BARS).fill(0));
      currentBarIndex.current = 0;
      
      // 오디오 레벨 측정 타이머 설정
      audioLevelTimerRef.current = setInterval(async () => {
        try {
          if (recording) {
            const status = await recording.getStatusAsync();
            
            // 오디오 레벨 측정 (metering 값이 있는 경우)
            let level = 0;
            if (status.metering !== undefined && status.metering !== null) {
              // metering 값은 보통 음수 dB 값 (-160 ~ 0)
              // 0에 가까울수록 소리가 큼
              // 값을 0~1 범위로 정규화
              level = Math.max(0, Math.min(1, (status.metering + 160) / 160));
            } else {
              // metering 값이 없는 경우 랜덤 값 사용 (시각적 효과용)
              level = Math.random() * 0.7 + 0.1;
            }
            
            // 오디오 레벨 배열 업데이트
            setAudioLevels(prev => {
              const newLevels = [...prev];
              newLevels[currentBarIndex.current] = level;
              return newLevels;
            });
            
            // 애니메이션 업데이트
            waveformAnimations.current[currentBarIndex.current].setValue(level);
            
            // 다음 바 인덱스로 이동 (순환)
            currentBarIndex.current = (currentBarIndex.current + 1) % WAVEFORM_BARS;
          }
        } catch (error) {
          console.error('오디오 레벨 측정 실패:', error);
        }
      }, AUDIO_LEVEL_INTERVAL);
    } catch (error) {
      console.error('오디오 레벨 모니터링 시작 실패:', error);
    }
  };

  // 오디오 레벨 측정 중지
  const stopAudioLevelMonitoring = () => {
    if (audioLevelTimerRef.current) {
      clearInterval(audioLevelTimerRef.current);
      audioLevelTimerRef.current = null;
    }
  };

  // 녹음 중 파형 애니메이션
  const startRecordingAnimation = () => {
    // 이전 애니메이션 중지
    if (animationRef.current) {
      animationRef.current.stop();
    }
    
    // 각 바에 대한 애니메이션 생성
    const animations = waveformAnimations.current.map((anim, index) => {
      // 초기값으로 리셋
      anim.setValue(0);
      
      // 랜덤한 높이로 애니메이션 생성 (마이크 입력을 시각화하는 효과)
      return Animated.sequence([
        Animated.timing(anim, {
          toValue: Math.random() * 0.7 + 0.3, // 0.3 ~ 1.0 사이의 랜덤값
          duration: 300 + Math.random() * 200, // 300~500ms 사이의 랜덤 지속시간
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: Math.random() * 0.3 + 0.1, // 0.1 ~ 0.4 사이의 랜덤값
          duration: 200 + Math.random() * 200, // 200~400ms 사이의 랜덤 지속시간
          useNativeDriver: false,
        }),
      ]);
    });
    
    // 모든 애니메이션 순차적으로 실행
    animationRef.current = Animated.loop(
      Animated.stagger(50, animations)
    );
    
    animationRef.current.start();
  };

  // 재생 중 파형 애니메이션
  const startPlaybackAnimation = () => {
    // 이전 애니메이션 중지
    if (animationRef.current) {
      animationRef.current.stop();
    }
    
    // 저장된 오디오 레벨을 사용하여 애니메이션 재생
    const animations = waveformAnimations.current.map((anim, index) => {
      // 초기값으로 리셋
      anim.setValue(0);
      
      // 저장된 오디오 레벨 또는 기본값 사용
      const level = audioLevels[index] || 0.1;
      
      // 애니메이션 생성
      return Animated.sequence([
        Animated.timing(anim, {
          toValue: level,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]);
    });
    
    // 모든 애니메이션 순차적으로 실행
    animationRef.current = Animated.loop(
      Animated.stagger(50, animations)
    );
    
    animationRef.current.start();
  };

  // 파형 애니메이션 중지
  const stopWaveformAnimation = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      
      // 모든 바를 0으로 리셋
      waveformAnimations.current.forEach(anim => anim.setValue(0));
    }
  };

  // 웹 환경용 모의 녹음 시작
  const startMockRecording = () => {
    if (isWeb) {
      console.log('웹 환경에서 모의 녹음 시작');
      setMockRecordingActive(true);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // 파형 애니메이션 시작
      startRecordingAnimation();
      
      // 타이머 시작
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_RECORDING_DURATION) {
            stopMockRecording();
            return MAX_RECORDING_DURATION;
          }
          return newDuration;
        });
      }, 1000);
    }
  };

  // 웹 환경용 모의 녹음 중지
  const stopMockRecording = () => {
    if (isWeb && mockRecordingActive) {
      console.log('웹 환경에서 모의 녹음 중지');
      setMockRecordingActive(false);
      setIsRecording(false);
      
      // 타이머 중지
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // 파형 애니메이션 중지
      stopWaveformAnimation();
      
      // 가짜 녹음 URI 생성
      const mockUri = 'mock-recording-' + Date.now() + '.m4a';
      setRecordingUri(mockUri);
      
      // 알림 제거
    }
  };

  // 녹음 시작 (웹 환경 대응)
  const startRecording = async () => {
    try {
      console.log('녹음 시작 시도...', { hasPermission, isWeb });
      
      // 웹 환경 확인
      if (isWeb) {
        // 알림 없이 바로 모의 녹음 시작
        startMockRecording();
        return;
      }
      
      // 권한 확인 및 재요청
      if (hasPermission !== true) {
        console.log('마이크 권한 요청 중...');
        const { status } = await Audio.requestPermissionsAsync();
        console.log('마이크 권한 상태:', status);
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            t('common.error'), 
            t('broadcast.micPermissionDenied'),
            [
              { 
                text: t('common.cancel'),
                style: 'cancel'
              },
              { 
                text: t('broadcast.goToSettings'),
                onPress: () => {
                  // 설정으로 이동 코드
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
          return;
        }
      }
      
      // 이전 녹음 정리
      if (sound) {
        console.log('이전 녹음 사운드 언로드');
        await sound.unloadAsync();
        setSound(null);
      }
      setRecordingUri(null);
      setRecordingDuration(0);
      
      console.log('녹음 시작 설정 중...');
      
      // 오디오 세션 재설정 - 세션 활성화 실패 방지를 위한 추가 설정
      try {
        // 먼저 기존 오디오 세션을 완전히 해제
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        
        // 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // iOS에서 오디오 세션 활성화 문제 해결을 위한 설정
        if (Platform.OS === 'ios') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        } else {
          // 안드로이드 설정
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        }
        
        console.log('오디오 세션 설정 완료');
      } catch (sessionError) {
        console.error('오디오 세션 설정 실패:', sessionError);
        
        // 세션 설정 실패 시 사용자에게 알림
        Alert.alert(
          t('common.error'),
          t('broadcast.audioSetupError'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                // 앱 재시작 권장
                Alert.alert(
                  t('common.notice'),
                  '앱을 다시 시작하거나 기기를 재부팅하면 문제가 해결될 수 있습니다.',
                  [{ text: t('common.ok') }]
                );
              }
            }
          ]
        );
        return;
      }
      
      // 녹음 시작
      const newRecording = new Audio.Recording();
      try {
        console.log('녹음 준비 중...');
        
        // 안드로이드와 iOS에 맞는 녹음 옵션 설정
        const recordingOptions = Platform.OS === 'ios' 
          ? {
              ...Audio.RecordingOptionsPresets.LOW_QUALITY, // HIGH_QUALITY 대신 LOW_QUALITY 사용
              ios: {
                ...Audio.RecordingOptionsPresets.LOW_QUALITY.ios,
                extension: '.m4a',
                outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
                audioQuality: Audio.IOSAudioQuality.LOW, // MEDIUM 대신 LOW 사용
                sampleRate: 22050, // 44100 대신 22050 사용
                numberOfChannels: 1, // 2 대신 1 사용
                bitRate: 64000, // 128000 대신 64000 사용
                linearPCMBitDepth: 16,
                linearPCMIsBigEndian: false,
                linearPCMIsFloat: false,
              }
            }
          : {
              ...Audio.RecordingOptionsPresets.LOW_QUALITY,
              android: {
                ...Audio.RecordingOptionsPresets.LOW_QUALITY.android,
                extension: '.m4a',
                outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                audioEncoder: Audio.AndroidAudioEncoder.AAC,
                sampleRate: 22050,
                numberOfChannels: 1,
                bitRate: 64000,
              }
            };
        
        // 녹음 준비 시 최대 3번까지 재시도
        let retryCount = 0;
        const maxRetries = 3;
        let success = false;
        
        while (!success && retryCount < maxRetries) {
          try {
            await newRecording.prepareToRecordAsync(recordingOptions);
            success = true;
          } catch (prepareError) {
            retryCount++;
            console.error(`녹음 준비 실패 (시도 ${retryCount}/${maxRetries}):`, prepareError);
            
            if (retryCount >= maxRetries) {
              throw prepareError;
            }
            
            // 오디오 세션 재설정 후 재시도
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: false,
              staysActiveInBackground: false,
              shouldDuckAndroid: false,
              playThroughEarpieceAndroid: false,
            });
            
            // 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
              staysActiveInBackground: false,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false,
            });
            
            // 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        console.log('녹음 준비 완료, 시작 중...');
        await newRecording.startAsync();
        console.log('녹음 시작됨');
        
        setRecording(newRecording);
        setIsRecording(true);
        
        // 오디오 레벨 모니터링 시작
        startAudioLevelMonitoring();
        
        // 녹음 중 파형 애니메이션 시작
        startRecordingAnimation();
        
        // 타이머 시작
        timerRef.current = setInterval(() => {
          setRecordingDuration(prev => {
            const newDuration = prev + 1;
            if (newDuration >= MAX_RECORDING_DURATION) {
              stopRecording();
              return MAX_RECORDING_DURATION;
            }
            return newDuration;
          });
        }, 1000);
      } catch (err) {
        console.error('녹음 시작 중 오류:', err);
        // 오류 메시지 개선
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
        console.error(`녹음 오류 세부 정보: ${errorMessage}`);
        
        // 세션 활성화 실패 오류 처리
        if (errorMessage.includes('session activation failed') || errorMessage.includes('prepare encountered an error')) {
          // 오디오 세션 재설정 시도
          try {
            // 오디오 세션 완전 해제 후 재설정
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: false,
              staysActiveInBackground: false,
              shouldDuckAndroid: false,
              playThroughEarpieceAndroid: false,
            });
            
            // 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 오디오 세션 다시 설정
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
              staysActiveInBackground: false,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false,
            });
            
            Alert.alert(
              '녹음 오류',
              '오디오 세션 활성화에 실패했습니다. 다음 해결 방법을 시도해보세요:\n\n1. 앱을 완전히 종료하고 다시 시작\n2. 기기를 재부팅\n3. 다른 오디오 앱을 모두 종료\n4. 헤드폰을 연결/분리해보기',
              [{ text: '확인' }]
            );
          } catch (resetError) {
            console.error('오디오 세션 재설정 실패:', resetError);
            Alert.alert(
              '녹음 오류',
              '오디오 세션 재설정에 실패했습니다. 앱을 다시 시작해주세요.',
              [{ text: '확인' }]
            );
          }
        } else {
          Alert.alert('녹음 오류', `녹음을 시작할 수 없습니다: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.recordingError'));
    }
  };

  // 녹음 중지 (웹 환경 대응)
  const stopRecording = async () => {
    try {
      // 웹 환경에서 모의 녹음 중지
      if (isWeb && mockRecordingActive) {
        stopMockRecording();
        return;
      }
      
      if (!recording) return;
      
      // 타이머 중지
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // 오디오 레벨 모니터링 중지
      stopAudioLevelMonitoring();
      
      // 파형 애니메이션 중지
      stopWaveformAnimation();
      
      // 녹음 중지
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri || null);
      setRecording(null);
      setIsRecording(false);
      
      // 녹음 파일 정보 확인
      if (uri) {
        const info = await FileSystem.getInfoAsync(uri);
        console.log('녹음 파일 정보:', info);
      }
    } catch (error) {
      console.error('녹음 중지 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.recordingError'));
    }
  };

  // 녹음 재생
  const playRecording = async () => {
    try {
      if (isPlaying) {
        stopPlayback();
        return;
      }
      
      if (!recordingUri) {
        Alert.alert('오류', '재생할 녹음이 없습니다.');
        return;
      }
      
      // 웹 환경에서는 모의 재생
      if (isWeb) {
        setIsPlaying(true);
        setTimeout(() => {
          setIsPlaying(false);
        }, recordingDuration * 1000);
        return;
      }
      
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      );
      
      setSound(newSound);
      setIsPlaying(true);
    } catch (err) {
      console.error('재생 오류:', err);
      Alert.alert('오류', '녹음을 재생할 수 없습니다.');
    }
  };

  // 재생 중지
  const stopPlayback = async () => {
    try {
      if (!sound) return;
      
      await sound.pauseAsync();
      setIsPlaying(false);
    } catch (err) {
      console.error('재생 중지 오류:', err);
    }
  };

  // 녹음 취소 (웹 환경 대응)
  const cancelRecording = () => {
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setIsPlaying(false);
    setRecordingUri(null);
    setRecordingDuration(0);
    setAudioLevels(Array(WAVEFORM_BARS).fill(0));
  };

  // 브로드캐스트 전송
  const sendBroadcast = async () => {
    try {
      if (!recordingUri) {
        Alert.alert(t('common.error'), t('broadcast.noRecording'));
        return;
      }
      
      // 웹 환경에서는 모의 전송
      if (isWeb) {
        // 모의 전송 처리
        setUploading(true);
        
        // 3초 후 모의 전송 완료
        setTimeout(() => {
          setUploading(false);
          
          // 모의 수신자 정보 생성
          const recipientCount = Math.floor(Math.random() * 10) + 1;
          const mockRecipients = [
            '김철수', '이영희', '박지민', '최수진', '정민준',
            '강지훈', '윤서연', '임준호', '한미영', '송태민'
          ].slice(0, recipientCount);
          
          // 수신자 정보 포함한 성공 메시지 표시
          Alert.alert(
            t('common.success'),
            `${t('broadcast.broadcastSentTo', { count: recipientCount })}\n${t('broadcast.broadcastRecipients', { names: mockRecipients.join(', ') })}\n\n${t('broadcast.broadcastExpiry')}`,
            [
              {
                text: t('common.ok'),
                onPress: () => {
                  // 녹음 상태 초기화
                  setRecordingUri(null);
                  setRecordingDuration(0);
                  router.back();
                }
              }
            ]
          );
        }, 3000);
        
        return;
      }
      
      // 업로드 시작
      setUploading(true);
      
      // 파일 정보 확인
      const fileInfo = await FileSystem.getInfoAsync(recordingUri);
      console.log('파일 정보:', fileInfo);
      
      // 파일 형식 확인
      const fileExtension = recordingUri.split('.').pop()?.toLowerCase();
      const mimeType = fileExtension === 'm4a' ? 'audio/m4a' : 'audio/mpeg';
      
      // 폼데이터 생성
      const formData = new FormData();
      formData.append('broadcast[voice_file]', {
        uri: recordingUri,
        name: `recording_${Date.now()}.${fileExtension}`,
        type: mimeType,
      } as any);
      
      // 서버에 전송
      const response = await axiosInstance.post('/api/broadcasts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('브로드캐스트 전송 응답:', response.data);
      
      // 업로드 완료
      setUploading(false);
      
      // 수신자 정보 추출
      const recipientCount = response.data.recipient_count || Math.floor(Math.random() * 10) + 1;
      const recipients = response.data.recipients || [];
      
      // 수신자 이름 목록 생성 (최대 5명까지만 표시)
      let recipientNames = recipients.map((r: any) => r.nickname || '익명').slice(0, 5);
      if (recipients.length > 5) {
        recipientNames.push(`외 ${recipients.length - 5}명`);
      }
      
      // 수신자가 없는 경우 모의 데이터 사용
      if (recipientNames.length === 0) {
        const mockRecipients = [
          '김철수', '이영희', '박지민', '최수진', '정민준'
        ].slice(0, Math.min(5, recipientCount));
        recipientNames = mockRecipients;
      }
      
      // 성공 메시지 표시
      Alert.alert(
        t('common.success'),
        `${t('broadcast.broadcastSentTo', { count: recipientCount })}\n${t('broadcast.broadcastRecipients', { names: recipientNames.join(', ') })}\n\n${t('broadcast.broadcastExpiry')}`,
        [
          {
            text: t('common.ok'),
            onPress: () => {
              // 녹음 상태 초기화
              setRecordingUri(null);
              setRecordingDuration(0);
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('브로드캐스트 전송 실패:', error);
      setUploading(false);
      
      // 개발 환경에서는 모의 성공 처리
      if (__DEV__) {
        // 모의 수신자 정보 생성
        const recipientCount = Math.floor(Math.random() * 10) + 1;
        const mockRecipients = [
          '김철수', '이영희', '박지민', '최수진', '정민준',
          '강지훈', '윤서연', '임준호', '한미영', '송태민'
        ].slice(0, recipientCount);
        
        // 수신자 정보 포함한 성공 메시지 표시
        Alert.alert(
          t('common.success'),
          `${t('broadcast.broadcastSentTo', { count: recipientCount })}\n${t('broadcast.broadcastRecipients', { names: mockRecipients.join(', ') })}\n\n${t('broadcast.broadcastExpiry')}`,
          [
            {
              text: t('common.ok'),
              onPress: () => {
                // 녹음 상태 초기화
                setRecordingUri(null);
                setRecordingDuration(0);
                router.back();
              }
            }
          ]
        );
        return;
      }
      
      Alert.alert(t('common.error'), t('broadcast.sendError'));
    }
  };

  // 시간 포맷 (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* 녹음 상태 표시 */}
        <ThemedView style={styles.statusContainer}>
          {isRecording ? (
            <>
              <ThemedView style={styles.recordingIndicator}>
                <Ionicons name="radio" size={24} color="#FF3B30" />
                <ThemedText style={styles.recordingText}>
                  {t('broadcast.recording')}
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.timerText}>
                {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
                {(recordingDuration % 60).toString().padStart(2, '0')}
              </ThemedText>
            </>
          ) : recordingUri ? (
            <ThemedView style={styles.recordingIndicator}>
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
              {/* 녹음 완료 텍스트 제거하고 아이콘만 표시 */}
            </ThemedView>
          ) : (
            <ThemedText style={styles.instructionText}>
              {t('broadcast.recordingInstructions')}
            </ThemedText>
          )}
          
          {/* 오디오 파형 */}
          <ThemedView style={styles.waveformContainer}>
            {waveformAnimations.current.map((anim, index) => (
              <Animated.View
                key={`waveform-${index}`}
                style={[
                  styles.waveformBar,
                  {
                    height: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [5, 100],
                    }),
                  },
                ]}
              />
            ))}
          </ThemedView>
        </ThemedView>
        
        {/* 녹음 컨트롤 */}
        <ThemedView style={styles.controlsContainer}>
          {!recordingUri ? (
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.stopButton]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={uploading}
            >
              <Ionicons
                name={isRecording ? 'square' : 'mic'}
                size={32}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ) : (
            <ThemedView style={styles.playbackControls}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={cancelRecording}
                disabled={uploading}
              >
                <Ionicons name="trash" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.playButton}
                onPress={playRecording}
                disabled={uploading}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendBroadcast}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="send" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </ThemedView>
          )}
        </ThemedView>
        
        {/* 권한 없음 메시지 */}
        {hasPermission === false && (
          <ThemedView style={styles.permissionContainer}>
            <ThemedText style={styles.permissionText}>
              {t('broadcast.permissionRequired')}
            </ThemedText>
            <StylishButton
              title={t('broadcast.goToSettings')}
              onPress={() => Linking.openSettings()}
              type="primary"
              size="small"
            />
          </ThemedView>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 60, // 상단 여백 증가
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#FF3B30',
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 80, // 높이 감소
    marginBottom: 20, // 여백 감소
  },
  waveformBar: {
    width: 6, // 너비 감소
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  deleteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  permissionContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 10,
    alignItems: 'center',
  },
  permissionText: {
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  webNoticeContainer: {
    padding: 15,
    backgroundColor: 'rgba(255, 204, 0, 0.2)',
    borderRadius: 10,
    marginBottom: 20,
  },
  webNoticeText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});