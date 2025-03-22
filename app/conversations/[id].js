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
      
      // 메시지 목록 설정
      setMessages(response.data.messages || []);
      
      // 현재 사용자와 상대방 정보 설정
      const conv = response.data.conversation;
      if (conv) {
        // 현재 사용자 ID 확인 (JWT 토큰에서 추출)
        const currentUserId = await getCurrentUserId();
        
        // 현재 사용자와 상대방 정보 설정
        if (conv.user_a_id === currentUserId) {
          setCurrentUser(conv.user_a);
          setOtherUser(conv.user_b);
        } else {
          setCurrentUser(conv.user_b);
          setOtherUser(conv.user_a);
        }
      }
    } catch (error) {
      console.error('대화 정보 로드 실패:', error.response?.data || error.message);
      Alert.alert('오류', '대화 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 현재 사용자 ID 가져오기
  const getCurrentUserId = async () => {
    try {
      // AsyncStorage에서 사용자 정보 가져오기
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        return userData.id;
      }
      return null;
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
      return null;
    }
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
  
  // 메시지 전송
  const handleSendMessage = async (uri) => {
    try {
      if (!uri) {
        Alert.alert(t('common.error'), t('conversations.noRecording'));
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
      
      // API 엔드포인트 변경: 브로드캐스트 대신 직접 메시지 전송
      const response = await axiosInstance.post(`/api/v1/conversations/${id}/send_message`, formData, {
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
          content: '새 음성 메시지',
          created_at: new Date().toISOString(),
          voice_file_url: uri,
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
  
  // 즐겨찾기 토글
  const toggleFavorite = async () => {
    if (!conversation) return;
    
    try {
      // 모의 API 호출
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 대화 정보 업데이트
      setConversation({
        ...conversation,
        favorite: !conversation.favorite,
      });
      
      Alert.alert(
        '성공', 
        conversation.favorite ? '즐겨찾기에서 제거되었습니다.' : '즐겨찾기에 추가되었습니다.'
      );
    } catch (error) {
      console.error('즐겨찾기 업데이트 실패:', error.response?.data || error.message);
      Alert.alert('오류', '즐겨찾기 업데이트에 실패했습니다.');
    }
  };
  
  // 메시지 아이템 렌더링
  const renderMessageItem = ({ item, index }) => {
    const isMyMessage = item.sender_id === currentUser?.id;
    const isLastMessage = index === messages.length - 1;
    const messageDate = new Date(item.created_at);
    
    // 시간 포맷팅
    const formattedTime = `${String(messageDate.getHours()).padStart(2, '0')}:${String(messageDate.getMinutes()).padStart(2, '0')}`;
    
    // 날짜 포맷팅
    const formattedDate = `${messageDate.getFullYear()}-${String(messageDate.getMonth() + 1).padStart(2, '0')}-${String(messageDate.getDate()).padStart(2, '0')}`;
    
    // 날짜 표시 여부 결정 (첫 메시지 또는 날짜가 바뀔 때)
    const showDate = index === 0 || 
      new Date(messages[index - 1].created_at).toDateString() !== messageDate.toDateString();
    
    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          <View style={styles.messageInfoContainer}>
            <Text style={styles.senderName}>
              {isMyMessage ? '나' : otherUser?.nickname || '상대방'}
            </Text>
            <Text style={styles.messageTime}>{formattedTime}</Text>
          </View>
          
          <View style={[
            styles.voicePlayerContainer,
            isMyMessage ? styles.myVoicePlayer : styles.otherVoicePlayer
          ]}>
            {/* 실제 오디오 URL이 없는 경우 더미 플레이어 표시 */}
            {item.voice_file_url === 'https://example.com/audio.m4a' ? (
              <View style={styles.dummyPlayer}>
                <Ionicons name="volume-medium" size={24} color="#999999" />
                <Text style={styles.dummyPlayerText}>더미 오디오 메시지</Text>
              </View>
            ) : (
              <VoicePlayer 
                uri={item.voice_file_url} 
                style={styles.player}
              />
            )}
          </View>
        </View>
      </>
    );
  };
  
  const renderFooter = () => {
    if (sendingMessage) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.footer}>
        <VoiceRecorder
          onRecordingComplete={(uri) => {
            setRecordingUri(uri);
            handleSendMessage(uri);
          }}
          maxDuration={30000} // 30초
          style={styles.recorder}
          recordingMessage={t('conversations.recordingInstructions')}
        />
      </View>
    );
  };
  
  if (loading && !conversation) {
    return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/')}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {otherUser?.nickname || '대화'}
          </Text>
          
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={conversation?.favorite ? "star" : "star-outline"} 
              size={24} 
              color={conversation?.favorite ? "#FFC107" : "#BBBBBB"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* 메시지 목록 */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onContentSizeChange={() => {
            if (flatListRef.current && messages.length > 0) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                메시지가 없습니다. 첫 메시지를 보내보세요!
              </Text>
            </View>
          }
        />
        
        {/* 녹음기 */}
        {showRecorder ? (
          <View style={styles.recorderContainer}>
            <View style={styles.recorderHeader}>
              <Text style={styles.recorderTitle}>메시지 녹음</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowRecorder(false)}
              >
                <Ionicons name="close" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            {renderFooter()}
          </View>
        ) : (
          <View style={styles.inputContainer}>
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
                  <Text style={styles.recordButtonText}>메시지 녹음하기</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  favoriteButton: {
    padding: 4,
  },
  messagesList: {
    padding: 10,
    paddingBottom: 20,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#999999',
    backgroundColor: '#F0F0F0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  messageTime: {
    fontSize: 10,
    color: '#999999',
    marginLeft: 8,
  },
  voicePlayerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  myVoicePlayer: {
    backgroundColor: '#E3F2FD',
  },
  otherVoicePlayer: {
    backgroundColor: '#F5F5F5',
  },
  player: {
    borderRadius: 12,
  },
  inputContainer: {
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
  recorderContainer: {
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  recorderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recorderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  footer: {
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  recorder: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dummyPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  dummyPlayerText: {
    marginLeft: 8,
    color: '#666666',
    fontSize: 14,
  },
});