import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import StylishButton from '@components/StylishButton';
import VoiceRecorder from '@components/VoiceRecorder';
import axiosInstance from '@lib/axios';
import { useAuth } from '../context/AuthContext';

interface ReplyScreenParams {
  broadcastId: string;
  senderName: string;
  senderId: string;
}

export default function BroadcastReplyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated } = useAuth();
  
  const broadcastId = params.broadcastId as string;
  const senderName = params.senderName as string;
  const senderId = params.senderId as string;
  
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  // 녹음 시작/중지
  const handleRecordPress = async () => {
    if (isRecording) {
      // 녹음 중지
      try {
        await recording?.stopAndUnloadAsync();
        const uri = recording?.getURI();
        if (uri) {
          setRecordedUri(uri);
        }
        setIsRecording(false);
        if (recordingInterval.current) {
          clearInterval(recordingInterval.current);
        }
      } catch (error) {
        console.error('녹음 중지 실패:', error);
        Alert.alert(t('common.error'), t('broadcast.recordingError'));
      }
    } else {
      // 녹음 시작
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('common.error'), t('broadcast.micPermissionDenied'));
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        
        setRecording(newRecording);
        setIsRecording(true);
        setRecordingDuration(0);
        
        // 녹음 시간 추적
        recordingInterval.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      } catch (error) {
        console.error('녹음 시작 실패:', error);
        Alert.alert(t('common.error'), t('broadcast.audioSetupError'));
      }
    }
  };

  // 녹음 재생/정지
  const handlePlayPress = async () => {
    if (!recordedUri) return;

    if (isPlaying && sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      try {
        if (!sound) {
          const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedUri });
          setSound(newSound);
          
          newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
            }
          });
          
          await newSound.playAsync();
        } else {
          await sound.playAsync();
        }
        setIsPlaying(true);
      } catch (error) {
        console.error('재생 실패:', error);
        Alert.alert(t('common.error'), t('broadcast.playbackError'));
      }
    }
  };

  // 답장 전송
  const handleSendReply = async () => {
    if (!recordedUri) {
      Alert.alert(t('common.error'), t('broadcast.noRecording'));
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();
      
      // 음성 파일 추가
      const response = await fetch(recordedUri);
      const blob = await response.blob();
      formData.append('voice_file', {
        uri: recordedUri,
        type: 'audio/m4a',
        name: 'reply.m4a',
      } as any);

      // API 호출
      const result = await axiosInstance.post(`/api/v1/broadcasts/${broadcastId}/reply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert(t('common.success'), t('broadcast.replySuccess'), [
        {
          text: t('common.ok'),
          onPress: () => {
            // 대화 화면으로 이동
            router.replace(`/conversations/${result.data.conversation.id}`);
          }
        }
      ]);
    } catch (error: any) {
      console.error('답장 전송 실패:', error);
      Alert.alert(
        t('common.error'), 
        error.response?.data?.error || t('broadcast.replyError')
      );
    } finally {
      setIsSending(false);
    }
  };

  // 다시 녹음
  const handleReRecord = () => {
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setRecordedUri(null);
    setIsPlaying(false);
    setRecordingDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        {/* 답장 대상 정보 */}
        <ThemedView style={styles.recipientInfo}>
          <ThemedText style={styles.replyToText}>
            {t('broadcast.replyingTo', { name: senderName })}
          </ThemedText>
        </ThemedView>

        {/* 녹음 인터페이스 */}
        <ThemedView style={styles.recordingContainer}>
          {recordedUri ? (
            // 녹음 완료 상태
            <ThemedView style={styles.recordedContent}>
              <ThemedText style={styles.recordedText}>
                {t('broadcast.recordingComplete')}
              </ThemedText>
              <ThemedText style={styles.durationText}>
                {formatDuration(recordingDuration)}
              </ThemedText>
              
              <ThemedView style={styles.playbackControls}>
                <StylishButton
                  title={isPlaying ? t('common.pause') : t('common.play')}
                  onPress={handlePlayPress}
                  type="secondary"
                  icon={<Ionicons name={isPlaying ? "pause" : "play"} size={20} color="#000" />}
                />
                
                <StylishButton
                  title={t('broadcast.reRecord')}
                  onPress={handleReRecord}
                  type="outline"
                  icon={<Ionicons name="refresh" size={20} color="#000" />}
                />
              </ThemedView>
            </ThemedView>
          ) : (
            // 녹음 대기/진행 상태
            <ThemedView style={styles.recordingContent}>
              <VoiceRecorder
                onRecordingComplete={(uri) => setRecordedUri(uri)}
                maxDuration={30000}
                recordingMessage={t('broadcast.recordingInstructions')}
              />
              
              {isRecording && (
                <ThemedText style={styles.recordingText}>
                  {t('broadcast.recording')}...
                </ThemedText>
              )}
            </ThemedView>
          )}
        </ThemedView>

        {/* 액션 버튼 */}
        <ThemedView style={styles.actions}>
          {recordedUri && (
            <StylishButton
              title={t('broadcast.sendReply')}
              onPress={handleSendReply}
              type="primary"
              icon={<Ionicons name="send" size={20} color="#FFF" />}
              loading={isSending}
              disabled={isSending}
              style={styles.sendButton}
            />
          )}
          
          <StylishButton
            title={t('common.cancel')}
            onPress={() => router.back()}
            type="outline"
            disabled={isSending}
          />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  recipientInfo: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  replyToText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recordingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingContent: {
    alignItems: 'center',
  },
  recordedContent: {
    alignItems: 'center',
    padding: 20,
  },
  recordedText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  durationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 24,
  },
  recordingText: {
    fontSize: 18,
    marginTop: 16,
    color: '#FF3B30',
  },
  playbackControls: {
    flexDirection: 'row',
    gap: 12,
  },
  actions: {
    gap: 12,
    paddingBottom: 20,
  },
  sendButton: {
    marginBottom: 0,
  },
});
