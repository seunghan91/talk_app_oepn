import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import axiosInstance from '../lib/axios';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native';
import StylishButton from '../../components/StylishButton';

// 대화 인터페이스 정의
interface Conversation {
  id: number;
  user: {
    id: number;
    nickname: string;
    profile_image?: string;
  };
  last_message: {
    content: string;
    created_at: string;
    is_read: boolean;
  };
  is_favorite: boolean;
  unread_count: number;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterFavorites, setFilterFavorites] = useState<boolean>(false);

  // 대화 목록 불러오기
  const fetchConversations = async () => {
    try {
      setLoading(true);
      // 실제 API 호출 (현재는 더미 데이터 사용)
      // const response = await axiosInstance.get('/api/conversations');
      // setConversations(response.data);
      
      // 더미 데이터
      const dummyData = [
        {
          id: 1,
          user: {
            id: 101,
            nickname: '김철수',
            profile_image: 'https://randomuser.me/api/portraits/men/32.jpg',
          },
          last_message: {
            content: '안녕하세요, 오늘 방송 잘 들었습니다!',
            created_at: '2023-03-15T14:30:00Z',
            is_read: false,
          },
          is_favorite: true,
          unread_count: 3,
        },
        {
          id: 2,
          user: {
            id: 102,
            nickname: '이영희',
            profile_image: 'https://randomuser.me/api/portraits/women/44.jpg',
          },
          last_message: {
            content: '다음 방송은 언제 하시나요?',
            created_at: '2023-03-14T09:15:00Z',
            is_read: true,
          },
          is_favorite: false,
          unread_count: 0,
        },
        {
          id: 3,
          user: {
            id: 103,
            nickname: '박지민',
            profile_image: 'https://randomuser.me/api/portraits/men/67.jpg',
          },
          last_message: {
            content: '협업 제안이 있습니다. 연락 주세요.',
            created_at: '2023-03-13T18:45:00Z',
            is_read: true,
          },
          is_favorite: true,
          unread_count: 0,
        },
        {
          id: 4,
          user: {
            id: 104,
            nickname: '최수진',
          },
          last_message: {
            content: '안녕하세요! 팬입니다. 다음 방송 기대할게요.',
            created_at: '2023-03-12T11:20:00Z',
            is_read: true,
          },
          is_favorite: false,
          unread_count: 0,
        },
        {
          id: 5,
          user: {
            id: 105,
            nickname: '정민준',
            profile_image: 'https://randomuser.me/api/portraits/men/22.jpg',
          },
          last_message: {
            content: '질문이 있습니다. 확인 부탁드려요.',
            created_at: '2023-03-11T16:05:00Z',
            is_read: false,
          },
          is_favorite: false,
          unread_count: 1,
        },
      ];
      
      setConversations(dummyData);
    } catch (error: any) {
      console.error('대화 목록 로드 실패:', error.response?.data || error.message);
      Alert.alert(t('common.error'), t('messages.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // 대화방으로 이동
  const navigateToConversation = (id: number) => {
    router.push(`/conversations/${id}` as any);
  };

  // 새로고침
  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  // 대화 삭제
  const handleDeleteConversation = async (id: number) => {
    try {
      Alert.alert(
        t('messages.deleteConfirmTitle'),
        t('messages.deleteConfirmMessage'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              // 실제 API 호출
              // await axiosInstance.delete(`/api/conversations/${id}`);
              
              // UI 업데이트
              setConversations(prev => prev.filter(conv => conv.id !== id));
              Alert.alert(t('common.success'), t('messages.deleteSuccess'));
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('대화 삭제 실패:', error.response?.data || error.message);
      Alert.alert(t('common.error'), t('messages.deleteError'));
    }
  };

  // 즐겨찾기 토글
  const toggleFavorite = async (conversation: Conversation) => {
    try {
      const updatedConversation = { ...conversation, is_favorite: !conversation.is_favorite };
      
      // 실제 API 호출
      // await axiosInstance.put(`/api/conversations/${conversation.id}/favorite`, {
      //   is_favorite: updatedConversation.is_favorite
      // });
      
      // UI 업데이트
      setConversations(prev => 
        prev.map(conv => conv.id === conversation.id ? updatedConversation : conv)
      );
    } catch (error: any) {
      console.error('즐겨찾기 업데이트 실패:', error.response?.data || error.message);
      Alert.alert(t('common.error'), t('messages.favoriteError'));
    }
  };
  
  // 검색 필터링
  const getFilteredConversations = () => {
    let filtered = [...conversations];
    
    // 즐겨찾기 필터
    if (filterFavorites) {
      filtered = filtered.filter(conv => conv.is_favorite);
    }
    
    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.user.nickname.toLowerCase().includes(query) || 
        conv.last_message.content.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };
  
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // 오늘
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // 어제
      return t('messages.yesterday');
    } else if (diffDays < 7) {
      // 이번 주
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return days[date.getDay()] + '요일';
    } else {
      // 그 이전
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  // 대화 항목 렌더링
  const renderConversationItem = ({ item }: { item: Conversation }) => {
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigateToConversation(item.id)}
      >
        {/* 프로필 이미지 */}
        <View style={styles.avatarContainer}>
          {item.user.profile_image ? (
            <Image 
              source={{ uri: item.user.profile_image }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <ThemedText style={styles.avatarInitial}>
                {item.user.nickname.charAt(0)}
              </ThemedText>
            </View>
          )}
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
        
        {/* 대화 내용 */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <ThemedText style={styles.nickname}>{item.user.nickname}</ThemedText>
            <ThemedText style={styles.timestamp}>
              {formatDate(item.last_message.created_at)}
            </ThemedText>
          </View>
          
          <ThemedText 
            style={[
              styles.messagePreview, 
              !item.last_message.is_read && styles.unreadMessage
            ]}
            numberOfLines={1}
          >
            {item.last_message.content}
          </ThemedText>
        </View>
        
        {/* 액션 버튼 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item)}
          >
            <Ionicons
              name={item.is_favorite ? 'star' : 'star-outline'}
              size={22}
              color={item.is_favorite ? '#FFD700' : '#AAAAAA'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteConversation(item.id)}
          >
            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // 검색 바 렌더링
  const renderSearchBar = () => {
    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
          <ThemedText
            style={styles.searchInput}
            placeholder={t('messages.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999999" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterFavorites && styles.filterButtonActive
          ]}
          onPress={() => setFilterFavorites(!filterFavorites)}
        >
          <Ionicons
            name="star"
            size={20}
            color={filterFavorites ? '#FFFFFF' : '#FFD700'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // 빈 상태 렌더링
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.emptyText}>{t('common.loading')}</ThemedText>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-ellipses-outline" size={64} color="#CCCCCC" />
        <ThemedText style={styles.emptyTitle}>
          {filterFavorites 
            ? t('messages.noFavorites') 
            : searchQuery 
              ? t('messages.noSearchResults') 
              : t('messages.noMessages')}
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          {filterFavorites 
            ? t('messages.noFavoritesDescription') 
            : searchQuery 
              ? t('messages.noSearchResultsDescription') 
              : t('messages.noMessagesDescription')}
        </ThemedText>
        
        {!searchQuery && !filterFavorites && (
          <StylishButton
            title={t('messages.exploreUsers')}
            onPress={() => router.push('/explore' as any)}
            type="primary"
            icon={<Ionicons name="people" size={18} color="#FFFFFF" />}
            style={styles.exploreButton}
          />
        )}
      </View>
    );
  };

  const filteredConversations = getFilteredConversations();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">{t('messages.title')}</ThemedText>
        
        {renderSearchBar()}
        
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={filteredConversations.length === 0 ? { flex: 1 } : null}
          ListEmptyComponent={renderEmptyState}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FFD700',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nickname: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#999999',
  },
  messagePreview: {
    fontSize: 14,
    color: '#666666',
  },
  unreadMessage: {
    fontWeight: 'bold',
    color: '#333333',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreButton: {
    marginTop: 16,
  },
});