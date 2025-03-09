// app/(tabs)/index.tsx
import { Image, StyleSheet } from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

export default function HomeScreen() {
  useEffect(() => {
    // 앱 실행 시 한 번, 푸시 알림 권한 요청 및 푸시 토큰 획득
    async function registerForPushNotificationsAsync() {
      // 권한 요청
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('푸시 알림 권한이 필요합니다!');
        return;
      }
      // 푸시 토큰 얻기
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('푸시 토큰:', token);
    }

    registerForPushNotificationsAsync();

    // 알림이 수신되었을 때 실행되는 리스너
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('알림 수신:', notification);
    });

    // 컴포넌트 언마운트 시 리스너 제거
    return () => subscription.remove();
  }, []);

  // 테스트용 알림 발송 함수
  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Voice Penpal',
        body: '새 메시지가 도착했습니다!',
      },
      trigger: { seconds: 2 }, // 2초 뒤 발송
    });
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">환영합니다!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">1단계: 푸시 알림 테스트</ThemedText>
        <ThemedText>
          아래{' '}
          <ThemedText type="defaultSemiBold" onPress={sendTestNotification}>
            푸시 알림 테스트
          </ThemedText>{' '}
          버튼을 눌러 푸시 알림이 잘 오는지 확인해보세요.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">2단계: 다른 화면 둘러보기</ThemedText>
        <ThemedText>
          화면 하단의 Messages 탭이나 Profile 탭을 눌러 더 많은 기능을 확인해보세요.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});