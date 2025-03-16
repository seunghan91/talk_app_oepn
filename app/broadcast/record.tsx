import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Alert, TouchableOpacity, Platform, View, Animated, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
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

// 최대 녹음 시간 (초)
const MAX_RECORDING_DURATION = 30;

// 오디오 파형 바 개수
const WAVEFORM_BARS = 30;

// 오디오 레벨 측정 간격 (밀리초)
const AUDIO_LEVEL_INTERVAL = 100;

export default function RecordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      await setupAudioSession();
      await checkPermissions();
    };
    
    setupAudioAndPermissions();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioLevelTimerRef.current) {
        clearInterval(audioLevelTimerRef.current);
      }
      if (recording) {
        stopRecording();
      }
      if (sound) {
        sound.unloadAsync();
      }
      if (animationRef.current) {
        animationRef.current.stop();
      }
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('오디오 세션 설정 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.audioSetupError'));
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

  // 녹음 시작
  const startRecording = async () => {
    try {
      console.log('녹음 시작 시도...', { hasPermission });
      
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
      
      // 오디오 세션 재설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      console.log('오디오 세션 설정 완료');
      
      // 녹음 시작
      const newRecording = new Audio.Recording();
      try {
        console.log('녹음 준비 중...');
        
        // 안드로이드와 iOS에 맞는 녹음 옵션 설정
        const recordingOptions = Platform.OS === 'ios' 
          ? Audio.RecordingOptionsPresets.HIGH_QUALITY
          : {
              ...Audio.RecordingOptionsPresets.LOW_QUALITY,
              android: {
                ...Audio.RecordingOptionsPresets.LOW_QUALITY.android,
                extension: '.m4a',
                outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                audioEncoder: Audio.AndroidAudioEncoder.AAC,
              }
            };
        
        await newRecording.prepareToRecordAsync(recordingOptions);
        
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
      } catch (err: any) {
        console.error('녹음 시작 중 오류:', err);
        Alert.alert(t('common.error'), `${t('broadcast.recordingError')}: ${err.message || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      console.error('녹음 시작 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.recordingError'));
    }
  };

  // 녹음 중지
  const stopRecording = async () => {
    try {
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
      if (!recordingUri) return;
      
      if (sound) {
        // 이미 재생 중이면 중지
        if (isPlaying) {
          await sound.stopAsync();
          setIsPlaying(false);
          stopWaveformAnimation();
          return;
        }
        
        // 재생 시작
        await sound.playAsync();
        setIsPlaying(true);
        startPlaybackAnimation();
        
        // 재생 완료 시 처리
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && !status.isPlaying && status.positionMillis > 0 && status.positionMillis === status.durationMillis) {
            setIsPlaying(false);
            stopWaveformAnimation();
          }
        });
      } else {
        // 새 사운드 객체 생성
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordingUri },
          { shouldPlay: true }
        );
        
        setSound(newSound);
        setIsPlaying(true);
        startPlaybackAnimation();
        
        // 재생 완료 시 처리
        newSound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && !status.isPlaying && status.positionMillis > 0 && status.positionMillis === status.durationMillis) {
            setIsPlaying(false);
            stopWaveformAnimation();
          }
        });
      }
    } catch (error) {
      console.error('녹음 재생 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.playError'));
    }
  };

  // 브로드캐스트 전송
  const sendBroadcast = async () => {
    if (!recordingUri) {
      Alert.alert(t('common.error'), t('broadcast.noRecording'));
      return;
    }
    
    // 업로딩 상태 설정 및 로그 출력
    setUploading(true);
    console.log('전송 시작: 업로딩 상태 설정됨', { uploading: true });
    
    try {
      // 인증 토큰 확인
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) {
        console.error('인증 토큰이 없습니다.');
        Alert.alert(
          t('common.error'),
          t('auth.loginRequired'),
          [
            { text: t('common.ok') },
            { 
              text: t('auth.login'),
              onPress: () => router.push('/auth')
            }
          ]
        );
        setUploading(false);
        return;
      }
      
      console.log('인증 토큰 확인됨:', token.substring(0, 10) + '...');
      
      // 파일 정보 가져오기
      const fileInfo = await FileSystem.getInfoAsync(recordingUri);
      console.log('녹음 파일 정보:', fileInfo);
      
      // 폼 데이터 생성
      const formData = new FormData();
      
      // 파일 이름에서 확장자 추출
      const fileName = recordingUri.split('/').pop() || 'recording.m4a';
      const fileType = fileName.includes('.') ? 
        `audio/${fileName.split('.').pop()}` : 'audio/m4a';
      
      // 파일 객체 생성 및 로깅
      const fileObj = {
        uri: Platform.OS === 'ios' ? recordingUri.replace('file://', '') : recordingUri,
        type: fileType,
        name: fileName,
      };
      console.log('파일 객체:', fileObj);
      
      // FormData에 파일 추가
      formData.append('voice_file', fileObj as any);
      
      // 메타데이터 추가
      formData.append('duration', String(recordingDuration));
      formData.append('expires_in', '259200'); // 기본값 3일(초 단위)
      
      // API 요청
      console.log('API 요청 URL:', '/api/broadcasts');
      console.log('API 요청 헤더:', { 
        Authorization: `Bearer ${token.substring(0, 5)}...`,
        'Content-Type': 'multipart/form-data' 
      });
      
      // 개발 환경에서만 formData 내용 로깅
      if (__DEV__) {
        console.log('FormData 내용:');
        for (const pair of (formData as any)._parts) {
          if (pair[0] === 'voice_file') {
            console.log('음성 파일:', pair[1].name, pair[1].type);
          } else {
            console.log(pair[0] + ':', pair[1]);
          }
        }
      }
      
      // API 호출 (타임아웃 30초)
      const response = await axiosInstance.post('/api/broadcasts', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30초
      });
      
      // 성공 응답 처리
      console.log('API 응답:', response.status, response.data);
      
      // 성공 메시지 표시
      Alert.alert(
        t('common.success'),
        t('broadcast.sendSuccess'),
        [
          { 
            text: t('common.ok'),
            onPress: () => {
              // 상태 초기화
              setRecordingUri(null);
              setRecordingDuration(0);
              
              if (sound) {
                sound.unloadAsync();
                setSound(null);
                setIsPlaying(false);
              }
              
              // 파형 애니메이션 중지
              stopWaveformAnimation();
              
              // 오디오 레벨 초기화
              setAudioLevels(Array(WAVEFORM_BARS).fill(0));
              
              // 홈 화면으로 이동
              router.push('/');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('브로드캐스트 전송 실패:', error);
      
      // 오류 유형에 따른 처리
      if (error.response) {
        // 서버 응답이 있는 경우
        console.log('서버 응답 오류:', error.response.status, error.response.data);
        
        // 인증 오류인 경우
        if (error.response.status === 401) {
          Alert.alert(
            t('common.error'),
            t('auth.loginRequired'),
            [
              { text: t('common.ok') },
              { 
                text: t('auth.login'),
                onPress: () => router.push('/auth')
              }
            ]
          );
        } else {
          // 기타 서버 오류
          Alert.alert(t('common.error'), `${t('broadcast.sendError')}: ${error.response.data?.message || '서버 오류'}`);
        }
      } else if (error.request) {
        // 요청은 전송되었지만 응답을 받지 못한 경우
        console.log('요청 오류:', error.request);
        Alert.alert(t('common.error'), `${t('broadcast.sendError')}: 서버 응답 없음`);
      } else {
        // 요청 생성 중 발생한 오류
        console.log('기타 오류:', error.message);
        Alert.alert(t('common.error'), `${t('broadcast.sendError')}: ${error.message}`);
      }
    } finally {
      setUploading(false);
      console.log('전송 완료: 업로딩 상태 해제됨', { uploading: false });
    }
  };

  // 녹음 취소
  const cancelRecording = () => {
    // 녹음 중이면 먼저 확인 알림 표시
    if (isRecording) {
      Alert.alert(
        t('common.notice'),
        t('broadcast.deleteConfirm'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel'
          },
          {
            text: t('common.stop'),
            onPress: stopRecording
          }
        ]
      );
      return;
    }
    
    // 녹음된 파일이 있으면 삭제 확인 알림 표시
    if (recordingUri) {
      Alert.alert(
        t('common.notice'),
        t('broadcast.deleteConfirm'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel'
          },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => {
              // 녹음 파일 삭제
              setRecordingUri(null);
              setRecordingDuration(0);
              
              if (sound) {
                sound.unloadAsync();
                setSound(null);
                setIsPlaying(false);
              }
              
              // 파형 애니메이션 중지
              stopWaveformAnimation();
              
              // 오디오 레벨 초기화
              setAudioLevels(Array(WAVEFORM_BARS).fill(0));
              
              // 삭제 완료 메시지
              Alert.alert(
                t('common.success'),
                t('broadcast.recordingDeleted')
              );
            }
          }
        ]
      );
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
        <ThemedText type="title">{t('broadcast.record')}</ThemedText>
        
        <ThemedView style={styles.recordingContainer}>
          {/* 녹음 시간 표시 */}
          <ThemedView style={styles.timerContainer}>
            <ThemedText style={styles.timerText}>
              {formatTime(recordingDuration)}
            </ThemedText>
            <ThemedText style={styles.maxTimeText}>
              / {formatTime(MAX_RECORDING_DURATION)}
            </ThemedText>
          </ThemedView>
          
          {/* 오디오 파형 */}
          <ThemedView style={styles.waveformContainer}>
            {waveformAnimations.current.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    height: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [5, 50],
                    }),
                    backgroundColor: isRecording ? '#FF3B30' : isPlaying ? '#007AFF' : '#CCCCCC',
                  },
                ]}
              />
            ))}
          </ThemedView>
          
          {/* 녹음 컨트롤 */}
          <ThemedView style={styles.controlsContainer}>
            {recordingUri ? (
              <>
                {/* 녹음 완료 후 컨트롤 */}
                <TouchableOpacity
                  style={[styles.controlButton, styles.secondaryButton]}
                  onPress={cancelRecording}
                  disabled={uploading}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                  <ThemedText style={styles.buttonText}>{t('common.delete')}</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.controlButton, styles.primaryButton]}
                  onPress={playRecording}
                  disabled={uploading}
                >
                  <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#FFFFFF" />
                  <ThemedText style={[styles.buttonText, styles.whiteText]}>
                    {isPlaying ? t('common.pause') : t('common.play')}
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.controlButton, 
                    styles.sendButton, 
                    uploading && styles.disabledButton
                  ]}
                  onPress={sendBroadcast}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="paper-plane" size={24} color="#FFFFFF" />
                  )}
                  <ThemedText style={[styles.buttonText, styles.whiteText]}>
                    {uploading ? t('common.sending') : t('common.send')}
                  </ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* 녹음 전/중 컨트롤 */}
                {isRecording ? (
                  <TouchableOpacity
                    style={[styles.controlButton, styles.stopButton]}
                    onPress={stopRecording}
                  >
                    <Ionicons name="stop" size={24} color="#FFFFFF" />
                    <ThemedText style={[styles.buttonText, styles.whiteText]}>
                      {t('common.stop')}
                    </ThemedText>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.controlButton, styles.recordButton]}
                    onPress={startRecording}
                    disabled={!hasPermission}
                  >
                    <Ionicons name="mic" size={24} color="#FFFFFF" />
                    <ThemedText style={[styles.buttonText, styles.whiteText]}>
                      {t('common.record')}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ThemedView>
          
          {/* 안내 메시지 */}
          <ThemedView style={styles.instructionContainer}>
            {recordingUri ? (
              <ThemedText style={styles.instructionText}>
                {t('broadcast.reviewAndSend')}
              </ThemedText>
            ) : isRecording ? (
              <ThemedText style={styles.instructionText}>
                {t('broadcast.recording')}
              </ThemedText>
            ) : (
              <ThemedText style={styles.instructionText}>
                {t('broadcast.tapToRecord')}
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  recordingContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  maxTimeText: {
    fontSize: 18,
    opacity: 0.6,
    marginLeft: 5,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    width: '100%',
    marginVertical: 20,
  },
  waveformBar: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 8,
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
  },
  recordButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 30,
    minWidth: 150,
  },
  stopButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 15,
    paddingHorizontal: 30,
    minWidth: 150,
  },
  sendButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 25,
    minWidth: 120,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  instructionContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  },
});