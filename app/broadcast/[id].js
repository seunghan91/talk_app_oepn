// app/broadcast/[id].js
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axiosInstance from '../lib/axios';
import VoicePlayer from '../../components/VoicePlayer';
import VoiceRecorder from '../../components/VoiceRecorder';
import { Ionicons } from '@expo/vector-icons';

// 브로드캐스트 상태 관리를 위한 리듀서
const initialState = {
  broadcast: null,
  loading: true,
  error: null,
  showReplyRecorder: false,
  replySending: false,
  replySuccess: false,
  conversationId: null
};

const broadcastReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, broadcast: action.payload, loading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'TOGGLE_REPLY_RECORDER':
      return { ...state, showReplyRecorder: action.payload };
    case 'REPLY_SENDING':
      return { ...state, replySending: true };
    case 'REPLY_SUCCESS':
      return { 
        ...state, 
        replySending: false, 
        replySuccess: true,
        conversationId: action.payload.conversation_id 
      };
    case 'REPLY_ERROR':
      return { ...state, replySending: false, error: action.payload };
    default:
      return state;
  }
};

// 브로드캐스트 정보 컴포넌트
const BroadcastInfo = ({ broadcast }) => {
  // 날짜 형식 변환
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  
  return (
    <View style={styles.userInfo}>
      <Text style={styles.nickname}>{broadcast.user?.nickname || '익명'}</Text>
      <Text style={styles.date}>{formatDate(broadcast.created_at)}</Text>
    </View>
  );
};

// 답장 컴포넌트
const ReplyRecorder = ({ onRecord, onCancel }) => {
  return (
    <View style={styles.replyContainer}>
      <Text style={styles.replyTitle}>답장 녹음하기</Text>
      <VoiceRecorder onRecordingComplete={onRecord} />
      
      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={onCancel}
      >
        <Text style={styles.cancelButtonText}>취소</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function BroadcastDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [state, dispatch] = useReducer(broadcastReducer, initialState);
  const { broadcast, loading, error, showReplyRecorder, replySending, replySuccess, conversationId } = state;
  
  // 브로드캐스트 상세 정보 불러오기
  useEffect(() => {
    const fetchBroadcastDetail = async () => {
      dispatch({ type: 'FETCH_START' });
      
      try {
        const response = await axiosInstance.get(`/api/broadcasts/${id}`);
        dispatch({ type: 'FETCH_SUCCESS', payload: response.data });
      } catch (error) {
        console.error('브로드캐스트 정보 로드 실패:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.error || '브로드캐스트 정보를 불러오는데 실패했습니다.';
        dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
        Alert.alert('오류', errorMessage);
      }
    };
    
    fetchBroadcastDetail();
  }, [id]);
  
  // 답장 녹음 토글
  const toggleReplyRecorder = useCallback((show) => {
    dispatch({ type: 'TOGGLE_REPLY_RECORDER', payload: show });
  }, []);
  
  // 답장 녹음 완료 처리
  const handleReplyRecorded = useCallback(async (uri) => {
    dispatch({ type: 'REPLY_SENDING' });
    
    try {
      // 답장 음성 파일 업로드
      const formData = new FormData();
      formData.append('voice_file', {
        uri: uri,
        name: 'voice_reply.m4a',
        type: 'audio/m4a',
      });
      
      const response = await axiosInstance.post(`/api/broadcasts/${id}/reply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60초로 타임아웃 늘림 (대용량 파일 업로드 고려)
      });
      
      dispatch({ type: 'REPLY_SUCCESS', payload: response.data });
      
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
      
      const errorMessage = error.response?.data?.error || '답장 전송에 실패했습니다.';
      dispatch({ type: 'REPLY_ERROR', payload: errorMessage });
      
      Alert.alert('오류', errorMessage, [
        { text: '다시 시도', onPress: () => toggleReplyRecorder(true) },
        { text: '취소', style: 'cancel' }
      ]);
    }
  }, [id, router]);
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>브로드캐스트 정보를 불러오는 중...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!broadcast) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="help-circle" size={48} color="#FF9500" />
        <Text style={styles.errorText}>브로드캐스트를 찾을 수 없습니다.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
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
        <BroadcastInfo broadcast={broadcast} />
        
        <VoicePlayer 
          uri={broadcast.voice_file_url} 
          style={styles.player}
        />
        
        {!replySending && !showReplyRecorder && !replySuccess && (
          <TouchableOpacity 
            style={styles.replyButton}
            onPress={() => toggleReplyRecorder(true)}
          >
            <Ionicons name="chatbubble" size={20} color="#fff" />
            <Text style={styles.replyButtonText}>답장하기</Text>
          </TouchableOpacity>
        )}
        
        {replySuccess && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.successText}>답장을 보냈습니다</Text>
            <TouchableOpacity 
              style={styles.viewConversationButton}
              onPress={() => router.push(`/conversations/${conversationId}`)}
            >
              <Text style={styles.viewConversationText}>대화 보기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {showReplyRecorder && !replySending && !replySuccess && (
        <ReplyRecorder 
          onRecord={handleReplyRecorded}
          onCancel={() => toggleReplyRecorder(false)}
        />
      )}
      
      {replySending && (
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
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginVertical: 20,
    textAlign: 'center',
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
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginTop: 8,
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
    marginTop: 16,
    alignSelf: 'center',
    padding: 10,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  sentContainer: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  sentText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#666',
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  successText: {
    fontSize: 16,
    marginTop: 8,
    color: '#34C759',
    fontWeight: 'bold',
  },
  viewConversationButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewConversationText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  }
});