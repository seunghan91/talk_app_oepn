import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Easing } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const MAX_DURATION = 30; // 최대 녹음 시간 (초)

export default function VoiceRecorder({ onRecordingComplete }) {
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, recording, paused, stopped
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState(null);
  const [recordingPermission, setRecordingPermission] = useState(false);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 애니메이션 값
  const pulseAnim = new Animated.Value(1);
  const waveAnim = new Animated.Value(0);
  
  // 녹음 권한 확인
  useEffect(() => {
    const getPermission = async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setRecordingPermission(status === 'granted');
    };
    
    getPermission();
    return () => {
      if (recording) {
        stopRecording();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);
  
  // 녹음 시간 측정을 위한 타이머
  useEffect(() => {
    let interval = null;
    
    if (recordingStatus === 'recording') {
      interval = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [recordingStatus]);
  
  // 펄스 애니메이션
  useEffect(() => {
    if (recordingStatus === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();
      
      // 파형 애니메이션
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.stopAnimation();
    }
  }, [recordingStatus]);
  
  // 녹음 시작
  const startRecording = async () => {
    try {
      if (!recordingPermission) {
        console.log('권한이 없습니다.');
        return;
      }
      
      // 이전 녹음 초기화
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      setRecordingUri(null);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setRecordingStatus('recording');
      setRecordingDuration(0);
      
    } catch (error) {
      console.error('녹음 시작 실패:', error);
    }
  };
  
  // 녹음 중지
  const stopRecording = async () => {
    try {
      if (recordingStatus !== 'recording') return;
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecordingStatus('stopped');
      setRecording(null);
      
      // 재생 가능하도록 설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      // 녹음 완료 콜백
      if (onRecordingComplete) {
        onRecordingComplete(uri);
      }
      
    } catch (error) {
      console.error('녹음 중지 실패:', error);
    }
  };
  
  // 녹음 취소
  const cancelRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      setRecordingStatus('idle');
      setRecordingUri(null);
      setRecordingDuration(0);
      
    } catch (error) {
      console.error('녹음 취소 실패:', error);
    }
  };
  
  // 녹음 파일 재생
  const playRecording = async () => {
    try {
      if (!recordingUri) return;
      
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
        return;
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(newSound);
      
      // 재생 완료 이벤트
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
      
      await newSound.playAsync();
      setIsPlaying(true);
      
    } catch (error) {
      console.error('재생 실패:', error);
    }
  };
  
  // 재생 중지
  const stopPlayback = async () => {
    try {
      if (!sound) return;
      
      await sound.pauseAsync();
      setIsPlaying(false);
      
    } catch (error) {
      console.error('재생 중지 실패:', error);
    }
  };
  
  // 시간 포맷팅 (초 -> MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <View style={styles.container}>
      {/* 녹음 파형 (애니메이션) */}
      {recordingStatus === 'recording' && (
        <View style={styles.waveContainer}>
          {[...Array(7)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.waveLine,
                {
                  height: 30 + Math.random() * 40,
                  opacity: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.8]
                  }),
                  transform: [
                    {
                      scaleY: waveAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.7, 1, 0.7]
                      })
                    }
                  ]
                }
              ]}
            />
          ))}
        </View>
      )}
      
      {/* 녹음 시간 표시 */}
      <Text style={styles.durationText}>
        {recordingStatus !== 'idle' ? formatTime(recordingDuration) : '녹음 준비'}
        {recordingStatus === 'recording' && ` / ${formatTime(MAX_DURATION)}`}
      </Text>
      
      {/* 녹음 컨트롤 */}
      <View style={styles.controls}>
        {recordingStatus === 'idle' ? (
          // 녹음 시작 버튼
          <TouchableOpacity 
            style={styles.recordButton}
            onPress={startRecording}
          >
            <Ionicons name="mic" size={32} color="#fff" />
          </TouchableOpacity>
        ) : recordingStatus === 'recording' ? (
          // 녹음 중 컨트롤
          <View style={styles.recordingControls}>
            {/* 취소 버튼 */}
            <TouchableOpacity 
              style={[styles.controlButton, styles.cancelButton]}
              onPress={cancelRecording}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            {/* 중지 버튼 */}
            <Animated.View style={{
              transform: [{ scale: pulseAnim }]
            }}>
              <TouchableOpacity 
                style={[styles.recordButton, styles.recordingButton]}
                onPress={stopRecording}
              >
                <Ionicons name="square" size={24} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          // 녹음 완료 후 컨트롤
          <View style={styles.playbackControls}>
            {/* 다시 녹음 버튼 */}
            <TouchableOpacity 
              style={[styles.controlButton, styles.retryButton]}
              onPress={() => {
                if (sound) {
                  sound.unloadAsync();
                  setSound(null);
                }
                setRecordingStatus('idle');
                setRecordingUri(null);
              }}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
            
            {/* 재생/정지 버튼 */}
            <TouchableOpacity 
              style={[styles.controlButton, styles.playButton]}
              onPress={isPlaying ? stopPlayback : playRecording}
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
            </TouchableOpacity>
            
            {/* 완료 버튼 */}
            <TouchableOpacity 
              style={[styles.controlButton, styles.doneButton]}
              onPress={() => {
                // 이미 onRecordingComplete는 녹음 완료 시 자동으로 호출됨
                // 필요시 추가 동작 구현
              }}
            >
              <Ionicons name="checkmark" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  durationText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 160,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 200,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
  },
  retryButton: {
    backgroundColor: '#8E8E93',
  },
  playButton: {
    backgroundColor: '#34C759',
  },
  doneButton: {
    backgroundColor: '#007AFF',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 70,
    width: '80%',
    marginBottom: 10,
  },
  waveLine: {
    width: 3,
    backgroundColor: '#FF3B30',
    borderRadius: 3,
  },
}); 