import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../lib/axios';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { useAuth } from '../context/AuthContext';

// 브로드캐스트 타입 정의
interface Broadcast {
  id: number;
  user_id: number;
  audio_url: string;
  created_at: string;
  user: {
    nickname: string;
    gender?: string;
    age_group?: string;
    region?: string;
  };
  is_favorite?: boolean;
  duration?: number; // 오디오 길이(초)
  recipient_status?: 'delivered' | 'read' | 'replied'; // 수신 상태
  received_at?: string; // 수신 시간
}

type BroadcastFilter = 'all' | 'sent' | 'received';

export default function BroadcastScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState<Record<number, number>>({});
  const soundRef = useRef<Audio.Sound | null>(null);
  const [autoplay, setAutoplay] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [filter, setFilter] = useState<BroadcastFilter>('received'); // 기본값을 'received'로 변경

  // 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('app_settings');
        if (storedSettings) {
          const { autoplayEnabled } = JSON.parse(storedSettings);
          setAutoplay(autoplayEnabled !== undefined ? autoplayEnabled : true);
        }
      } catch (error) {
        console.error('설정 로드 실패:', error);
      }
    };

    loadSettings();
  }, []);

  // 브로드캐스트 목록 불러오기
  useEffect(() => {
    loadBroadcasts();
    
    // 화면 언마운트 시 오디오 정리
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // 오디오 세션 설정
  useEffect(() => {
    const setupAudioSession = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('오디오 세션 설정 실패:', error);
      }
    };

    setupAudioSession();
  }, []);

  // 브로드캐스트 목록 불러오기 함수
  const loadBroadcasts = useCallback(async (resetPage = true) => {
    try {
      if (resetPage) {
        setLoading(true);
        setPage(1);
        setError(null);
      }

      const currentPage = resetPage ? 1 : page;
      
      // filter에 따라 다른 API 호출
      let endpoint: string;
      if (filter === 'received') {
        endpoint = `/api/v1/broadcasts/received?page=${currentPage}&limit=10`;
      } else if (filter === 'sent') {
        endpoint = `/api/v1/broadcasts?page=${currentPage}&limit=10`;
      } else {
        // all인 경우 - sent와 received를 둘 다 가져와야 함
        // 일단은 sent만 표시 (추후 병합 로직 필요)
        endpoint = `/api/v1/broadcasts?page=${currentPage}&limit=10`;
      }
      
      const response = await axiosInstance.get<{ broadcasts: Broadcast[], pagination?: any }>(endpoint);
      
      if (resetPage) {
        setBroadcasts(response.data.broadcasts);
      } else {
        setBroadcasts(prev => [...prev, ...response.data.broadcasts]);
      }
      
      // pagination 정보가 있으면 사용, 없으면 기존 방식
      if (response.data.pagination) {
        setHasMore(response.data.pagination.current_page < response.data.pagination.total_pages);
      } else {
        setHasMore(response.data.broadcasts.length === 10);
      }
      
      if (!resetPage) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('브로드캐스트 목록 로드 실패:', error);
      setError(t('broadcast.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [page, filter]);

  // 필터 변경 시 브로드캐스트 다시 로드
  useEffect(() => {
    loadBroadcasts(true);
  }, [filter]);

  // 더 불러오기
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    loadBroadcasts(false);
  }, [loadingMore, hasMore, loadBroadcasts]);

  // 새로고침
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadBroadcasts(true);
  }, [loadBroadcasts]);

  // 브로드캐스트 읽음 처리
  const markAsRead = useCallback(async (broadcastId: number) => {
    try {
      await axiosInstance.patch(`/api/v1/broadcasts/${broadcastId}/mark_as_read`);
    } catch (error) {
      console.error('브로드캐스트 읽음 처리 실패:', error);
    }
  }, []);

  // 브로드캐스트 재생
  const playBroadcast = async (broadcast: Broadcast) => {
    try {
      if (currentlyPlaying === broadcast.id) {
        // 현재 재생 중인 브로드캐스트 일시정지
        if (soundRef.current) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await soundRef.current.pauseAsync();
            setCurrentlyPlaying(null);
            return;
          } else if (status.isLoaded && !status.isPlaying) {
            await soundRef.current.playAsync();
            return;
          }
        }
      }

      // 기존 사운드 정리
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // 새 사운드 로드 및 재생
      const { sound } = await Audio.Sound.createAsync(
        { uri: broadcast.audio_url },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setCurrentlyPlaying(null);
            setPlaybackPosition((prev) => ({ ...prev, [broadcast.id]: 0 }));
            
            // 자동 재생
            if (autoplay) {
              const currentIndex = broadcasts.findIndex((b) => b.id === broadcast.id);
              if (currentIndex < broadcasts.length - 1) {
                playBroadcast(broadcasts[currentIndex + 1]);
              }
            }
          }
          if (status.isLoaded && status.positionMillis) {
            setPlaybackPosition((prev) => ({
              ...prev,
              [broadcast.id]: status.positionMillis / 1000,
            }));
          }
        }
      );

      soundRef.current = sound;
      setCurrentlyPlaying(broadcast.id);
      
      // 수신한 브로드캐스트인 경우 읽음 상태로 업데이트
      if (filter === 'received' && broadcast.recipient_status !== 'read' && broadcast.recipient_status !== 'replied') {
        try {
          await axiosInstance.patch(`/api/v1/broadcasts/${broadcast.id}/mark_as_read`);
          // 로컬 상태 업데이트
          setBroadcasts(prev => prev.map(b => 
            b.id === broadcast.id 
              ? { ...b, recipient_status: 'read' } 
              : b
          ));
        } catch (error) {
          console.error('브로드캐스트 읽음 처리 실패:', error);
        }
      }
    } catch (error) {
      console.error('브로드캐스트 재생 실패:', error);
      Alert.alert(t('error.title'), t('error.play_failed'));
    }
  };

  // 브로드캐스트에 답장하기
  const handleReplyBroadcast = async (broadcast: Broadcast) => {
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    
    // 답장 화면으로 이동
    router.push({
      pathname: '/broadcast/reply',
      params: { 
        broadcastId: broadcast.id,
        senderName: broadcast.user.nickname,
        senderId: broadcast.user_id
      }
    });
  };

  // 브로드캐스트 즐겨찾기 토글
  const toggleFavorite = async (broadcast: Broadcast) => {
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    
    try {
      const updatedBroadcast = { ...broadcast, is_favorite: !broadcast.is_favorite };
      
      // 로컬 상태 업데이트 (낙관적 UI 업데이트)
      setBroadcasts(broadcasts.map(b => 
        b.id === broadcast.id ? updatedBroadcast : b
      ));
      
      // 서버에 업데이트 요청
      await axiosInstance.post(`/api/broadcasts/${broadcast.id}/toggle_favorite`);
    } catch (error) {
      console.error('즐겨찾기 업데이트 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.favoriteError'));
      
      // 실패 시 원래 상태로 복원
      setBroadcasts(broadcasts.map(b => 
        b.id === broadcast.id ? broadcast : b
      ));
    }
  };

  // 브로드캐스트 신고
  const reportBroadcast = async (broadcast: Broadcast) => {
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    
    // 확인 알림
    Alert.alert(
      t('broadcast.reportConfirmTitle'),
      t('broadcast.reportConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.confirm'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await axiosInstance.post(`/api/broadcasts/${broadcast.id}/report`);
              Alert.alert(t('common.success'), t('broadcast.reportSuccess'));
            } catch (error) {
              console.error('신고 실패:', error);
              Alert.alert(t('common.error'), t('broadcast.reportError'));
            }
          }
        }
      ]
    );
  };

  // 브로드캐스트 차단
  const blockUser = async (broadcast: Broadcast) => {
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    
    // 확인 알림
    Alert.alert(
      t('broadcast.blockConfirmTitle'),
      t('broadcast.blockConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.confirm'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await axiosInstance.post(`/api/users/${broadcast.user_id}/block`);
              Alert.alert(t('common.success'), t('broadcast.blockSuccess'));
              
              // 차단된 사용자의 브로드캐스트 제거
              setBroadcasts(broadcasts.filter(b => b.user_id !== broadcast.user_id));
            } catch (error) {
              console.error('차단 실패:', error);
              Alert.alert(t('common.error'), t('broadcast.blockError'));
            }
          }
        }
      ]
    );
  };

  // 브로드캐스트 삭제 (자신의 브로드캐스트만)
  const deleteBroadcast = async (broadcast: Broadcast) => {
    // 확인 알림
    Alert.alert(
      t('broadcast.deleteConfirmTitle'),
      t('broadcast.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await axiosInstance.delete(`/api/broadcasts/${broadcast.id}`);
              Alert.alert(t('common.success'), t('broadcast.deleteSuccess'));
              
              // 삭제된 브로드캐스트 제거
              setBroadcasts(broadcasts.filter(b => b.id !== broadcast.id));
            } catch (error) {
              console.error('삭제 실패:', error);
              Alert.alert(t('common.error'), t('broadcast.deleteError'));
            }
          }
        }
      ]
    );
  };

  // 필터 변경 처리
  const handleFilterChange = useCallback((newFilter: BroadcastFilter) => {
    setFilter(newFilter);
    setBroadcasts([]);
    setPage(1);
    setHasMore(true);
  }, []);

  // 브로드캐스트 아이템 렌더링
  const renderBroadcastItem = ({ item }: { item: Broadcast }) => {
    const isPlaying = currentlyPlaying === item.id;
    const isOwnBroadcast = user && user.id === item.user_id;
    
    const formatDuration = (seconds: number = 0) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    const formatRelativeTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
      
      if (diffInSeconds < 60) return t('common.justNow');
      if (diffInSeconds < 3600) return t('common.minutesAgo', { minutes: Math.floor(diffInSeconds / 60) });
      if (diffInSeconds < 86400) return t('common.hoursAgo', { hours: Math.floor(diffInSeconds / 3600) });
      if (diffInSeconds < 604800) return t('common.daysAgo', { days: Math.floor(diffInSeconds / 86400) });
      
      return date.toLocaleDateString();
    };
    
    return (
      <TouchableOpacity 
        style={styles.broadcastItem}
        onPress={() => playBroadcast(item)}
        activeOpacity={0.7}
      >
        <View style={styles.broadcastContent}>
          {/* 재생 버튼 */}
          <View style={styles.playButtonContainer}>
            <Ionicons 
              name={isPlaying ? "pause-circle" : "play-circle"} 
              size={48} 
              color="#007AFF" 
            />
          </View>
          
          {/* 콘텐츠 정보 */}
          <View style={styles.itemInfo}>
            <View style={styles.headerRow}>
              <ThemedText style={styles.userName}>{item.user.nickname}</ThemedText>
              {item.duration && (
                <ThemedText style={styles.duration}>{formatDuration(item.duration)}</ThemedText>
              )}
            </View>
            
            <ThemedText style={styles.userDetails}>
              {[item.user.gender, item.user.age_group, item.user.region].filter(Boolean).join(' · ')}
            </ThemedText>
            
            <View style={styles.bottomRow}>
              <ThemedText style={styles.time}>
                {formatRelativeTime(item.received_at || item.created_at)}
              </ThemedText>
              
              {/* 수신 상태 표시 */}
              {item.recipient_status && (
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: 
                    item.recipient_status === 'replied' ? '#E8F5E9' : 
                    item.recipient_status === 'read' ? '#E3F2FD' : '#F5F5F5' 
                  }
                ]}>
                  <ThemedText style={[
                    styles.statusText,
                    { color: 
                      item.recipient_status === 'replied' ? '#4CAF50' : 
                      item.recipient_status === 'read' ? '#2196F3' : '#999' 
                    }
                  ]}>
                    {t(`broadcast.status.${item.recipient_status}`)}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
          
          {/* 액션 버튼 */}
          <View style={styles.actionContainer}>
            {isOwnBroadcast ? (
              <TouchableOpacity 
                onPress={() => deleteBroadcast(item)}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={() => handleReplyBroadcast(item)}
                style={styles.actionButton}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 새 브로드캐스트 녹음 화면으로 이동
  const goToRecordScreen = () => {
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    
    router.push('/broadcast/record');
  };

  // 푸터 렌더링 (더 불러오기)
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <ThemedView style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <ThemedText style={styles.footerText}>{t('common.loadingMore')}</ThemedText>
      </ThemedView>
    );
  };

  const renderHeader = () => (
    <ThemedView style={styles.headerContainer}>
      <ThemedText style={styles.title}>{t('broadcast.title')}</ThemedText>
      
      {/* 필터 탭 추가 */}
      <View style={styles.filterContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, filter === 'received' && styles.activeTab]}
            onPress={() => handleFilterChange('received')}
          >
            <ThemedText style={[styles.tabText, filter === 'received' && styles.activeTabText]}>
              {t('broadcast.received')}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'sent' && styles.activeTab]}
            onPress={() => handleFilterChange('sent')}
          >
            <ThemedText style={[styles.tabText, filter === 'sent' && styles.activeTabText]}>
              {t('broadcast.sent')}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'all' && styles.activeTab]}
            onPress={() => handleFilterChange('all')}
          >
            <ThemedText style={[styles.tabText, filter === 'all' && styles.activeTabText]}>
              {t('broadcast.all')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
      
      <StylishButton
        title={t('broadcast.record')}
        icon={<Ionicons name="mic" size={20} color="#FFF" />}
        onPress={goToRecordScreen}
        type="primary"
        style={{ marginTop: 16 }}
      />
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      {renderHeader()}
      
      {loading && !refreshing ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <StylishButton
            title={t('common.retry')}
            onPress={handleRefresh}
            type="primary"
            size="medium"
            icon={<Ionicons name="refresh" size={18} color="#FFFFFF" />}
          />
        </ThemedView>
      ) : broadcasts.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <Ionicons name="radio-outline" size={64} color="#CCCCCC" />
          <ThemedText style={styles.emptyText}>{t('broadcast.empty')}</ThemedText>
          <StylishButton
            title={t('broadcast.refresh')}
            onPress={handleRefresh}
            type="secondary"
            size="medium"
            icon={<Ionicons name="refresh" size={18} color="#FFFFFF" />}
          />
        </ThemedView>
      ) : (
        <FlatList
          data={broadcasts}
          renderItem={renderBroadcastItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterContainer: {
    marginVertical: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#666666',
  },
  listContent: {
    paddingBottom: 16,
  },
  broadcastItem: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  broadcastContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  userDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
});