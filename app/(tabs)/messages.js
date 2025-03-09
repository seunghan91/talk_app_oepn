import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText } from '@/components/ThemedView';
import axiosInstance from '../../lib/axios';
import { Ionicons } from '@expo/vector-icons';

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 대화 목록 불러오기
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('대화 목록 로드 실패:', error.response?.data || error.message);
      Alert.alert('오류', '대화 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // 대화방으로 이동
  const navigateToConversation = (id) => {
    router.push(`/conversations/${id}`);
  };

  // 새로고침
  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  // 대화 삭제
  const handleDeleteConversation = async (id) => {
    try {
      await axiosInstance.delete(`/api/conversations/${id}`);
      // 성공적으로 삭제되면 목록에서 제거
      setConversations(conversations.filter(conv => conv.id !== id));
      Alert.alert('성공', '대화가 삭제되었습니다.');
    } catch (error) {
      console.error('대화 삭제 실패:', error.response?.data || error.message);
      Alert.alert('오류', '대화 삭제에 실패했습니다.');
    }
  };

  // 즐겨찾기 토글
  const toggleFavorite = async (conversation) => {
    try {
      const endpoint = conversation.favorite ? 
        `/api/conversations/${conversation.id}/unfavorite` : 
        `/api/conversations/${conversation.id}/favorite`;
      
      await axiosInstance.post(endpoint);
      
      // 상태 업데이트
      setConversations(conversations.map(conv => 
        conv.id === conversation.id ? {...conv, favorite: !conv.favorite} : conv
      ));
    } catch (error) {
      console.error('즐겨찾기 업데이트 실패:', error.response?.data || error.message);
      Alert.alert('오류', '즐겨찾기 업데이트에 실패했습니다.');
    }
  };

  // 대화 아이템 렌더링
  const renderConversationItem = ({ item }) => {
    // 상대방 정보 구하기
    const otherUser = item.user_a_id === item.current_user_id ? item.user_b : item.user_a;
    const lastMessageDate = new Date(item.updated_at);
    const now = new Date();
    
    // 시간 포맷팅 (오늘이면 시간, 아니면 날짜)
    let formattedTime;
    if (lastMessageDate.toDateString() === now.toDateString()) {
      formattedTime = `${String(lastMessageDate.getHours()).padStart(2, '0')}:${String(lastMessageDate.getMinutes()).padStart(2, '0')}`;
    } else {
      formattedTime = `${String(lastMessageDate.getMonth() + 1).padStart(2, '0')}/${String(lastMessageDate.getDate()).padStart(2, '0')}`;
    }

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigateToConversation(item.id)}
      >
        <View style={styles.conversationInfo}>
          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>{otherUser?.nickname || '알 수 없음'}</Text>
            <Text style={styles.messageTime}>{formattedTime}</Text>
          </View>
          
          <View style={styles.messagePreviewContainer}>
            <Text style={styles.messagePreview}>
              {item.last_message || '새 대화가 시작되었습니다.'}
            </Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(item)}
              >
                <Ionicons 
                  name={item.favorite ? "star" : "star-outline"} 
                  size={22} 
                  color={item.favorite ? "#FFC107" : "#BBBBBB"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    '대화 삭제',
                    '이 대화를 정말 삭제하시겠습니까?',
                    [
                      { text: '취소', style: 'cancel' },
                      { text: '삭제', onPress: () => handleDeleteConversation(item.id), style: 'destructive' }
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">대화</ThemedText>
      </View>
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderConversationItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <ThemedText>로딩 중...</ThemedText>
            ) : (
              <>
                <ThemedText style={styles.emptyText}>대화가 없습니다.</ThemedText>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => router.push('/broadcast')}
                >
                  <ThemedText style={styles.emptyButtonText}>브로드캐스트 탐색하기</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  conversationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  conversationInfo: {
    flex: 1,
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageTime: {
    fontSize: 12,
    color: '#999999',
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  messagePreview: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 4,
    marginRight: 10,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});