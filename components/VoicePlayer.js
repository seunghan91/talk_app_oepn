import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]; // 재생 속도 옵션

export default function VoicePlayer({ uri, style, onError }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const positionUpdateInterval = useRef(null);
  
  // 컴포넌트 마운트 시 사운드 로드
  useEffect(() => {
    loadSound();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [uri]);
  
  // 사운드 로드 함수
  const loadSound = async () => {
    try {
      if (!uri) {
        setIsLoading(false);
        setError('음성 파일이 없습니다.');
        if (onError) onError('음성 파일이 없습니다.');
        return;
      }
      
      // 이전 사운드가 있으면 언로드
      if (sound) {
        await sound.unloadAsync();
      }
      
      setIsLoading(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setIsLoading(false);
      
    } catch (error) {
      console.error('사운드 로드 실패:', error);
      setIsLoading(false);
      setError('음성 파일을 로드할 수 없습니다.');
      if (onError) onError('음성 파일을 로드할 수 없습니다.');
    }
  };
  
  // 재생 상태 업데이트 콜백
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      
      // 재생 완료 시
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
        sound.setPositionAsync(0);
      }
    }
  };
  
  // 재생/일시정지 토글
  const togglePlayback = async () => {
    try {
      if (!sound) return;
      
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('재생 토글 실패:', error);
    }
  };
  
  // 재생 위치 변경
  const changePosition = async (value) => {
    try {
      if (!sound) return;
      
      await sound.setPositionAsync(value);
      setPlaybackPosition(value);
    } catch (error) {
      console.error('재생 위치 변경 실패:', error);
    }
  };
  
  // 재생 속도 변경
  const changeSpeed = async () => {
    try {
      if (!sound) return;
      
      // 현재 속도의 다음 속도로 설정 (순환)
      const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
      const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
      const newSpeed = PLAYBACK_SPEEDS[nextIndex];
      
      await sound.setRateAsync(newSpeed, true);
      setPlaybackSpeed(newSpeed);
    } catch (error) {
      console.error('재생 속도 변경 실패:', error);
    }
  };
  
  // 시간 포맷팅 (MM:SS)
  const formatTime = (milliseconds) => {
    if (!milliseconds) return '00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, style]}>
      {isLoading ? (
        <Text style={styles.loadingText}>로딩 중...</Text>
      ) : (
        <>
          <View style={styles.controlsContainer}>
            {/* 재생/일시정지 버튼 */}
            <TouchableOpacity 
              style={styles.playButton}
              onPress={togglePlayback}
              disabled={!sound}
            >
              <Ionicons 
                name={isPlaying ? 'pause' : 'play'} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              {/* 현재 시간 */}
              <Text style={styles.timeText}>
                {formatTime(playbackPosition)}
              </Text>
              
              {/* 진행 슬라이더 */}
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={playbackDuration || 1}
                value={playbackPosition}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#DDDDDD"
                thumbTintColor="#007AFF"
                onSlidingComplete={changePosition}
              />
              
              {/* 전체 시간 */}
              <Text style={styles.timeText}>
                {formatTime(playbackDuration)}
              </Text>
            </View>
            
            {/* 재생 속도 버튼 */}
            <TouchableOpacity 
              style={styles.speedButton}
              onPress={changeSpeed}
            >
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  loadingText: {
    textAlign: 'center',
    padding: 10,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    padding: 10,
    color: '#FF3B30',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  slider: {
    flex: 1,
    marginHorizontal: 5,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  speedButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EEEEEE',
    borderRadius: 15,
  },
  speedText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 