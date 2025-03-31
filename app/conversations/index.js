// app/conversations/index.js

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import axiosInstance from '../lib/axios'; // JWT 인증이 포함된 axios 인스턴스
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';

export default function ConversationListScreen() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      // GET /api/conversations - 현재 사용자에게 보이는 대화방만 반환
      const response = await axiosInstance.get('/api/conversations');
      
      // Check if the response contains conversations array in the expected format
      if (response.data && response.data.conversations) {
        console.log(`Loaded ${response.data.conversations.length} conversations`);
        
        // 대화방 상태 및 가시성에 따른 필터링은 서버에서 이미 처리됨
        setConversations(response.data.conversations);
      } else {
        console.log('Unexpected response structure:', response.data);
        setConversations([]); // Set empty array as fallback
      }
    } catch (error) {
      console.log('대화방 목록 불러오기 에러:', error);
      setConversations([]); // Clear conversations on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const navigateToConversation = (conversationId) => {
    router.push(`/conversations/${conversationId}`);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today: show time
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      // Within a week: show day of week
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return `${days[date.getDay()]}요일`;
    } else {
      // Older: show date
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  const renderItem = ({ item }) => {
    // 현재 사용자 기준으로 상대방 정보 추출
    const currentUserId = user ? user.id : null;
    const isUserA = currentUserId === item.user_a_id;
    const withUser = isUserA ? item.user_b : item.user_a;
    const lastMessage = item.last_message || { content: '', created_at: '' };
    
    // 대화방 상태에 따른 스타일 및 표시 설정
    const isClosedConversation = item.status && item.status.startsWith('closed');
    
    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          isClosedConversation && styles.closedConversationItem
        ]}
        onPress={() => navigateToConversation(item.id)}
        disabled={isClosedConversation} // 종료된 대화방은 탭 불가능
      >
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={50} color={isClosedConversation ? "#CCCCCC" : "#007AFF"} />
        </View>
        <View style={styles.conversationDetails}>
          <View style={styles.conversationHeader}>
            <ThemedText style={styles.userName}>{withUser.nickname}</ThemedText>
            <ThemedText style={styles.timestamp}>{formatTimestamp(lastMessage.created_at)}</ThemedText>
          </View>
          <ThemedText 
            style={[
              styles.messagePreview,
              isClosedConversation && styles.closedMessagePreview
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {isClosedConversation 
              ? '대화가 종료되었습니다' 
              : (lastMessage.content || (lastMessage.type === 'voice' ? '음성 메시지' : '새로운 대화'))}
          </ThemedText>
          
          {isClosedConversation && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>종료됨</Text>
            </View>
          )}
          
          {!isClosedConversation && item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <ThemedView style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={60} color="#CCCCCC" />
      <ThemedText style={styles.emptyText}>
        대화 내역이 없습니다
      </ThemedText>
      <ThemedText style={styles.emptySubtext}>
        브로드캐스트를 보내면 대화가 시작됩니다
      </ThemedText>
      <TouchableOpacity 
        style={styles.newBroadcastButton}
        onPress={() => router.push('/broadcast/record')}
      >
        <Ionicons name="mic" size={20} color="#FFFFFF" style={styles.buttonIcon} />
        <Text style={styles.newBroadcastText}>새 브로드캐스트 녹음</Text>
      </TouchableOpacity>
    </ThemedView>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>대화 목록을 불러오는 중...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>메시지</ThemedText>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/broadcast/record')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </ThemedView>
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={conversations.length === 0 ? {flex: 1} : null}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  avatarContainer: {
    marginRight: 12,
  },
  conversationDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#888888',
  },
  messagePreview: {
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  newBroadcastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  newBroadcastText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  closedConversationItem: {
    opacity: 0.7,
    backgroundColor: '#F5F5F5',
  },
  closedMessagePreview: {
    fontStyle: 'italic',
    color: '#999999',
  },
  closedBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: '#999999',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  closedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  unreadBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: '#FF3B30',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});