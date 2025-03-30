import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
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
}

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
      
      const response = await axiosInstance.get<{ broadcasts: Broadcast[], has_more: boolean }>(`/api/broadcasts?page=${currentPage}&limit=10`);
      
      if (resetPage) {
        setBroadcasts(response.data.broadcasts);
      } else {
        setBroadcasts(prev => [...prev, ...response.data.broadcasts]);
      }
      
      setHasMore(response.data.has_more);
      
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
  }, [page, t]);

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

  // 브로드캐스트 재생
  const playBroadcast = async (broadcast: Broadcast) => {
    try {
      // 이미 재생 중인 오디오가 있으면 중지
      if (soundRef.current) {
        // 현재 재생 위치 저장
        if (currentlyPlaying !== null) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            setPlaybackPosition(prev => ({
              ...prev,
              [currentlyPlaying]: status.positionMillis
            }));
          }
        }
        
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // 같은 브로드캐스트를 다시 클릭하면 재생 중지
      if (currentlyPlaying === broadcast.id) {
        setCurrentlyPlaying(null);
        return;
      }

      // 새 오디오 로드 및 재생
      const savedPosition = playbackPosition[broadcast.id] || 0;
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: broadcast.audio_url },
        { 
          shouldPlay: true,
          positionMillis: savedPosition,
        },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setCurrentlyPlaying(null);
            // 재생 완료 시 위치 초기화
            setPlaybackPosition(prev => ({
              ...prev,
              [broadcast.id]: 0
            }));
            
            // 자동재생 활성화 시 다음 브로드캐스트 재생
            if (autoplay) {
              const currentIndex = broadcasts.findIndex(b => b.id === broadcast.id);
              if (currentIndex >= 0 && currentIndex < broadcasts.length - 1) {
                const nextBroadcast = broadcasts[currentIndex + 1];
                playBroadcast(nextBroadcast);
              }
            }
          }
        }
      );
      
      soundRef.current = sound;
      setCurrentlyPlaying(broadcast.id);
    } catch (error) {
      console.error('오디오 재생 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.playError'));
    }
  };

  // 브로드캐스트에 답장
  const replyToBroadcast = (broadcast: Broadcast) => {
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/auth/login' as any) }
        ]
      );
      return;
    }
    
    router.push({
      pathname: '/conversation/new' as any,
      params: { broadcastId: broadcast.id }
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
          { text: t('auth.login'), onPress: () => router.push('/auth/login' as any) }
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
          { text: t('auth.login'), onPress: () => router.push('/auth/login' as any) }
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
          { text: t('auth.login'), onPress: () => router.push('/auth/login' as any) }
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

  // 브로드캐스트 아이템 렌더링
  const renderBroadcastItem = ({ item }: { item: Broadcast }) => {
    const isPlaying = currentlyPlaying === item.id;
    const isOwnBroadcast = user && user.id === item.user_id;
    
    const formatDuration = (seconds: number = 0) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    return (
      <ThemedView style={styles.broadcastItem}>
        <ThemedView style={styles.broadcastHeader}>
          <ThemedText type="subtitle">{item.user.nickname}</ThemedText>
          <ThemedText style={styles.timestamp}>
            {new Date(item.created_at).toLocaleString()}
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.userInfo}>
          {item.user.gender && (
            <ThemedText style={styles.userInfoText}>
              {t(`profile.gender${item.user.gender.charAt(0).toUpperCase() + item.user.gender.slice(1)}`)}
            </ThemedText>
          )}
          {item.user.age_group && (
            <ThemedText style={styles.userInfoText}>
              {t(`profile.age${item.user.age_group.charAt(0).toUpperCase() + item.user.age_group.slice(1)}`)}
            </ThemedText>
          )}
          {item.user.region && (
            <ThemedText style={styles.userInfoText}>
              {item.user.region}
            </ThemedText>
          )}
          {item.duration && (
            <ThemedText style={styles.durationText}>
              {formatDuration(item.duration)}
            </ThemedText>
          )}
        </ThemedView>
        
        <ThemedView style={styles.audioPlayer}>
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => playBroadcast(item)}
          >
            <Ionicons 
              name={isPlaying ? "pause-circle" : "play-circle"} 
              size={48} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          
          <ThemedView style={styles.audioWaveform}>
            {/* 오디오 파형 표시 (간단한 구현) */}
            {Array.from({ length: 20 }).map((_, index) => (
              <ThemedView 
                key={index}
                style={[
                  styles.waveformBar,
                  { 
                    height: Math.random() * 20 + 5,
                    opacity: isPlaying ? 1 : 0.5
                  }
                ]}
              />
            ))}
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.actionButtons}>
          <StylishButton
            title={t('broadcast.reply')}
            onPress={() => replyToBroadcast(item)}
            type="primary"
            size="small"
            icon={<Ionicons name="chatbubble" size={16} color="#FFFFFF" />}
          />
          
          <StylishButton
            title={item.is_favorite ? t('broadcast.unfavorite') : t('broadcast.favorite')}
            onPress={() => toggleFavorite(item)}
            type={item.is_favorite ? "secondary" : "outline"}
            size="small"
            icon={<Ionicons name={item.is_favorite ? "star" : "star-outline"} size={16} color={item.is_favorite ? "#FFFFFF" : "#000000"} />}
          />
          
          <ThemedView style={styles.moreActions}>
            {!isOwnBroadcast && (
              <>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => reportBroadcast(item)}
                >
                  <Ionicons name="flag-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => blockUser(item)}
                >
                  <Ionicons name="ban-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </>
            )}
            
            {/* 자신의 브로드캐스트인 경우에만 삭제 버튼 표시 */}
            {isOwnBroadcast && (
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => deleteBroadcast(item)}
              >
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </ThemedView>
        </ThemedView>
      </ThemedView>
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
          { text: t('auth.login'), onPress: () => router.push('/auth/login' as any) }
        ]
      );
      return;
    }
    
    router.push('/broadcast/record' as any);
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

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{t('broadcast.title')}</ThemedText>
        
        <StylishButton
          title={t('broadcast.record')}
          onPress={goToRecordScreen}
          type="primary"
          size="medium"
          icon={<Ionicons name="mic" size={18} color="#FFFFFF" />}
        />
      </ThemedView>
      
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  broadcastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
  },
  userInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  userInfoText: {
    fontSize: 12,
    color: '#666666',
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#666666',
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#E6F2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playButton: {
    marginRight: 16,
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#007AFF',
    marginHorizontal: 2,
    borderRadius: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moreActions: {
    flexDirection: 'row',
  },
  iconButton: {
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