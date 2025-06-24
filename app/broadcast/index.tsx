import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance, { setTestMode } from '../lib/axios';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';

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
}

export default function BroadcastScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [autoplay, setAutoplay] = useState<boolean>(true);

  // 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('app_settings');
        if (storedSettings) {
          const { autoplayEnabled } = JSON.parse(storedSettings);
          setAutoplay(autoplayEnabled);
        }
      } catch (error) {
        console.error('설정 로드 실패:', error);
      }
    };

    loadSettings();
  }, []);

  // 브로드캐스트 목록 불러오기
  useEffect(() => {
    // 테스트 모드 활성화 (개발 중 실제 API 서버 연결에 문제가 있을 때만 사용)
    // 실제 서버와의 연결이 필요한 경우 false로 설정
    setTestMode(false);
    console.log('[브로드캐스트] 테스트 모드 비활성화');
    
    loadBroadcasts();
    
    // 화면 언마운트 시 오디오 정리
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // 브로드캐스트 목록 불러오기 함수
  const loadBroadcasts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get<{ broadcasts: Broadcast[] }>('/broadcasts');
      setBroadcasts(response.data.broadcasts);
    } catch (error) {
      console.error('브로드캐스트 목록 로드 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 새로고침
  const handleRefresh = () => {
    setRefreshing(true);
    loadBroadcasts();
  };

  // 브로드캐스트 재생
  const playBroadcast = async (broadcast: Broadcast) => {
    try {
      // 이미 재생 중인 오디오가 있으면 중지
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // 같은 브로드캐스트를 다시 클릭하면 재생 중지
      if (currentlyPlaying === broadcast.id) {
        setCurrentlyPlaying(null);
        return;
      }

      // 새 오디오 로드 및 재생
      const { sound } = await Audio.Sound.createAsync(
        { uri: broadcast.audio_url },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      setCurrentlyPlaying(broadcast.id);

      // 재생 완료 시 상태 업데이트
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setCurrentlyPlaying(null);
        }
      });
    } catch (error) {
      console.error('오디오 재생 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.playError'));
    }
  };

  // 브로드캐스트에 답장
  const replyToBroadcast = (broadcast: Broadcast) => {
    router.push({
      pathname: '/conversation/new',
      params: { broadcastId: broadcast.id }
    });
  };

  // 브로드캐스트 즐겨찾기 토글
  const toggleFavorite = async (broadcast: Broadcast) => {
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
    try {
      await axiosInstance.post(`/api/broadcasts/${broadcast.id}/report`);
      Alert.alert(t('common.success'), t('broadcast.reportSuccess'));
    } catch (error) {
      console.error('신고 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.reportError'));
    }
  };

  // 브로드캐스트 차단
  const blockUser = async (broadcast: Broadcast) => {
    try {
      await axiosInstance.post(`/api/users/${broadcast.user_id}/block`);
      Alert.alert(t('common.success'), t('broadcast.blockSuccess'));
      
      // 차단된 사용자의 브로드캐스트 제거
      setBroadcasts(broadcasts.filter(b => b.user_id !== broadcast.user_id));
    } catch (error) {
      console.error('차단 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.blockError'));
    }
  };

  // 브로드캐스트 삭제 (자신의 브로드캐스트만)
  const deleteBroadcast = async (broadcast: Broadcast) => {
    try {
      await axiosInstance.delete(`/api/broadcasts/${broadcast.id}`);
      Alert.alert(t('common.success'), t('broadcast.deleteSuccess'));
      
      // 삭제된 브로드캐스트 제거
      setBroadcasts(broadcasts.filter(b => b.id !== broadcast.id));
    } catch (error) {
      console.error('삭제 실패:', error);
      Alert.alert(t('common.error'), t('broadcast.deleteError'));
    }
  };

  // 브로드캐스트 아이템 렌더링
  const renderBroadcastItem = ({ item }: { item: Broadcast }) => {
    const isPlaying = currentlyPlaying === item.id;
    
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
            
            {/* 자신의 브로드캐스트인 경우에만 삭제 버튼 표시 */}
            {/* TODO: 현재 사용자 ID와 비교하는 로직 추가 */}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => deleteBroadcast(item)}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  };

  // 새 브로드캐스트 녹음 화면으로 이동
  const goToRecordScreen = () => {
    router.push('/broadcast/record');
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
    marginBottom: 16,
  },
  userInfoText: {
    fontSize: 12,
    color: '#666666',
    marginRight: 8,
    backgroundColor: '#F0F0F0',
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
}); 