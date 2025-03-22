import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from './context/AuthContext';
import { Colors } from '../constants/Colors';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t('common.appName'), headerShown: true }} />
      <StatusBar style="auto" />

      <ScrollView style={styles.scrollView}>
        {/* 상단 인사 메시지 */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>{t('home.welcome')}</Text>
          <Text style={styles.welcomeSubtitle}>
            {isAuthenticated 
              ? t('home.loggedInAs', { nickname: user?.nickname || '사용자' })
              : t('home.notLoggedIn')}
          </Text>
        </View>

        {/* 메뉴 카드 */}
        <View style={styles.menuContainer}>
          {/* 방송 만들기 */}
          <Link href="/broadcast/record" asChild>
            <TouchableOpacity style={styles.menuCard}>
              <FontAwesome5 name="microphone" size={28} color="#0a7ea4" />
              <Text style={styles.menuTitle}>{t('broadcast.create')}</Text>
            </TouchableOpacity>
          </Link>

          {/* 메시지 */}
          <Link href="/messages" asChild>
            <TouchableOpacity style={styles.menuCard}>
              <FontAwesome5 name="comment-alt" size={28} color="#0a7ea4" />
              <Text style={styles.menuTitle}>{t('messages.title')}</Text>
            </TouchableOpacity>
          </Link>

          {/* 지갑 */}
          <Link href="/wallet" asChild>
            <TouchableOpacity style={styles.menuCard}>
              <FontAwesome5 name="wallet" size={28} color="#0a7ea4" />
              <Text style={styles.menuTitle}>{t('wallet.title')}</Text>
            </TouchableOpacity>
          </Link>

          {/* 프로필 */}
          <Link href="/profile" asChild>
            <TouchableOpacity style={styles.menuCard}>
              <FontAwesome5 name="user" size={28} color="#0a7ea4" />
              <Text style={styles.menuTitle}>{t('profile.title')}</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* 바로가기 메뉴 */}
        <View style={styles.quickLinksContainer}>
          <Text style={styles.sectionTitle}>{t('common.quickLinks')}</Text>
          
          <View style={styles.quickLinksGrid}>
            {/* 설정 */}
            <Link href="/settings" asChild>
              <TouchableOpacity style={styles.quickLinkButton}>
                <FontAwesome5 name="cog" size={20} color="#687076" />
                <Text style={styles.quickLinkText}>{t('settings.title')}</Text>
              </TouchableOpacity>
            </Link>
            
            {/* 지갑 */}
            <Link href="/wallet" asChild>
              <TouchableOpacity style={styles.quickLinkButton}>
                <FontAwesome5 name="wallet" size={20} color="#687076" />
                <Text style={styles.quickLinkText}>{t('wallet.title')}</Text>
              </TouchableOpacity>
            </Link>
            
            {/* 제안하기 */}
            <Link href="/feedback" asChild>
              <TouchableOpacity style={styles.quickLinkButton}>
                <FontAwesome5 name="comment-dots" size={20} color="#687076" />
                <Text style={styles.quickLinkText}>{t('feedback.title')}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e3e5',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#11181c',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#687076',
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    color: '#11181c',
  },
  quickLinksContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#11181c',
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f3f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 12,
  },
  quickLinkText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#11181c',
  },
});

