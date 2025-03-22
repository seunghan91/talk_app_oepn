import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Easing, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 기본 최대 녹음 시간 (초)
const DEFAULT_MAX_DURATION = 30;

export default function VoiceRecorder({ onRecordingComplete, maxDuration = 30000, style, recordingMessage }) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, recording, paused, stopped
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [maxRecordingDuration, setMaxRecordingDuration] = useState(DEFAULT_MAX_DURATION);
  
  // 애니메이션 값
  const [audioLevels, setAudioLevels] = useState(Array(10).fill(0));
  const animatedValues = useRef(audioLevels.map(() => new Animated.Value(0))).current;
  const animationRef = useRef(null);
  
  // 타이머 참조
  const durationTimerRef = useRef(null);
  
  // 관리자 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('app_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.maxRecordingDuration) {
            setMaxRecordingDuration(parseInt(settings.maxRecordingDuration));
            console.log('관리자 설정 로드됨: 최대 녹음 시간 =', settings.maxRecordingDuration, '초');
          }
        }
      } catch (error) {
        console.error('설정 로드 오류:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording();
      }
      if (sound) {
        sound.unloadAsync();
      }
      clearInterval(durationTimerRef.current);
      stopWaveformAnimation();
    };
  }, []);
  
  // 녹음 시작
  const startRecording = async () => {
    try {
      // 이미 녹음 중이면 중지
      if (recordingStatus === 'recording') {
        await stopRecording();
        return;
      }
      
      // 이전 녹음 정리
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }
      
      // 권한 확인
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('broadcast.permissionDenied'));
        return;
      }
      
      console.log('오디오 모드 설정 시작...');
      
      // 오디오 모드 설정 - 올바른 iOS 인터럽션 모드 사용
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      console.log('오디오 모드 설정 완료');
      console.log('녹음 객체 생성 중...');
      
      // 녹음 객체 생성
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      console.log('녹음 객체 생성 완료');
      
      setRecording(recording);
      setRecordingStatus('recording');
      setRecordingDuration(0);
      setRecordingUri(null);
      
      // 녹음 시간 타이머 시작
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= maxRecordingDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      // 파형 애니메이션 시작
      startWaveformAnimation();
      
      // 최대 녹음 시간 후 자동 중지
      setTimeout(() => {
        if (recordingStatus === 'recording') {
          stopRecording();
        }
      }, maxRecordingDuration * 1000);
      
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.recordingFailed'));
    }
  };
  
  // 녹음 중지
  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      // 타이머 중지
      clearInterval(durationTimerRef.current);
      
      // 파형 애니메이션 중지
      stopWaveformAnimation();
      
      // 녹음 중지
      await recording.stopAndUnloadAsync();
      
      // 녹음 파일 URI 가져오기
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      setRecordingStatus('stopped');
      
      // 너무 짧은 녹음 확인 (1초 미만)
      if (recordingDuration < 1) {
        Alert.alert(t('common.error'), t('broadcast.recordingTooShort'));
        setRecordingStatus('idle');
        setRecordingUri(null);
        return;
      }
      
      console.log('Recording stopped, URI:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert(t('common.error'), t('broadcast.recordingFailed'));
      setRecordingStatus('idle');
    }
  };
  
  // 녹음 재생
  const playRecording = async () => {
    try {
      if (isPlaying) {
        if (sound) {
          await sound.pauseAsync();
          setIsPlaying(false);
        }
        return;
      }
      
      if (!recordingUri) {
        Alert.alert(t('common.error'), t('broadcast.noRecording'));
        return;
      }
      
      // 이전 사운드 객체 정리
      if (sound) {
        await sound.unloadAsync();
      }
      
      // 사운드 객체 생성 및 재생
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert(t('common.error'), t('broadcast.playbackFailed'));
    }
  };
  
  // 재생 상태 업데이트 콜백
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };
  
  // 녹음 전송
  const sendRecording = () => {
    if (!recordingUri) {
      Alert.alert(t('common.error'), t('broadcast.noRecording'));
      return;
    }
    
    console.log('녹음 전송 시도:', recordingUri);
    
    // 콜백 호출
    if (onRecordingComplete) {
      onRecordingComplete(recordingUri);
      console.log('녹음 전송 콜백 호출 완료');
    } else {
      console.warn('onRecordingComplete 콜백이 정의되지 않았습니다');
    }
    
    // 상태 초기화
    setRecordingStatus('idle');
    setRecordingUri(null);
    setRecordingDuration(0);
    setAudioLevels(Array(10).fill(0));
    animatedValues.forEach(value => value.setValue(0));
  };
  
  // 녹음 취소
  const cancelRecording = () => {
    setRecordingStatus('idle');
    setRecordingUri(null);
    setRecordingDuration(0);
    setAudioLevels(Array(10).fill(0));
    animatedValues.forEach(value => value.setValue(0));
    
    if (sound) {
      sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  };
  
  // 파형 애니메이션 시작
  const startWaveformAnimation = () => {
    // 랜덤 오디오 레벨 생성
    const generateRandomLevels = () => {
      const newLevels = audioLevels.map(() => Math.random() * 0.8 + 0.2);
      setAudioLevels(newLevels);
      
      // 애니메이션 값 업데이트
      newLevels.forEach((level, index) => {
        Animated.timing(animatedValues[index], {
          toValue: level,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start();
      });
    };
    
    // 주기적으로 레벨 업데이트
    generateRandomLevels();
    animationRef.current = setInterval(generateRandomLevels, 200);
  };
  
  // 파형 애니메이션 중지
  const stopWaveformAnimation = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  };
  
  // 시간 포맷 (초 -> MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 파형 렌더링
  const renderWaveform = () => {
    return (
      <View style={styles.waveformContainer}>
        {animatedValues.map((value, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, 40],
                }),
              },
            ]}
          />
        ))}
      </View>
    );
  };
  
  // 녹음 버튼 렌더링
  const renderRecordButton = () => {
    if (recordingStatus === 'idle') {
      return (
        <TouchableOpacity
          style={styles.recordButton}
          onPress={startRecording}
        >
          <Ionicons name="mic" size={24} color="white" />
          <Text style={styles.buttonText}>{recordingMessage || t('broadcast.recordingInstructions')}</Text>
        </TouchableOpacity>
      );
    }
    
    if (recordingStatus === 'recording') {
      return (
        <View style={styles.recordingContainer}>
          {renderWaveform()}
          <View style={styles.recordingControls}>
            <Text style={styles.timer}>
              {formatTime(recordingDuration)} / {formatTime(maxRecordingDuration)}
            </Text>
            <TouchableOpacity
              style={[styles.recordButton, styles.stopButton]}
              onPress={stopRecording}
            >
              <Ionicons name="stop" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    if (recordingStatus === 'stopped') {
      return (
        <View style={styles.recordingContainer}>
          <View style={styles.playbackControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={playRecording}
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.timer}>{formatTime(recordingDuration)}</Text>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={cancelRecording}
            >
              <Ionicons name="close" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.recordButton, styles.sendButton]}
            onPress={sendRecording}
          >
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      );
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      {renderRecordButton()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
  },
  recordButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    width: 50,
    paddingHorizontal: 0,
  },
  sendButton: {
    backgroundColor: '#34C759',
    width: 50,
    paddingHorizontal: 0,
  },
  recordingContainer: {
    flexDirection: 'column',
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  controlButton: {
    padding: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    marginBottom: 10,
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
}); 