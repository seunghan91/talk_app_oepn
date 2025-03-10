import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Alert, TouchableOpacity, Platform, View, Animated } from 'react-native';
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
      // 권한 확인
      if (hasPermission === false) {
        await checkPermissions();
        if (hasPermission === false) {
          return;
        }
      }
      
      // 이전 녹음 정리
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      setRecordingUri(null);
      setRecordingDuration(0);
      
      console.log('녹음 시작 시도...');
      
      // 녹음 시작
      const newRecording = new Audio.Recording();
      try {
        // 안드로이드와 iOS에 맞는 녹음 옵션 설정
        await newRecording.prepareToRecordAsync(
          Platform.OS === 'ios' 
            ? Audio.RecordingOptionsPresets.HIGH_QUALITY
            : Audio.RecordingOptionsPresets.LOW_QUALITY
        );
        
        console.log('녹음 준비 완료, 시작 중...');
        await newRecording.startAsync();
        console.log('녹음 시작됨');
        
        setRecording(newRecording);
        setIsRecording(true);
        
        // 오디오 레벨 모니터링 시작
        startAudioLevelMonitoring();
        
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
    
    setUploading(true);
    
    try {
      // 파일 정보 가져오기
      const fileInfo = await FileSystem.getInfoAsync(recordingUri);
      
      // 폼 데이터 생성
      const formData = new FormData();
      formData.append('audio', {
        uri: recordingUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      
      // 추가 메타데이터
      formData.append('duration', String(recordingDuration));
      
      // API 호출
      const response = await axiosInstance.post('/api/broadcasts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('브로드캐스트 전송 성공:', response.data);
      Alert.alert(t('common.success'), t('broadcast.sendSuccess'));
      
      // 브로드캐스트 목록 화면으로 이동
      router.replace('/broadcast' as any);
    } catch (error) {
      console.error('브로드캐스트 전송 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.sendError'));
    } finally {
      setUploading(false);
    }
  };

  // 녹음 취소
  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    
    if (recordingUri) {
      setRecordingUri(null);
      setRecordingDuration(0);
    }
    
    if (sound) {
      sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
    
    // 파형 애니메이션 중지
    stopWaveformAnimation();
    
    // 오디오 레벨 초기화
    setAudioLevels(Array(WAVEFORM_BARS).fill(0));
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
          
          {/* 녹음 상태 표시 */}
          <ThemedView style={styles.statusContainer}>
            {isRecording ? (
              <ThemedView style={styles.recordingIndicator}>
                <ThemedView style={styles.recordingDot} />
                <ThemedText style={styles.recordingText}>
                  {t('broadcast.recording')}
                </ThemedText>
              </ThemedView>
            ) : recordingUri ? (
              <ThemedText style={styles.recordingComplete}>
                {t('broadcast.recordingComplete')}
              </ThemedText>
            ) : (
              <ThemedText style={styles.recordingInstructions}>
                {t('broadcast.recordingInstructions')}
              </ThemedText>
            )}
          </ThemedView>
          
          {/* 녹음 버튼 */}
          <ThemedView style={styles.controlsContainer}>
            {isRecording ? (
              <TouchableOpacity 
                style={styles.stopButton}
                onPress={stopRecording}
              >
                <Ionicons name="stop-circle" size={80} color="#FF3B30" />
              </TouchableOpacity>
            ) : recordingUri ? (
              <ThemedView style={styles.playbackControls}>
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={playRecording}
                >
                  <Ionicons 
                    name={isPlaying ? "pause-circle" : "play-circle"} 
                    size={64} 
                    color="#007AFF" 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.reRecordButton}
                  onPress={startRecording}
                >
                  <Ionicons name="refresh-circle" size={64} color="#FF9500" />
                </TouchableOpacity>
              </ThemedView>
            ) : (
              <TouchableOpacity 
                style={styles.recordButton}
                onPress={startRecording}
              >
                <Ionicons name="mic-circle" size={80} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </ThemedView>
          
          {/* 액션 버튼 */}
          {recordingUri && !isRecording && (
            <ThemedView style={styles.actionButtons}>
              <StylishButton 
                title={t('common.cancel')}
                onPress={cancelRecording}
                type="secondary"
                disabled={uploading}
              />
              <StylishButton 
                title={t('broadcast.send')}
                onPress={sendBroadcast}
                loading={uploading}
                disabled={uploading}
              />
            </ThemedView>
          )}
          
          <ThemedText style={styles.infoText}>
            {t('broadcast.recordingInfo')}
          </ThemedText>
        </ThemedView>
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
    padding: 16,
  },
  recordingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  maxTimeText: {
    fontSize: 20,
    color: '#666666',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 5,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  statusContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  recordingComplete: {
    fontSize: 16,
    color: '#007AFF',
  },
  recordingInstructions: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  controlsContainer: {
    marginBottom: 32,
  },
  recordButton: {
    padding: 16,
  },
  stopButton: {
    padding: 16,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    padding: 16,
    marginRight: 16,
  },
  reRecordButton: {
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});