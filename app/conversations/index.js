// app/conversations/index.js

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import axiosInstance, { setTestMode } from '../lib/axios'; // JWT 인증이 포함된 axios 인스턴스

export default function ConversationListScreen() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // 테스트 모드 확인
      console.log('[대화방] API 요청: GET /api/conversations');
      
      // GET /api/conversations
      const response = await axiosInstance.get('/conversations');
      console.log('[대화방] 응답 데이터:', response.data);
      
      // 응답 데이터 구조 확인
      if (response.data && response.data.conversations) {
        setConversations(response.data.conversations);
      } else {
        // 예전 API 형식인 경우
        setConversations(response.data);
      }
    } catch (error) {
      console.log('대화방 목록 불러오기 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 테스트 모드 활성화 (개발 중 실제 API 서버 연결에 문제가 있을 때만 사용)
    setTestMode(false);
    console.log('[대화방] 테스트 모드 비활성화');
    
    fetchConversations();
  }, []);

  const renderItem = ({ item }) => {
    // 예시로 "상대방 ID" 또는 "id" 표시
    return (
      <TouchableOpacity
        style={{ padding: 12, borderBottomWidth: 1, borderColor: '#ccc' }}
        onPress={() => {
          // expo-router에서 /conversations/[id] 로 이동
          // [id].js 화면에 { id: item.id } 전달
          // or "router.push('/conversations/' + item.id)"
        }}
      >
        <Text style={{ fontSize: 16 }}>Conversation ID: {item.id}</Text>
        <Text style={{ color: '#666' }}>
          user_a_id: {item.user_a_id}, user_b_id: {item.user_b_id}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>대화방 목록</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}