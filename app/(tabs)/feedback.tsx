import React, { useState } from 'react';
import { StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { useAuth } from '../context/AuthContext';

export default function FeedbackScreen() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'bug' | 'feature' | 'other'>('bug');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 카테고리 선택 핸들러
  const handleCategorySelect = (selectedCategory: 'bug' | 'feature' | 'other') => {
    setCategory(selectedCategory);
  };

  // 제안 제출 핸들러
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('feedback.titleRequired'));
      return;
    }

    if (!content.trim()) {
      Alert.alert(t('common.error'), t('feedback.contentRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      // 테스트용 - 실제로는 서버에 제안 내용 전송
      // await axiosInstance.post('/api/feedback', {
      //   title,
      //   content,
      //   category,
      //   user_id: isAuthenticated ? user?.id : null
      // });

      // 성공 메시지 표시
      Alert.alert(
        t('common.success'),
        t('feedback.submitSuccess'),
        [{ text: t('common.ok'), onPress: () => {
          // 폼 초기화
          setTitle('');
          setContent('');
          setCategory('bug');
        }}]
      );
    } catch (error) {
      console.error('제안 제출 실패:', error);
      Alert.alert(t('common.error'), t('feedback.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        {/* 헤더 */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">{t('feedback.title')}</ThemedText>
        </ThemedView>
        
        {/* 설명 */}
        <ThemedView style={styles.descriptionContainer}>
          <Ionicons name="information-circle-outline" size={24} color="#007AFF" style={styles.infoIcon} />
          <ThemedText style={styles.description}>
            {t('feedback.description')}
          </ThemedText>
        </ThemedView>
        
        {/* 카테고리 선택 */}
        <ThemedView style={styles.categoryContainer}>
          <ThemedText style={styles.sectionTitle}>{t('feedback.category')}</ThemedText>
          
          <View style={styles.categoryButtons}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                category === 'bug' && styles.selectedCategory
              ]}
              onPress={() => handleCategorySelect('bug')}
            >
              <Ionicons 
                name="bug-outline" 
                size={24} 
                color={category === 'bug' ? '#FFFFFF' : '#007AFF'} 
              />
              <ThemedText 
                style={[
                  styles.categoryText,
                  category === 'bug' && styles.selectedCategoryText
                ]}
              >
                {t('feedback.bugReport')}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.categoryButton,
                category === 'feature' && styles.selectedCategory
              ]}
              onPress={() => handleCategorySelect('feature')}
            >
              <Ionicons 
                name="bulb-outline" 
                size={24} 
                color={category === 'feature' ? '#FFFFFF' : '#007AFF'} 
              />
              <ThemedText 
                style={[
                  styles.categoryText,
                  category === 'feature' && styles.selectedCategoryText
                ]}
              >
                {t('feedback.featureRequest')}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.categoryButton,
                category === 'other' && styles.selectedCategory
              ]}
              onPress={() => handleCategorySelect('other')}
            >
              <Ionicons 
                name="chatbubble-ellipses-outline" 
                size={24} 
                color={category === 'other' ? '#FFFFFF' : '#007AFF'} 
              />
              <ThemedText 
                style={[
                  styles.categoryText,
                  category === 'other' && styles.selectedCategoryText
                ]}
              >
                {t('feedback.otherFeedback')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
        
        {/* 제목 입력 */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.sectionTitle}>{t('feedback.titleLabel')}</ThemedText>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder={t('feedback.titlePlaceholder')}
            maxLength={100}
          />
        </ThemedView>
        
        {/* 내용 입력 */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.sectionTitle}>{t('feedback.contentLabel')}</ThemedText>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder={t('feedback.contentPlaceholder')}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </ThemedView>
        
        {/* 제출 버튼 */}
        <StylishButton
          title={isSubmitting ? t('common.processing') : t('feedback.submit')}
          onPress={handleSubmit}
          type="primary"
          size="large"
          icon={<Ionicons name="paper-plane" size={20} color="#FFFFFF" />}
          disabled={isSubmitting || !title.trim() || !content.trim()}
          loading={isSubmitting}
          style={styles.submitButton}
        />
        
        {/* 안내 메시지 */}
        <ThemedText style={styles.note}>
          {t('feedback.note')}
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 20,
  },
  descriptionContainer: {
    flexDirection: 'row',
    backgroundColor: '#E6F2FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  description: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  categoryButtons: {
    flexDirection: 'column',
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 20,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 160,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  note: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
}); 