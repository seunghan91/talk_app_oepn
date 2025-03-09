// app/conversations/[id].js
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axiosInstance from '../lib/axios';
import VoicePlayer from '../../components/VoicePlayer';
import VoiceRecorder from '../../components/VoiceRecorder';
import { Ionicons } from '@expo/vector-icons';

export default function ConversationDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const flatListRef = useRef(null);
  
  // 대화 상세 정보 불러오기
  const fetchConversationDetail = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/conversations/${id}`);
      
      const { conversation, messages } = response.data;
      setConversation(conversation);
      setMessages(messages || []);
      
      // 현재 사용자 ID 가져오기
      const meResponse = await axiosInstance.get('/api/me');
      const currentUserId = meResponse.data.user.id;
      setCurrentUser(meResponse.data.user);
      
      // 상대방 정보 설정
      const otherUser = conversation.user_a_id === currentUserId ? 
        { id: conversation.user_b_id, nickname: conversation.user_b?.nickname } : 
        { id: conversation.user_a_id, nickname: conversation.user_a?.nickname };
      setOtherUser(otherUser);
    } catch (error) {
      console.error('대화 정보 로드 실패:', error.response?.data || error.message);
      Alert.alert('오류', '대화 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      setSendingMessage(true);
      
      const formData = new FormData();
      formData.append('voice_file', {
        uri,
        name: 'voice_message.m4a',
        type: 'audio/m4a',
      });
      
      await axiosInstance.post(`/api/conversations/${id}/send_message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // 메시지 전송 후 대화 새로고침
      await fetchConversationDetail();
      
      // 녹음기 숨기기
      setShowRecorder(false);
      
      // 리스트 맨 아래로 스크롤
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error.response?.data || error.message);
      Alert.alert('오류', '메시지 전송에 실패했습니다.');
    } finally {
      setSendingMessage(false);
    }
  };
  
  // 즐겨찾기 토글
  const toggleFavorite = async () => {
    if (!conversation) return;
    
    try {
      const endpoint = conversation.favorite ? 
        `/api/conversations/${id}/unfavorite` : 
        `/api/conversations/${id}/favorite`;
      
      await axiosInstance.post(endpoint);
      
      // 대화 정보 새로고침
      setConversation({
        ...conversation,
        favorite: !conversation.favorite,
      });
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
            <VoicePlayer 
              uri={item.voice_file_url} 
              style={styles.player}
            />
          </View>
        </View>
      </>
    );
  };
  
  if (loading && !conversation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
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
          <VoiceRecorder onRecordingComplete={handleSendMessage} />
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
                <Text style={styles.recordButtonText}>메시지 녹음</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    padding: 12,
    borderRadius: 25,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
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
});