// components/audio/VoiceRecorderRefactored.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Alert, 
  ViewStyle 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WaveformAnimation } from './WaveformAnimation';
import { 
  IAudioRecordingService, 
  RecordingStatus 
} from '../../app/services/interfaces/IAudioRecordingService';
import { 
  IAudioPlaybackService, 
  PlaybackStatus 
} from '../../app/services/interfaces/IAudioPlaybackService';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string) => void;
  recordingService: IAudioRecordingService;
  playbackService: IAudioPlaybackService;
  maxDuration?: number;
  style?: ViewStyle;
  recordingMessage?: string;
}

type RecorderState = 'idle' | 'recording' | 'stopped';

// SOLID 원칙을 준수하는 VoiceRecorder (SRP, DIP)
export const VoiceRecorderRefactored: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  recordingService,
  playbackService,
  maxDuration = 30,
  style,
  recordingMessage,
}) => {
  const { t } = useTranslation();
  
  const [state, setState] = useState<RecorderState>('idle');
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>({
    isRecording: false,
    isPaused: false,
    duration: 0,
  });
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>({
    isPlaying: false,
    isPaused: false,
    isLoaded: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
  });

  // 서비스 이벤트 구독
  useEffect(() => {
    const unsubscribeRecording = recordingService.onStatusUpdate(setRecordingStatus);
    const unsubscribePlayback = playbackService.onStatusUpdate(setPlaybackStatus);
    
    return () => {
      unsubscribeRecording();
      unsubscribePlayback();
    };
  }, [recordingService, playbackService]);

  // 녹음 시작
  const handleStartRecording = async () => {
    try {
      const hasPermission = await recordingService.checkPermissions();
      if (!hasPermission) {
        const granted = await recordingService.requestPermissions();
        if (!granted) {
          Alert.alert(t('common.error'), t('broadcast.permissionDenied'));
          return;
        }
      }

      await recordingService.startRecording({ maxDuration });
      setState('recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(t('common.error'), t('broadcast.recordingFailed'));
    }
  };

  // 녹음 중지
  const handleStopRecording = async () => {
    try {
      const uri = await recordingService.stopRecording();
      
      if (recordingStatus.duration < 1) {
        Alert.alert(t('common.error'), t('broadcast.recordingTooShort'));
        setState('idle');
        return;
      }
      
      setState('stopped');
      await playbackService.load(uri);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert(t('common.error'), t('broadcast.recordingFailed'));
      setState('idle');
    }
  };

  // 재생/일시정지
  const handlePlayPause = async () => {
    try {
      if (playbackStatus.isPlaying) {
        await playbackService.pause();
      } else {
        await playbackService.play();
      }
    } catch (error) {
      console.error('Failed to play/pause:', error);
      Alert.alert(t('common.error'), t('broadcast.playbackFailed'));
    }
  };

  // 녹음 전송
  const handleSend = () => {
    if (recordingStatus.uri) {
      onRecordingComplete(recordingStatus.uri);
      handleCancel();
    }
  };

  // 취소
  const handleCancel = async () => {
    try {
      await recordingService.cancelRecording();
      await playbackService.unload();
      setState('idle');
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // UI 렌더링
  const renderContent = () => {
    switch (state) {
      case 'idle':
        return (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleStartRecording}
          >
            <Ionicons name="mic" size={24} color="white" />
            <Text style={styles.buttonText}>
              {recordingMessage || t('broadcast.recordingInstructions')}
            </Text>
          </TouchableOpacity>
        );

      case 'recording':
        return (
          <View style={styles.recordingContainer}>
            <WaveformAnimation isActive={true} />
            <View style={styles.recordingControls}>
              <Text style={styles.timer}>
                {formatTime(recordingStatus.duration)} / {formatTime(maxDuration)}
              </Text>
              <TouchableOpacity
                style={[styles.recordButton, styles.stopButton]}
                onPress={handleStopRecording}
              >
                <Ionicons name="stop" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'stopped':
        return (
          <View style={styles.recordingContainer}>
            <View style={styles.playbackControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handlePlayPause}
              >
                <Ionicons 
                  name={playbackStatus.isPlaying ? "pause" : "play"} 
                  size={24} 
                  color="#007AFF" 
                />
              </TouchableOpacity>
              <Text style={styles.timer}>
                {formatTime(recordingStatus.duration)}
              </Text>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleCancel}
              >
                <Ionicons name="close" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.recordButton, styles.sendButton]}
              onPress={handleSend}
            >
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  recordingContainer: {
    alignItems: 'center',
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  timer: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 0,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  controlButton: {
    padding: 12,
    marginHorizontal: 8,
  },
  sendButton: {
    backgroundColor: '#34C759',
  },
}); 