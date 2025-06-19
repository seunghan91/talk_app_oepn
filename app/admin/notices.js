import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '@lib/axios';
import { useAuth } from '../context/AuthContext';

// 관리자 공지사항 관리 페이지
export default function AdminAnnouncementsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [announcements, setAnnouncements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 공지사항 수정/생성 관련 상태
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [isImportant, setIsImportant] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  
  // 관리자 권한 확인
  useEffect(() => {
    if (!user || user.id !== 1) {
      Alert.alert('접근 권한 없음', '관리자만 접근할 수 있는 페이지입니다.');
      router.replace('/');
    }
  }, [user, router]);
  
  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 카테고리 로드
        const categoriesResponse = await axiosInstance.get('/api/v1/announcement_categories');
        if (categoriesResponse.data && Array.isArray(categoriesResponse.data.categories)) {
          setCategories(categoriesResponse.data.categories);
        }
        
        // 공지사항 로드 (관리자는 모든 공지사항 확인 가능)
        const announcementsResponse = await axiosInstance.get('/api/v1/announcements');
        if (announcementsResponse.data && Array.isArray(announcementsResponse.data.announcements)) {
          setAnnouncements(announcementsResponse.data.announcements);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        Alert.alert('오류', '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    loadData();
  }, [refreshing]);
  
  // 공지사항 생성 폼 초기화
  const initNewAnnouncement = () => {
    setEditingAnnouncement(null);
    setTitle('');
    setContent('');
    setCategoryId(categories.length > 0 ? categories[0].id : null);
    setIsImportant(false);
    setIsPublished(true);
    setIsHidden(false);
  };
  
  // 공지사항 편집 준비
  const prepareEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setCategoryId(announcement.category_id);
    setIsImportant(announcement.is_important);
    setIsPublished(announcement.is_published);
    setIsHidden(announcement.is_hidden || false);
  };
  
  // 공지사항 저장 (생성 또는 수정)
  const saveAnnouncement = async () => {
    if (!title.trim() || !content.trim() || !categoryId) {
      Alert.alert('입력 오류', '제목, 내용, 카테고리를 모두 입력해주세요.');
      return;
    }
    
    const announcementData = {
      title: title.trim(),
      content: content.trim(),
      category_id: categoryId,
      is_important: isImportant,
      is_published: isPublished,
      is_hidden: isHidden
    };
    
    try {
      let response;
      
      if (editingAnnouncement) {
        // 수정
        response = await axiosInstance.put(
          `/api/v1/announcements/${editingAnnouncement.id}`,
          announcementData
        );
        
        if (response.data && response.data.success) {
          Alert.alert('성공', '공지사항이 수정되었습니다.');
          setRefreshing(true);
          initNewAnnouncement();
        }
      } else {
        // 생성
        response = await axiosInstance.post('/api/v1/announcements', announcementData);
        
        if (response.data && response.data.success) {
          Alert.alert('성공', '새 공지사항이 등록되었습니다.');
          setRefreshing(true);
          initNewAnnouncement();
        }
      }
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
      Alert.alert('오류', '공지사항을 저장하는 중 오류가 발생했습니다.');
    }
  };
  
  // 공지사항 삭제
  const deleteAnnouncement = async (id) => {
    Alert.alert(
      '삭제 확인',
      '이 공지사항을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axiosInstance.delete(`/api/v1/announcements/${id}`);
              
              if (response.data && response.data.success) {
                Alert.alert('성공', '공지사항이 삭제되었습니다.');
                setRefreshing(true);
                initNewAnnouncement();
              }
            } catch (error) {
              console.error('공지사항 삭제 실패:', error);
              Alert.alert('오류', '공지사항을 삭제하는 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };
  
  // 공지사항 아이템 렌더링
  const renderAnnouncementItem = ({ item }) => {
    const categoryName = categories.find(c => c.id === item.category_id)?.name || '카테고리 없음';
    
    return (
      <View style={styles.announcementItem}>
        <View style={styles.announcementHeader}>
          <Text style={styles.announcementTitle} numberOfLines={1}>
            {item.title}
          </Text>
          
          <View style={styles.badgeContainer}>
            {item.is_important && (
              <View style={[styles.badge, styles.importantBadge]}>
                <Text style={styles.badgeText}>중요</Text>
              </View>
            )}
            
            {!item.is_published && (
              <View style={[styles.badge, styles.unpublishedBadge]}>
                <Text style={styles.badgeText}>미게시</Text>
              </View>
            )}
            
            {item.is_hidden && (
              <View style={[styles.badge, styles.hiddenBadge]}>
                <Text style={styles.badgeText}>숨김</Text>
              </View>
            )}
            
            <View style={[styles.badge, styles.categoryBadge]}>
              <Text style={styles.badgeText}>{categoryName}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => prepareEdit(item)}
          >
            <Ionicons name="create-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>수정</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteAnnouncement(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
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
        
        <Text style={styles.headerTitle}>공지사항 관리</Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={initNewAnnouncement}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* 공지사항 작성/수정 폼 */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>
            {editingAnnouncement ? '공지사항 수정' : '새 공지사항 작성'}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="제목"
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={[styles.input, styles.contentInput]}
            placeholder="내용"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>카테고리:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScrollView}
            >
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    categoryId === category.id && styles.selectedCategoryButton
                  ]}
                  onPress={() => setCategoryId(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      categoryId === category.id && styles.selectedCategoryButtonText
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>중요 공지:</Text>
            <Switch
              value={isImportant}
              onValueChange={setIsImportant}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isImportant ? "#007AFF" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>게시 상태:</Text>
            <Switch
              value={isPublished}
              onValueChange={setIsPublished}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isPublished ? "#007AFF" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>일반 사용자에게 숨기기:</Text>
            <Switch
              value={isHidden}
              onValueChange={setIsHidden}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isHidden ? "#007AFF" : "#f4f3f4"}
            />
          </View>
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveAnnouncement}
          >
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
          
          {editingAnnouncement && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={initNewAnnouncement}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* 공지사항 목록 */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>공지사항 목록</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          ) : (
            <FlatList
              data={announcements}
              renderItem={renderAnnouncementItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>등록된 공지사항이 없습니다.</Text>
              }
              contentContainerStyle={styles.announcementList}
            />
          )}
        </View>
      </ScrollView>
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
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  contentInput: {
    height: 120,
    paddingTop: 12,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  formLabel: {
    flex: 1,
    fontSize: 16,
  },
  categoryScrollView: {
    flex: 2,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
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
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 32,
  },
  loader: {
    marginVertical: 32,
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999999',
    marginVertical: 32,
  },
  announcementList: {
    paddingBottom: 16,
  },
  announcementItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  announcementHeader: {
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    marginBottom: 4,
  },
  importantBadge: {
    backgroundColor: '#FF3B30',
  },
  unpublishedBadge: {
    backgroundColor: '#FF9500',
  },
  hiddenBadge: {
    backgroundColor: '#5856D6',
  },
  categoryBadge: {
    backgroundColor: '#34C759',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
}); 