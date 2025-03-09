import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import axiosInstance from '../lib/axios';
import VoiceRecorder from '../../components/VoiceRecorder';
import VoicePlayer from '../../components/VoicePlayer';
import { Ionicons } from '@expo/vector-icons';

export default function BroadcastList() {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/broadcasts');
      setBroadcasts(res.data);
    } catch (err) {
      console.log('브로드캐스트 로드 실패:', err.response?.data || err.message);
      Alert.alert('오류', '브로드캐스트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  // 녹음 완료 후 콜백
  const handleRecordingComplete = async (uri) => {
    try {
      // 녹음된 파일을 서버에 업로드
      const formData = new FormData();
      formData.append('voice_file', {
        uri,
        name: 'voice_broadcast.m4a',
        type: 'audio/m4a',
      });

      setLoading(true);
      const res = await axiosInstance.post('/api/broadcasts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('브로드캐스트 생성 성공:', res.data);
      setShowRecorder(false);
      Alert.alert('성공', '브로드캐스트가 생성되었습니다.');
      
      // 목록 새로고침
      fetchBroadcasts();
    } catch (err) {
      console.log('브로드캐스트 생성 실패:', err.response?.data || err.message);
      Alert.alert('오류', '브로드캐스트 생성에 실패했습니다.');
      setLoading(false);
    }
  };
  
  // 브로드캐스트에 응답
  const handleReplyToBroadcast = (broadcast) => {
    router.push(`/broadcast/${broadcast.id}`);
  };
  
  // 새로고침
  const handleRefresh = () => {
    setRefreshing(true);
    fetchBroadcasts();
  };

  // 브로드캐스트 아이템 렌더링
  const renderBroadcastItem = ({ item }) => {
    const createdDate = new Date(item.created_at);
    const formattedDate = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-${String(createdDate.getDate()).padStart(2, '0')}`;
    
    return (
      <View style={styles.broadcastItem}>
        <View style={styles.broadcastHeader}>
          <Text style={styles.nickname}>{item.user?.nickname || '익명'}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        
        <VoicePlayer 
          uri={item.voice_file_url} 
          style={styles.player} 
          onError={(error) => console.log('재생 오류:', error)}
        />
        
        <TouchableOpacity 
          style={styles.replyButton}
          onPress={() => handleReplyToBroadcast(item)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#007AFF" />
          <Text style={styles.replyText}>답장하기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>브로드캐스트</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setShowRecorder(!showRecorder)}
        >
          <Ionicons 
            name={showRecorder ? "close" : "mic"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
      
      {showRecorder && (
        <View style={styles.recorderContainer}>
          <Text style={styles.recorderTitle}>새 브로드캐스트 녹음</Text>
          <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
        </View>
      )}
      
      <FlatList
        data={broadcasts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBroadcastItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>로딩 중...</Text>
          ) : (
            <Text style={styles.emptyText}>브로드캐스트가 없습니다.</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  newButton: {
    backgroundColor: '#FF3B30',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  listContent: {
    padding: 16,
  },
  broadcastItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  broadcastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nickname: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#888',
  },
  player: {
    marginVertical: 10,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    padding: 8,
  },
  replyText: {
    color: '#007AFF',
    marginLeft: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  recorderContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  recorderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
});