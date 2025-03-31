import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../lib/axios';
import { useAuth } from '../context/AuthContext';

// 공지사항 인터페이스
interface Announcement {
  id: number;
  title: string;
  content: string;
  category_id: number;
  category: {
    id: number;
    name: string;
  };
  is_important: boolean;
  is_published: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  published_at: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 관리자 권한 확인
  useEffect(() => {
    const checkAdminStatus = async () => {
      // 실제 구현에서는 서버에서 확인하거나 사용자 정보에 role 필드를 확인해야 함
      // 현재는 테스트를 위해 user_id가 1인 경우 관리자 권한 부여
      if (isAuthenticated && user && user.id === 1) {
        setIsAdmin(true);
      }
    };
    
    checkAdminStatus();
  }, [isAuthenticated, user]);
  
  // 공지사항 카테고리 목록 불러오기
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/v1/announcement_categories');
      
      if (response.data && Array.isArray(response.data.categories)) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('카테고리 목록 로드 실패:', error);
    }
  }, []);
  
  // 공지사항 목록 불러오기
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/v1/announcements';
      if (selectedCategory) {
        url += `?category_id=${selectedCategory}`;
      }
      
      const response = await axiosInstance.get(url);
      
      if (response.data && Array.isArray(response.data.announcements)) {
        // 관리자는 모든 공지사항 볼 수 있음
        // 일반 사용자는 숨김 처리되지 않은 공지사항만 볼 수 있음
        const filteredAnnouncements = isAdmin 
          ? response.data.announcements 
          : response.data.announcements.filter((announcement: Announcement) => 
              announcement.is_published && !announcement.is_hidden
            );
        
        setAnnouncements(filteredAnnouncements);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('공지사항 목록 로드 실패:', error);
      Alert.alert('오류', '공지사항을 불러오는 중 오류가 발생했습니다.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, isAdmin]);
  
  // 초기 데이터 로드
  useEffect(() => {
    fetchCategories();
    fetchAnnouncements();
  }, [fetchCategories, fetchAnnouncements]);
  
  // 새로고침 처리
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnnouncements();
  }, [fetchAnnouncements]);
  
  // 공지사항 상세 페이지로 이동
  const viewAnnouncementDetail = (id: number) => {
    router.push(`/announcements/${id}`);
  };
  
  // 관리자 페이지로 이동
  const goToAdminPage = () => {
    router.push('/admin/notices');
  };
  
  // 공지사항 항목 렌더링
  const renderAnnouncementItem = ({ item }: { item: Announcement }) => {
    const date = new Date(item.published_at || item.created_at);
    const formattedDate = date.toLocaleDateString();
    
    return (
      <TouchableOpacity
        style={[
          styles.announcementItem,
          item.is_important && styles.importantAnnouncement
        ]}
        onPress={() => viewAnnouncementDetail(item.id)}
      >
        {item.is_important && (
          <View style={styles.importantBadge}>
            <Text style={styles.importantBadgeText}>중요</Text>
          </View>
        )}
        
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category.name}</Text>
        </View>
        
        <Text style={styles.announcementTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <Text style={styles.announcementDate}>{formattedDate}</Text>
      </TouchableOpacity>
    );
  };
  
  // 카테고리 필터 버튼 렌더링
  const renderCategoryButton = (category: Category | null) => {
    const isSelected = category === null 
      ? selectedCategory === null 
      : selectedCategory === category.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryButton, 
          isSelected && styles.selectedCategoryButton
        ]}
        onPress={() => {
          setSelectedCategory(category ? category.id : null);
        }}
      >
        <Text style={[
          styles.categoryButtonText,
          isSelected && styles.selectedCategoryButtonText
        ]}>
          {category ? category.name : '전체'}
        </Text>
      </TouchableOpacity>
    );
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
        
        {isAdmin && (
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={goToAdminPage}
          >
            <Ionicons name="settings-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
        
        {!isAdmin && <View style={styles.headerSpacer} />}
      </View>
      
      <View style={styles.categoryFilter}>
        <FlatList
          data={[null, ...categories]}
          renderItem={({ item }) => renderCategoryButton(item)}
          keyExtractor={(item) => (item ? item.id.toString() : 'all')}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>공지사항을 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderAnnouncementItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.announcementList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>
                {selectedCategory 
                  ? '선택한 카테고리에 공지사항이 없습니다.' 
                  : '등록된 공지사항이 없습니다.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
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
  adminButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  categoryFilter: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
  },
  categoryList: {
    paddingHorizontal: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F0F0F0',
  },
  selectedCategoryButton: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  announcementList: {
    padding: 16,
  },
  announcementItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  importantAnnouncement: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  importantBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  importantBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
}); 