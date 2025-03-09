// app/conversations/index.js

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import axiosInstance from '../lib/axios'; // JWT 인증이 포함된 axios 인스턴스

export default function ConversationListScreen() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // GET /api/conversations
      const response = await axiosInstance.get('/api/conversations');
      setConversations(response.data); // 서버에서 [ {id, user_a_id, user_b_id, ...}, ... ] 식으로 반환되길 가정
    } catch (error) {
      console.log('대화방 목록 불러오기 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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