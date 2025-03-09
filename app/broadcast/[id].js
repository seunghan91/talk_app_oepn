// app/broadcast/[id].js
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axiosInstance from '../lib/axios';
import VoicePlayer from '../../components/VoicePlayer';
import VoiceRecorder from '../../components/VoiceRecorder';
import { Ionicons } from '@expo/vector-icons';

export default function BroadcastDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [broadcast, setBroadcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReplyRecorder, setShowReplyRecorder] = useState(false);
  const [replyingSent, setReplySent] = useState(false);
  
  // 브로드캐스트 상세 정보 불러오기
  useEffect(() => {
    const fetchBroadcastDetail = async () => {
      try {
        const response = await axiosInstance.get(`/api/broadcasts/${id}`);
        setBroadcast(response.data);
      } catch (error) {
        console.error('브로드캐스트 정보 로드 실패:', error.response?.data || error.message);
        Alert.alert('오류', '브로드캐스트 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBroadcastDetail();
  }, [id]);
  
  // 답장 녹음 완료 처리
  const handleReplyRecorded = async (uri) => {
    try {
      setReplySent(true);
      
      // 답장 음성 파일 업로드
      const formData = new FormData();
      formData.append('voice_file', {
        uri: uri,
        name: 'voice_reply.m4a',
        type: 'audio/m4a',
      });
      
      const response = await axiosInstance.post(`/api/broadcasts/${id}/reply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      Alert.alert(
        '답장 완료',
        '메시지가 성공적으로 전송되었습니다.',
        [
          { 
            text: '대화 보기', 
            onPress: () => router.push(`/conversations/${response.data.conversation_id}`) 
          },
          { text: '확인', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      console.error('답장 전송 실패:', error.response?.data || error.message);
      Alert.alert('오류', '답장 전송에 실패했습니다.');
      setReplySent(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }
  
  if (!broadcast) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>브로드캐스트를 찾을 수 없습니다.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // 날짜 형식 변환
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>브로드캐스트</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.broadcastContainer}>
        <View style={styles.userInfo}>
          <Text style={styles.nickname}>{broadcast.user?.nickname || '익명'}</Text>
          <Text style={styles.date}>{formatDate(broadcast.created_at)}</Text>
        </View>
        
        <VoicePlayer 
          uri={broadcast.voice_file_url} 
          style={styles.player}
        />
        
        {!replyingSent && !showReplyRecorder && (
          <TouchableOpacity 
            style={styles.replyButton}
            onPress={() => setShowReplyRecorder(true)}
          >
            <Ionicons name="chatbubble" size={20} color="#fff" />
            <Text style={styles.replyButtonText}>답장하기</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {showReplyRecorder && !replyingSent && (
        <View style={styles.replyContainer}>
          <Text style={styles.replyTitle}>답장 녹음하기</Text>
          <VoiceRecorder onRecordingComplete={handleReplyRecorded} />
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setShowReplyRecorder(false)}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {replyingSent && (
        <View style={styles.sentContainer}>
          <ActivityIndicator size="small" color="#0000ff" />
          <Text style={styles.sentText}>답장 전송 중...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  broadcastContainer: {
    padding: 20,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  nickname: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  player: {
    marginBottom: 20,
  },
  replyButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
  replyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  replyContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  replyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  sentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  sentText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});