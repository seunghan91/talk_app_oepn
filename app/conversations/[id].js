// app/conversations/[id].js
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axiosInstance from '../lib/axios';
import VoicePlayer from '../../components/VoicePlayer';
import VoiceRecorder from '../../components/VoiceRecorder';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { FileSystem } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native';

export default function ConversationDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [isClosedConversation, setIsClosedConversation] = useState(false);
  
  const flatListRef = useRef(null);
  const intervalRef = useRef(null);
  
  // 대화 상세 정보 불러오기
  const fetchConversationDetail = async () => {
    try {
      setLoading(true);
      
      // API 호출
      const response = await axiosInstance.get(`/api/conversations/${id}`);
      console.log('대화 상세 응답:', response.data);
      
      // 대화 정보 설정
      setConversation(response.data.conversation);
      
      // 대화방 상태 확인
      const conversationStatus = response.data.conversation?.status || '';
      setIsClosedConversation(conversationStatus === 'closed');
      
      // 메시지 목록 설정
      setMessages(response.data.messages || []);
      
      // 상대방 정보 설정
      const withUser = response.data.conversation?.with_user;
      if (withUser) {
        setOtherUser(withUser);
      }
      
      // 현재 사용자 정보 설정 (JWT 토큰에서 추출)
      const userData = await getCurrentUser();
      if (userData) {
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('대화 정보 로드 실패:', error.response?.data || error.message);
      Alert.alert('오류', '대화 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 현재 사용자 정보 가져오기
  const getCurrentUser = async () => {
    try {
      // AsyncStorage에서 사용자 정보 가져오기
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
      return null;
    }
  };
  
  // 시간 포맷 함수
  const formatTime = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) {
      return '';
    }
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };
  
  useEffect(() => {
    fetchConversationDetail();
    
    // 주기적인 메시지 업데이트 (10초마다)
    const intervalId = setInterval(fetchConversationDetail, 10000);
    
    return () => clearInterval(intervalId);
  }, [id]);
  
  // 새로고침
  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversationDetail();
  };
  
  // 대화방 종료 함수
  const closeConversation = async () => {
    try {
      Alert.alert(
        '대화 종료',
        '대화를 종료하시겠습니까? 상대방에게는 "대화가 종료되었습니다" 메시지가 표시됩니다.',
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '종료', 
            style: 'destructive', 
            onPress: async () => {
              try {
                // API 호출
                await axiosInstance.post(`/api/conversations/${id}/close`);
                
                // 성공 시 대화방 상태 업데이트
                setIsClosedConversation(true);
                
                // 시스템 메시지 추가
                const systemMessage = {
                  id: `temp-${Date.now()}`,
                  conversation_id: id,
                  sender_id: null, // 시스템 메시지
                  type: 'system',
                  content: '대화가 종료되었습니다.',
                  voice_file_url: null,
                  created_at: new Date().toISOString(),
                  is_read: true
                };
                
                setMessages(prevMessages => [...prevMessages, systemMessage]);
                
                // 알림
                Alert.alert('알림', '대화가 종료되었습니다.');
                
                // 스크롤을 맨 아래로 이동
                if (flatListRef.current) {
                  setTimeout(() => {
                    flatListRef.current.scrollToEnd({ animated: true });
                  }, 300);
                }
              } catch (error) {
                console.error('대화 종료 실패:', error);
                Alert.alert('오류', '대화 종료에 실패했습니다.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('대화 종료 요청 실패:', error);
      Alert.alert('오류', '대화 종료 요청에 실패했습니다.');
    }
  };
  
  // 메시지 전송
  const handleSendMessage = async (uri) => {
    try {
      if (!uri) {
        Alert.alert(t('common.error'), t('conversations.noRecording'));
        return;
      }
      
      // 종료된 대화방인 경우 메시지 전송 불가
      if (isClosedConversation) {
        Alert.alert('알림', '종료된 대화방에는 메시지를 보낼 수 없습니다.');
        return;
      }

      setSendingMessage(true);
      
      // 파일 정보 확인
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('파일 정보:', fileInfo);
      
      // 파일 형식 확인
      const fileExtension = uri.split('.').pop()?.toLowerCase();
      const mimeType = fileExtension === 'm4a' ? 'audio/m4a' : 'audio/mpeg';
      
      // 폼데이터 생성
      const formData = new FormData();
      formData.append('voice_recording', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: `recording_${Date.now()}.${fileExtension}`,
        type: mimeType,
      });
      
      console.log('메시지 전송 시도:', uri);
      
      // API 엔드포인트 호출: conversations/:id/send_message
      const response = await axiosInstance.post(`/api/conversations/${id}/send_message`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('메시지 전송 응답:', response.data);
      
      // 새로고침하여 최신 메시지 가져오기
      fetchConversationDetail();
      setRecordingUri(null);
      
      Alert.alert(
        t('common.success'), 
        `메시지가 성공적으로 전송되었습니다.\n\n수신자: ${otherUser?.nickname || '알 수 없음'}`,
        [
          { text: '확인', onPress: () => {
            setShowRecorder(false);
            // 스크롤을 맨 아래로 이동
            if (flatListRef.current) {
              setTimeout(() => {
                flatListRef.current.scrollToEnd({ animated: true });
              }, 300);
            }
          }}
        ]
      );
      
    } catch (error) {
      console.error('메시지 전송 실패:', error.response?.data || error.message);
      Alert.alert(t('common.error'), t('conversations.sendError'));
      
      // 오류 발생 시 모의 전송 (개발 환경에서만)
      if (__DEV__) {
        // 새 메시지 추가
        const newMessage = {
          id: `msg-${id}-${messages.length}`,
          sender_id: currentUser?.id,
          type: 'voice',
          content: null,
          voice_file_url: uri,
          duration: recordingDuration || 10,
          created_at: new Date().toISOString(),
          is_read: true
        };
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setRecordingUri(null);
        
        Alert.alert(
          t('common.success'), 
          `(개발 모드) 메시지가 성공적으로 전송되었습니다.\n\n수신자: ${otherUser?.nickname || '알 수 없음'}`,
          [
            { text: '확인', onPress: () => {
              setShowRecorder(false);
              // 스크롤을 맨 아래로 이동
              if (flatListRef.current) {
                setTimeout(() => {
                  flatListRef.current.scrollToEnd({ animated: true });
                }, 300);
              }
            }}
          ]
        );
      }
    } finally {
      setSendingMessage(false);
    }
  };
  
  // 메시지 렌더링
  const renderMessage = ({ item }) => {
    // 메시지 송신자 판별
    const isCurrentUserMessage = item.sender?.id === currentUser?.id;
    
    // 메시지 타입에 따른 렌더링 처리
    if (item.message_type === 'system') {
      // 시스템 메시지 렌더링
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    } else if (item.message_type === 'voice') {
      // 음성 메시지 렌더링
      return (
        <View style={[
          styles.messageContainer,
          isCurrentUserMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          <View style={[
            styles.messageBubble,
            isCurrentUserMessage ? styles.myMessageBubble : styles.otherMessageBubble
          ]}>
            {/* 음성 메시지 플레이어 */}
            <VoicePlayer
              uri={item.voice_file_url}
              messageId={item.id}
              duration={item.duration || 0}
              isMyMessage={isCurrentUserMessage}
              isPlaying={isPlaying && playingMessageId === item.id}
              onPlay={() => {
                if (playingMessageId !== item.id) {
                  setPlayingMessageId(item.id);
                  setIsPlaying(true);
                }
              }}
              onPause={() => {
                if (playingMessageId === item.id) {
                  setIsPlaying(false);
                }
              }}
              onStop={() => {
                if (playingMessageId === item.id) {
                  setPlayingMessageId(null);
                  setIsPlaying(false);
                }
              }}
            />
          </View>
          
          {/* 메시지 전송 시간 */}
          <Text style={[
            styles.messageTime,
            isCurrentUserMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(new Date(item.created_at))}
          </Text>
        </View>
      );
    } else {
      // 텍스트 메시지 렌더링
      return (
        <View style={[
          styles.messageContainer,
          isCurrentUserMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          <View style={[
            styles.messageBubble,
            isCurrentUserMessage ? styles.myMessageBubble : styles.otherMessageBubble
          ]}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
          
          {/* 메시지 전송 시간 */}
          <Text style={[
            styles.messageTime,
            isCurrentUserMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(new Date(item.created_at))}
          </Text>
        </View>
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {otherUser?.nickname || '대화'}
          {isClosedConversation && ' (종료됨)'}
        </Text>
        
        {!isClosedConversation && (
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={closeConversation}
          >
            <Ionicons name="exit-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>대화 내용을 불러오는 중...</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
          
          {/* 녹음기 */}
          {showRecorder ? (
            <View style={styles.recorderContainer}>
              <VoiceRecorder 
                onRecordingComplete={(uri, duration) => {
                  setRecordingUri(uri);
                  setRecordingDuration(duration);
                  handleSendMessage(uri);
                }}
                onCancel={() => setShowRecorder(false)}
              />
            </View>
          ) : (
            !isClosedConversation && (
              <TouchableOpacity 
                style={styles.recordButton}
                onPress={() => setShowRecorder(true)}
                disabled={sendingMessage}
              >
                {sendingMessage ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="mic" size={24} color="#FFFFFF" />
                    <Text style={styles.recordButtonText}>음성메시지 녹음하기</Text>
                  </>
                )}
              </TouchableOpacity>
            )
          )}
          
          {/* 종료된 대화방 메시지 */}
          {isClosedConversation && (
            <View style={styles.closedBanner}>
              <Ionicons name="information-circle-outline" size={20} color="#666" />
              <Text style={styles.closedBannerText}>
                이 대화는 종료되었습니다
              </Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  messageList: {
    padding: 10,
    paddingBottom: 20,
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageSender: {
    marginBottom: 4,
  },
  myMessage: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 12,
  },
  otherMessage: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 12,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  messageText: {
    fontSize: 14,
    color: '#333333',
  },
  messageTime: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  recorderContainer: {
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  recordButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  closedBannerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageBubble: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  myMessageBubble: {
    backgroundColor: '#E3F2FD',
  },
  otherMessageBubble: {
    backgroundColor: '#F5F5F5',
  },
  myMessageTime: {
    color: '#999999',
    marginLeft: 8,
  },
  otherMessageTime: {
    color: '#999999',
    marginRight: 8,
  },
});