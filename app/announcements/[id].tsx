import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { Announcement } from '../types';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 관리자 권한 확인 (UI 표시용만)
  useEffect(() => {
    if (isAuthenticated && user && user.id === 1) {
      setIsAdmin(true);
    }
  }, [isAuthenticated, user]);
  
  // 공지사항 상세 정보 불러오기
  useEffect(() => {
    const fetchAnnouncementDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axiosInstance.get(`/api/v1/announcements/${id}`);
        
        if (response.data) {
          setAnnouncement(response.data);
        } else {
          setError('공지사항 정보를 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('공지사항 상세 정보 로드 실패:', error);
        setError('공지사항을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchAnnouncementDetail();
    }
  }, [id]);
  
  // 날짜 포맷팅 함수
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // 줄바꿈 처리 함수
  const renderContent = (content: string): JSX.Element[] => {
    return content.split('\n').map((paragraph, index) => (
      <Text key={index} style={styles.contentParagraph}>
        {paragraph || ' '} {/* 빈 줄이 있는 경우 공백 문자 추가 */}
      </Text>
    ));
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>공지사항</Text>
        
        <View style={styles.headerSpacer} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>공지사항을 불러오는 중...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>목록으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      ) : announcement ? (
        <ScrollView style={styles.contentContainer}>
          <View style={styles.announcementHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{announcement.category.name}</Text>
            </View>
            
            {announcement.is_important && (
              <View style={styles.importantBadge}>
                <Text style={styles.importantBadgeText}>중요</Text>
              </View>
            )}
            
            {isAdmin && !announcement.is_published && (
              <View style={[styles.importantBadge, styles.unpublishedBadge]}>
                <Text style={styles.importantBadgeText}>미게시</Text>
              </View>
            )}
            
            {isAdmin && announcement.is_hidden && (
              <View style={[styles.importantBadge, styles.hiddenBadge]}>
                <Text style={styles.importantBadgeText}>숨김</Text>
              </View>
            )}
            
            <Text style={styles.announcementTitle}>{announcement.title}</Text>
            
            <Text style={styles.dateText}>
              {formatDate(announcement.published_at || announcement.created_at)}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.announcementBody}>
            {renderContent(announcement.content)}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>공지사항을 찾을 수 없습니다.</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>목록으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  announcementHeader: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666666',
  },
  importantBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
    marginLeft: 8,
  },
  unpublishedBadge: {
    backgroundColor: '#FF9500',
  },
  hiddenBadge: {
    backgroundColor: '#5856D6',
  },
  importantBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  announcementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#999999',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  announcementBody: {
    padding: 16,
  },
  contentParagraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 12,
  },
}); 